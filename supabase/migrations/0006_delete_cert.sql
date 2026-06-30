-- 인증 삭제: 본인 것만, 리액션/댓글까지 함께 삭제 (FK 캐스케이드 없으므로 RPC로 정리)
create or replace function delete_certification(p_cert_id bigint)
returns void language plpgsql security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  select user_id into v_owner from certification where cert_id = p_cert_id;
  if v_owner is null then return; end if;
  if v_owner <> auth.uid() then
    raise exception '본인 인증만 삭제할 수 있습니다';
  end if;
  delete from cert_reaction where cert_id = p_cert_id;
  delete from cert_comment  where cert_id = p_cert_id;
  delete from certification where cert_id = p_cert_id;
end; $$;

-- Storage: 본인 폴더의 사진 삭제 허용
create policy cert_delete on storage.objects for delete to authenticated
  using (bucket_id = 'cert-images' and (storage.foldername(name))[1] = auth.uid()::text);
