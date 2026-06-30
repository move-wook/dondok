-- 돈독 MVP — 시드 (운영 시작용)
-- 마이그레이션(0001~0003) 적용 후 실행.

-- 1) 활성 시즌 1개 (날짜는 운영에 맞게 수정)
insert into season(name, start_date, end_date, status)
values ('2026 여름 시즌', '2026-07-01', '2026-08-25', 'ONGOING');

-- 2) 운영자(ADMIN) 지정
--    카카오로 한 번 로그인하면 profile 이 자동 생성됨. 그 후 본인 uid 로 아래 실행.
--    uid 확인: Supabase Dashboard > Authentication > Users, 또는 select id,nickname from profile;
-- update profile set role = 'ADMIN' where id = '<여기에-본인-auth-uid>';
