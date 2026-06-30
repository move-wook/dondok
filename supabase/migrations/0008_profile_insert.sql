-- 프로필 setup 을 upsert 로 처리하기 위한 insert 정책 (본인 것만)
-- (트리거가 보통 만들지만, 누락 시에도 프로필 설정에서 생성되도록 안전장치)
create policy ins_profile on profile for insert to authenticated
  with check (id = auth.uid());
