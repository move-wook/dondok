-- 돈독 — 팀원별 통계 RPC (감량률 / 인증횟수 / 오늘 인증여부)
create or replace function member_stats(p_season_id bigint, p_team_id bigint)
returns table (
  user_id uuid, nickname text, role text,
  weight_loss_pct numeric, fat_loss_pct numeric,
  cert_count int, today_meal boolean, today_workout boolean
) language sql stable security definer
set search_path = public
as $$
  with base as (
    select user_id, weight_kg as bw, body_fat_kg as bf
    from inbody_history where is_baseline and season_id = p_season_id
  ),
  latest as (
    select distinct on (user_id) user_id, weight_kg as cw, body_fat_kg as cf
    from inbody_history where season_id = p_season_id
    order by user_id, measured_date desc
  ),
  today as (
    select user_id,
           bool_or(cert_type = 'MEAL')    as meal,
           bool_or(cert_type = 'WORKOUT') as workout
    from certification
    where season_id = p_season_id and cert_date = (now() at time zone 'Asia/Seoul')::date
    group by user_id
  ),
  cnt as (
    select user_id, count(*) as c from certification where season_id = p_season_id group by user_id
  )
  select
    p.id, p.nickname, p.role,
    round((b.bw - l.cw) / nullif(b.bw, 0) * 100, 1),
    round((b.bf - l.cf) / nullif(b.bf, 0) * 100, 1),
    coalesce(cnt.c, 0)::int,
    coalesce(t.meal, false),
    coalesce(t.workout, false)
  from profile p
  left join base   b ON b.user_id = p.id
  left join latest l ON l.user_id = p.id
  left join today  t ON t.user_id = p.id
  left join cnt      ON cnt.user_id = p.id
  where p.team_id = p_team_id
  order by 5 desc nulls last;   -- 체지방 감량률 높은 순
$$;
