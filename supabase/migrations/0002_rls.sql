-- 돈독 MVP — RLS(Row Level Security) + Storage 정책
-- 권한을 DB가 강제: 사용자는 같은 팀 데이터만 조회, 쓰기는 본인 것만.

alter table season         enable row level security;
alter table team           enable row level security;
alter table profile        enable row level security;
alter table inbody_history enable row level security;
alter table certification  enable row level security;
alter table cert_reaction  enable row level security;
alter table team_bonus     enable row level security;

-- 시즌/팀: 로그인 사용자 조회 가능(랭킹·팀 탐색)
create policy sel_season on season for select to authenticated using (true);
create policy sel_team   on team   for select to authenticated using (true);
-- 팀 생성: 생성자가 리더여야 함. (정원검증 가입은 RPC 또는 앱 로직)
create policy ins_team   on team   for insert to authenticated with check (leader_id = auth.uid());
create policy upd_team   on team   for update to authenticated using (leader_id = auth.uid());

-- profile: 전체 조회(닉네임 수준), 수정은 본인만
create policy sel_profile on profile for select to authenticated using (true);
create policy upd_profile on profile for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 인바디: 같은 팀만 조회, 입력은 본인만
create policy sel_inbody on inbody_history for select to authenticated using (
  user_id in (select id from profile where team_id = (select team_id from profile where id = auth.uid()))
);
create policy ins_inbody on inbody_history for insert to authenticated with check (user_id = auth.uid());

-- 인증/피드: 같은 팀만 조회, 입력은 본인만
create policy sel_cert on certification for select to authenticated using (
  user_id in (select id from profile where team_id = (select team_id from profile where id = auth.uid()))
);
create policy ins_cert on certification for insert to authenticated with check (user_id = auth.uid());

-- 응원 리액션: 우리 팀 인증의 리액션만 조회, 추가/삭제는 본인 것만
create policy sel_reaction on cert_reaction for select to authenticated using (
  cert_id in (
    select cert_id from certification
    where user_id in (select id from profile where team_id = (select team_id from profile where id = auth.uid()))
  )
);
create policy ins_reaction on cert_reaction for insert to authenticated with check (user_id = auth.uid());
create policy del_reaction on cert_reaction for delete to authenticated using (user_id = auth.uid());

-- 보너스: 로그인 사용자 조회(대시보드 표시). 적재는 RPC(security definer)가 수행.
create policy sel_bonus on team_bonus for select to authenticated using (true);

-- ───────────────────────────────────────────────
-- Storage: 'cert-images' 버킷을 먼저 생성한 뒤 적용.
-- 경로 규칙: {user_id}/{cert|inbody}/{file}  (첫 폴더 = 본인 uid)
create policy cert_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'cert-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy cert_read on storage.objects for select to authenticated
  using (bucket_id = 'cert-images');
-- ⚠️ 인바디 사진은 민감정보 → 더 엄격히 하려면 비공개 버킷 + createSignedUrl 권장.
