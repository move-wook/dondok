# Tasks — 돈독 MVP

> 타입: feature | 루프: B | 실행: `/pegasus-executor 0001`
> 태스크 1개 = `/pegasus-executor` 1회 실행 단위.

## 사전 조건 (PRE)
- **PRE-01**: Supabase 프로젝트 생성, `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 확보(.env).
- **PRE-02**: 카카오 Developers 앱 등록 → Supabase Auth > Providers > Kakao 연결(redirect URI 등록).
- **PRE-03**: Storage 버킷 `cert-images` 생성.
- **PRE-04**: D-05(UI 라이브러리: react-bootstrap vs Tailwind), D-06(TanStack Query 여부) 결정.
- **PRE-05**: Vite React 프로젝트 스캐폴드(`npm create vite@latest`), 의존성 설치.
- **PRE-06**: 비전 API 키(Claude vision 권장) 발급 + Supabase CLI 설치(Edge Function 배포용). 키는 Edge Function 시크릿으로 보관.

---

## 구현 태스크

### T01 — DB 마이그레이션: 스키마 (루프 B)
- `0001_schema.sql`: 7테이블 + 인덱스 + 순환FK ALTER (설계 §5.2).
- 검증: Supabase에 적용, 7테이블 생성 확인.

### T02 — DB 마이그레이션: RLS + Storage 정책 (루프 B)
- `0002_rls.sql`: 6테이블 RLS enable + 정책(season/team/profile/inbody/cert/reaction) + Storage 정책.
- 검증: 정책 목록 확인.

### T03 — DB 마이그레이션: RPC + 트리거 (루프 B)
- `0003_rpc.sql`: `handle_new_user` 트리거 + `team_ranking`/`award_team_bonus`/`team_streak`/`team_week_progress`.
- 검증: 함수 4개 생성 + 트리거 1개.

### T04 — 시드 + 스모크 (루프 A)  [S-02, S-03]
- `seed.sql`(활성 시즌 1 + ADMIN 승격), `smoke.sql`(더미데이터 + RPC 기대값 검증).
- 검증: smoke 실행 → 랭킹/스트릭/보너스/진행 기대값 일치.

### T05 — 클라이언트 토대 + 카카오 로그인 (루프 B)
- `src/lib/supabase.js`, `LoginPage`, `RequireAuth` 라우팅 가드.
- 검증: 카카오 로그인 → 세션 생성 → 보호 라우트 진입.

### T06 — 프로필 + 팀 설정 (루프 B)
- `ProfileSetupPage`(닉네임·체격), `TeamSetupPage`(생성/초대코드 가입 + 정원검증).
- 검증: 신규 계정이 프로필 저장 후 팀 생성/가입 완료.

### T07 — 인바디(OCR) + 랭킹 대시보드 (루프 B)
- Edge Function `extract_inbody`(사진→비전 API→수치 JSON) 작성·배포.
- `InbodyPage`: 사진 업로드 → OCR 자동기입 → 사진·직전값과 함께 확인/보정 → 저장(`image_path` 포함). 추출 실패 시 수기 폴백. recharts 추이.
- `DashboardPage`의 `RankingTable`(`team_ranking`).
- 검증: 사진 업로드 시 폼 자동 채움 + 보정 저장, 인바디 2회 후 랭킹 정렬·최종점수 표시.

### T08 — 인증 업로드 + 달력 다이어리 (루프 B)
- `CertUploadModal`(식사시간 선택 + S-01 이미지 압축 업로드), `CalendarPage`(썸네일 + 본인↔팀원 토글).
- 검증: 식단(점심)+운동 인증 → 달력 썸네일 표시.

### T09 — 피드 + 응원 리액션 (루프 B)
- `FeedPage`, `CertCard`, `ReactionBar`(이모지 토글), 인증 직후 `award_team_bonus` 호출.
- 검증: 팀 피드 노출 + 팀원 🔥 리액션 토글 동작.

### T10 — 스트릭 + 공동목표 통합 + 배포 (루프 B)
- `TeamSummaryCard`에 `team_streak`/`team_week_progress` 표시, Vercel 배포 + 도메인.
- 검증: 전원 풀인증일 → 스트릭/진행바 갱신, 프로덕션 URL 동작.

---

## 검증 (V)
- **V01**: 로그인→팀→인바디2회→인증→피드/리액션→대시보드 1사이클 통과.
- **V02**: `smoke.sql`로 RPC 4종 기대값 일치(랭킹 정렬/스트릭 연속/보너스 전원조건/주간 done·goal).
- **V03**: 타 팀 계정으로 우리 팀 인증·인바디 조회 시 0건(RLS 차단).

---

## 전체 소요 / DoD
- 예상 소요: ~18시간 (PRE ~1h 포함).
- **DoD**: REQ-01~21 충족 + V01~V03 통과 + 프로덕션 배포 완료 + 활성 시즌으로 25명 운영 가능.
