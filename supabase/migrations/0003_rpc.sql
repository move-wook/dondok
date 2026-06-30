-- 돈독 MVP — 트리거 + RPC 함수

-- 신규 가입 시 profile 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profile(id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', '회원'))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────────────────────────────────────────────
-- 6.1 실시간 팀 랭킹 (최종 점수 = 체지방률×1.0 + 체중률×0.5 + 보너스×0.1)
create or replace function team_ranking(p_season_id bigint)
returns table (
  team_id bigint, team_name text,
  avg_weight_loss_pct numeric, avg_fat_loss_pct numeric,
  bonus_point int, final_score numeric, member_cnt int
) language sql stable security definer
set search_path = public
as $$
  with base as (
    select user_id, weight_kg as base_weight, body_fat_kg as base_fat
    from inbody_history
    where is_baseline and season_id = p_season_id
  ),
  latest as (
    select distinct on (user_id) user_id, weight_kg as cur_weight, body_fat_kg as cur_fat
    from inbody_history
    where season_id = p_season_id
    order by user_id, measured_date desc
  ),
  bonus as (
    select team_id, coalesce(sum(points),0) as bonus_point
    from team_bonus where season_id = p_season_id group by team_id
  )
  select
    p.team_id, t.name,
    round(avg((b.base_weight - l.cur_weight) / b.base_weight * 100), 2),
    round(avg((b.base_fat - l.cur_fat) / nullif(b.base_fat,0) * 100), 2),
    coalesce(bn.bonus_point,0)::int,
    round(
        avg((b.base_fat    - l.cur_fat)    / nullif(b.base_fat,0) * 100) * 1.0
      + avg((b.base_weight - l.cur_weight) / b.base_weight        * 100) * 0.5
      + coalesce(bn.bonus_point,0)                                       * 0.1
    , 2),
    count(*)::int
  from profile p
  join base   b  on b.user_id = p.id
  join latest l  on l.user_id = p.id
  join team   t  on t.team_id = p.team_id
  left join bonus bn on bn.team_id = p.team_id
  where t.season_id = p_season_id
  group by p.team_id, t.name, bn.bonus_point
  order by 6 desc, 4 desc, 5 desc;     -- final_score → fat → bonus
$$;

-- 6.2 데일리 보너스 판정: 전원 풀인증 팀에 1행 적재
create or replace function award_team_bonus(p_season_id bigint, p_date date)
returns void language sql security definer
set search_path = public
as $$
  insert into team_bonus(team_id, season_id, bonus_date, points)
  select p.team_id, p_season_id, p_date, 10
  from profile p
  join (
    select user_id, count(distinct cert_type) as types
    from certification
    where cert_date = p_date and season_id = p_season_id
    group by user_id
  ) done on done.user_id = p.id
  group by p.team_id
  having count(*) filter (where done.types = 2)
         = (select count(*) from profile where team_id = p.team_id)
  on conflict (team_id, bonus_date) do nothing;
$$;

-- 6.4 팀 스트릭: '전원 풀인증일'의 오늘부터 연속 일수 (gaps-and-islands)
create or replace function team_streak(p_team_id bigint, p_season_id bigint)
returns int language sql stable
set search_path = public
as $$
  with d as (
    select bonus_date,
           bonus_date - (row_number() over (order by bonus_date))::int as grp
    from team_bonus
    where team_id = p_team_id and season_id = p_season_id
  )
  select coalesce((
    select count(*) from d
    where grp = (select grp from d order by bonus_date desc limit 1)
      and (select max(bonus_date) from d) >= (now() at time zone 'Asia/Seoul')::date - 1
  ), 0)::int;
$$;

-- 6.4 주간 공동 목표: 이번 주(월~오늘) 진행 (done / goal)
create or replace function team_week_progress(p_team_id bigint, p_season_id bigint)
returns table (done int, goal int) language sql stable
set search_path = public
as $$
  with wk as (
    select date_trunc('week', (now() at time zone 'Asia/Seoul'))::date as wk_start,
           (now() at time zone 'Asia/Seoul')::date as today
  ),
  m as (select count(*)::int as cnt from profile where team_id = p_team_id)
  select
    (select count(distinct (c.user_id, c.cert_date, c.cert_type))
       from certification c, wk
      where c.season_id = p_season_id
        and c.user_id in (select id from profile where team_id = p_team_id)
        and c.cert_date between wk.wk_start and wk.today)::int as done,
    (m.cnt * 2 * (select today - wk_start + 1 from wk))::int as goal
  from m;
$$;
