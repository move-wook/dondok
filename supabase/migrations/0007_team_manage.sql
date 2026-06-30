-- 팀 삭제(리더 전용): 팀원 소속 해제 + 보너스/팀 행 삭제
-- (팀 나가기는 본인 profile.team_id 만 null 로 바꾸면 되어 RLS로 클라이언트에서 처리)
create or replace function delete_team(p_team_id bigint)
returns void language plpgsql security definer
set search_path = public
as $$
declare v_leader uuid;
begin
  select leader_id into v_leader from team where team_id = p_team_id;
  if v_leader is null then return; end if;
  if v_leader <> auth.uid() then
    raise exception '팀 리더만 삭제할 수 있습니다';
  end if;
  update profile set team_id = null, role = 'MEMBER' where team_id = p_team_id;
  delete from team_bonus where team_id = p_team_id;
  delete from team where team_id = p_team_id;
end; $$;
