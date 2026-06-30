# Requirements — 돈독 MVP

> 타입: feature | 소스: 돈독_기획설계문서.md v2.0
> 표기법: EARS (Easy Approach to Requirements Syntax)
> 영향도 요약: 신규 그린필드 — HIGH 산출물 3(마이그레이션) + React 7페이지

## 사용자 스토리 (요약)
- **회원**: 카카오로 로그인해 팀에 들어가고, 매일 식단/운동을 인증하며, 팀원과 서로 응원하고, 우리 팀 순위·스트릭을 확인한다.
- **리더**: 팀을 만들고 초대 코드로 팀원을 모은다.
- **운영자(ADMIN)**: 시즌을 개설한다.

---

## 기능 요구사항 (EARS)

### 인증 / 프로필
- **REQ-01**: WHEN 사용자가 카카오 로그인을 완료하면 THE SYSTEM SHALL `auth.users`에 대응하는 `profile` 행을 자동 생성한다.
- **REQ-02**: WHEN 신규 사용자가 첫 로그인 후 프로필 설정을 제출하면 THE SYSTEM SHALL 닉네임·성별·키를 본인 `profile`에만 저장한다.
- **REQ-03**: THE SYSTEM SHALL 비로그인 사용자가 인증 필요 화면에 접근하면 로그인 화면으로 리다이렉트한다.

### 시즌
- **REQ-04**: WHEN ADMIN이 시즌을 생성하면 THE SYSTEM SHALL 이름·시작일·종료일·status로 `season`을 저장한다.
- **REQ-05**: THE SYSTEM SHALL `status='ONGOING'`인 활성 시즌을 조회하는 API를 제공하고, 인바디·인증·랭킹은 별도 지정이 없으면 활성 시즌 기준으로 동작한다.

### 팀
- **REQ-06**: WHEN 사용자가 팀을 생성하면 THE SYSTEM SHALL 랜덤 초대 코드를 발급하고 생성자를 `role=LEADER`로 설정한다.
- **REQ-07**: WHEN 사용자가 초대 코드로 가입을 시도하면 THE SYSTEM SHALL 현재 인원 < `max_members`(3~5)인 경우에만 가입시키고, 정원 초과 시 거부한다.
- **REQ-08**: THE SYSTEM SHALL 사용자의 현재 팀을 `profile.team_id`로 추적한다.

### 인바디 / 랭킹
- **REQ-09**: WHEN 사용자가 시즌 내 첫 인바디를 등록하면 THE SYSTEM SHALL 해당 기록을 baseline(`is_baseline=true`)으로 저장한다.
- **REQ-10**: WHEN 사용자가 이후 인바디를 등록하면 THE SYSTEM SHALL 체중·골격근량·체지방량을 시즌·일자와 함께 저장한다.
- **REQ-10a (OCR 자동 기입)**: WHEN 사용자가 인바디 결과지 사진을 업로드하면 THE SYSTEM SHALL Edge Function(`extract_inbody`)으로 비전 API를 호출해 체중·골격근량·체지방량·체지방률을 추출하고 입력 폼을 자동으로 채운다.
- **REQ-10b (확인/폴백)**: THE SYSTEM SHALL 추출값을 사진·직전 측정값과 함께 보여 사용자가 확인·보정 후 저장하게 하며, 추출 실패·저신뢰 시 수기 입력으로 폴백한다. 저장 시 사진 경로(`image_path`)를 함께 보관한다.
- **REQ-11**: THE SYSTEM SHALL 회원별 감량률을 `(baseline − 최신) / baseline × 100`으로 계산하고, baseline이 없는 회원은 산정에서 제외한다.
- **REQ-12**: THE SYSTEM SHALL 팀 최종 점수를 `체지방감량률×1.0 + 체중감량률×0.5 + 누적보너스×0.1`로 계산하고, 최종점수↓ → 체지방감량률 → 보너스 순으로 정렬해 랭킹을 반환한다(`team_ranking` RPC).

### 데일리 인증 / 달력
- **REQ-13**: WHEN 사용자가 식단 인증을 등록하면 THE SYSTEM SHALL 사진·메모·식사시간(아침/점심/저녁/간식)을 저장하고, 같은 날·같은 식사시간 중복을 차단한다.
- **REQ-14**: WHEN 사용자가 운동 인증을 등록하면 THE SYSTEM SHALL 사진·메모를 저장하고 하루 1회로 제한한다.
- **REQ-15**: WHEN 사용자가 인증 사진을 업로드하면 THE SYSTEM SHALL `cert-images` 버킷의 본인 폴더(`{season_id}/{user_id}/`)에만 저장한다.
- **REQ-16**: THE SYSTEM SHALL 월별 달력에 본인 또는 팀원의 인증 사진 썸네일을 일자별로 표시하고 본인↔팀원 토글을 제공한다.

### 피드 / 응원 리액션
- **REQ-17**: THE SYSTEM SHALL 우리 팀의 인증을 시간 역순 사진 카드 피드로 보여준다(닉네임·식사태그·메모·시각 포함).
- **REQ-18**: WHEN 사용자가 팀원 인증에 이모지 리액션을 누르면 THE SYSTEM SHALL `cert_reaction`에 저장하고, 한 사용자가 한 인증에 같은 이모지를 1회만 남기도록 한다(재탭 시 토글 삭제).

### 데일리 팀 보너스 / 함께하기
- **REQ-19**: WHEN 한 날짜에 팀원 전원이 식단+운동을 모두 인증하면 THE SYSTEM SHALL 해당 팀에 그 날짜로 보너스를 1회 적재한다(`award_team_bonus`, 중복 방지).
- **REQ-20**: THE SYSTEM SHALL 팀 스트릭(전원 풀인증 연속 일수)을 `team_streak` RPC로 제공한다.
- **REQ-21**: THE SYSTEM SHALL 주간 공동 목표 진행(`done/goal`)을 `team_week_progress` RPC로 제공하고 대시보드 상단에 표시한다.

---

## 비기능 요구사항
- **NFR-01 (보안/권한)**: 모든 도메인 테이블에 RLS를 적용해, 사용자는 **같은 팀 + 같은 시즌** 데이터만 조회 가능하다(타 팀 데이터 차단).
- **NFR-02 (날짜)**: 모든 일자 판정은 KST(Asia/Seoul) 기준이다.
- **NFR-03 (규모/비용)**: 동시 20~25명에서 Supabase·Vercel 무료 티어 내에서 동작한다.
- **NFR-04 (모바일)**: 모바일 우선 반응형. 인증 업로드는 한 손 조작 가능하도록 하단 고정.
- **NFR-05 (이식성)**: 데이터는 표준 Postgres로, 덤프 이전이 가능해야 한다.

---

## 스코프 제외 (Phase 2+)
- 피드 댓글, 미인증 콕찌르기(넛지), 푸시 알림
- 시즌 자동 마감/결산(pg_cron), 우승 팀 발표, 주차별 추이 스냅샷
- 개인 streak 뱃지, 주간 팀 MVP/베스트 인증, before/after
- 네이티브 앱(React Native) 전환

---

## 의존성
- Supabase 프로젝트(Postgres 15, Auth, Storage)
- 카카오 Developers 앱(OAuth) + Supabase Auth Provider 연결
- **비전 API 키**(Claude vision 권장) — Edge Function `extract_inbody` 시크릿으로 보관
- Supabase CLI(Edge Function 배포)
- Vercel(또는 Cloudflare Pages) 배포 계정, (선택) 커스텀 도메인
- npm: `@supabase/supabase-js`, `react-router-dom`, `recharts`, `dayjs`, (S-01) `browser-image-compression`, (D-05) UI 라이브러리

---

## 수용 기준 (대표)
- [ ] 카카오 로그인 → 프로필/팀 설정 → 대시보드까지 한 사이클 동작
- [ ] 인바디 2회 입력 후 `team_ranking`이 감량률·최종점수로 정렬 반환
- [ ] 식단(점심) + 운동 인증 후 피드·달력에 사진 노출, 팀원이 🔥 리액션 가능
- [ ] 팀 전원 풀인증일에 보너스 적재 + 스트릭/진행바 반영
- [ ] 다른 팀 계정으로 우리 팀 인증/인바디 조회 시 0건(RLS 차단)
