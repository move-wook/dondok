-- 돈독 — 인증 댓글(평면) 테이블 + RLS
-- 외래키는 제약 없이 논리적 관계만 주석으로 명시(프로젝트 규칙).

create table cert_comment (
  comment_id  bigint generated always as identity primary key,
  cert_id     bigint not null,                 -- 논리적 → certification.cert_id
  user_id     uuid not null,                   -- 논리적 → profile.id
  content     text not null,
  created_at  timestamptz not null default now()
);
create index idx_comment_cert on cert_comment(cert_id);

alter table cert_comment enable row level security;

-- 우리 팀 인증의 댓글만 조회, 작성/삭제는 본인 것만
create policy sel_comment on cert_comment for select to authenticated using (
  cert_id in (
    select cert_id from certification
    where user_id in (select id from profile where team_id = (select team_id from profile where id = auth.uid()))
  )
);
create policy ins_comment on cert_comment for insert to authenticated with check (user_id = auth.uid());
create policy del_comment on cert_comment for delete to authenticated using (user_id = auth.uid());
