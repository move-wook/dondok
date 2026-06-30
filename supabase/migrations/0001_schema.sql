-- 돈독(Don-Dok) MVP — 스키마 (Postgres 15 / Supabase)
-- 적용 순서: 본 파일 → 0002_rls.sql → 0003_rpc.sql → seed.sql
--
-- 외래키 정책: FK 제약(CONSTRAINT)은 걸지 않는다. 컬럼 + 주석으로 "논리적 관계"만 명시한다.
--   정합성은 앱 코드/RPC에서 보장. (PostgREST 중첩조회 대신 수동 조인 사용)

create table season (
  season_id   bigint generated always as identity primary key,
  name        text not null,                    -- 예: '2026 여름 시즌'
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'ONGOING'   -- PLANNED / ONGOING / CLOSED
);

-- profile : id = auth.users.id (논리적, Supabase Auth 트리거가 채움)
create table profile (
  id          uuid primary key,                 -- = auth.uid()  (논리적: auth.users.id)
  nickname    text not null,
  gender      char(1),                          -- 'M' / 'F'
  height_cm   numeric(5,1),
  team_id     bigint,                           -- 논리적 → team.team_id (현재 소속 팀)
  role        text not null default 'MEMBER',   -- MEMBER / LEADER / ADMIN
  created_at  timestamptz not null default now()
);

create table team (
  team_id      bigint generated always as identity primary key,
  season_id    bigint not null,                 -- 논리적 → season.season_id
  name         text not null,
  invite_code  text not null unique,            -- 랜덤 영숫자
  max_members  smallint not null default 5,
  leader_id    uuid,                            -- 논리적 → profile.id
  created_at   timestamptz not null default now()
);

create table inbody_history (
  inbody_id          bigint generated always as identity primary key,
  user_id            uuid not null,             -- 논리적 → profile.id
  season_id          bigint not null,           -- 논리적 → season.season_id
  measured_date      date not null,
  weight_kg          numeric(5,2) not null,
  skeletal_muscle_kg numeric(5,2),
  body_fat_kg        numeric(5,2),
  body_fat_percent   numeric(4,1),
  image_path         text,                      -- 인바디 결과지 사진(OCR 원본/증빙)
  is_baseline        boolean not null default false,
  created_at         timestamptz not null default now()
);
create index idx_inbody_user_season_date on inbody_history(user_id, season_id, measured_date);

create table certification (
  cert_id     bigint generated always as identity primary key,
  user_id     uuid not null,                    -- 논리적 → profile.id
  season_id   bigint not null,                  -- 논리적 → season.season_id
  cert_date   date not null,                    -- KST 기준 일자
  cert_type   text not null,                    -- MEAL / WORKOUT
  meal_time   text,                             -- 아침/점심/저녁/간식 (MEAL), null (WORKOUT)
  image_path  text,
  memo        text,
  created_at  timestamptz not null default now(),
  -- 식단은 식사시간별 1회, 운동(meal_time=null)은 하루 1회 (PG15 NULLS NOT DISTINCT)
  unique nulls not distinct (user_id, cert_date, cert_type, meal_time)
);
create index idx_cert_season_date on certification(season_id, cert_date);

-- 응원 리액션 (이모지 한 번 탭). 한 사람이 한 인증에 같은 이모지 1회.
create table cert_reaction (
  reaction_id bigint generated always as identity primary key,
  cert_id     bigint not null,                  -- 논리적 → certification.cert_id
  user_id     uuid not null,                    -- 논리적 → profile.id
  emoji       text not null,                    -- '🔥' / '👍' / '💪' / '👏'
  created_at  timestamptz not null default now(),
  unique (cert_id, user_id, emoji)
);
create index idx_reaction_cert on cert_reaction(cert_id);

-- 데일리 팀 보너스 원장 (전원 풀인증한 날 1행)
create table team_bonus (
  bonus_id    bigint generated always as identity primary key,
  team_id     bigint not null,                  -- 논리적 → team.team_id
  season_id   bigint not null,                  -- 논리적 → season.season_id
  bonus_date  date not null,
  points      int not null default 10,
  unique (team_id, bonus_date)
);
