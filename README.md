# 돈독 (Don-Dok)

> "돈독하게 모여 독하게 빼자" — 팀 단위 다이어트 챌린지 웹 서비스

크로스핏 센터 내부 챌린지를 위한 모바일 친화 웹앱. 혼자 하면 실패하는 다이어트를 **팀 경쟁 + 데일리 인증 + 서로 응원**으로 완주하게 돕습니다.

🔗 **데모:** https://dondok-one.vercel.app

## 주요 기능

- **로그인** — 이메일/비밀번호 (Supabase Auth)
- **팀** — 팀 생성 / 초대코드로 참여 (3~5명)
- **인바디** — 사진 OCR 자동 기입(보정 가능) + 수기 입력, 추이 차트
- **공정 랭킹** — 절대 감량 kg이 아닌 **감량률(%)** 기반, 체지방 우선 + 누적 보너스 합산 점수
- **데일리 인증** — 식단(아침/점심/저녁/간식)·운동 사진 인증, 자동 이미지 압축
- **사진 다이어리 달력** — 본인↔팀원 토글
- **피드** — 인스타식 인증 피드 + 응원 리액션(🔥👍💪👏) + 댓글
- **함께하기** — 전원 풀인증 시 팀 보너스, 팀 스트릭, 주간 공동목표 진행바

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프론트 | React 18 · Vite · Tailwind CSS · React Router · recharts · dayjs |
| 백엔드 | **Supabase** — Postgres · RLS · RPC · Auth · Storage |
| 인바디 OCR | Supabase Edge Function (Deno) + Google Gemini (무료 티어) |
| 배포 | Vercel |

> 서버 코드를 직접 운영하지 않고, DB·권한(RLS)·집계(RPC)로 해결하는 BaaS 구조.

## 로컬 실행

```bash
npm install
cp .env.example .env   # Supabase URL / anon key 채우기
npm run dev            # http://localhost:5173
```

## DB 셋업 (Supabase)

SQL Editor에서 순서대로 실행:

1. `supabase/migrations/0001_schema.sql` (스키마)
2. Storage 버킷 `cert-images` 생성 (비공개)
3. `supabase/migrations/0002_rls.sql` (RLS + 스토리지 정책)
4. `supabase/migrations/0003_rpc.sql` (RPC + 트리거)
5. `supabase/migrations/0004_comments.sql` (댓글)
6. `supabase/seed.sql` (활성 시즌)

(선택) 인바디 OCR (Google Gemini 무료 티어):
```bash
npx supabase secrets set GEMINI_API_KEY=...   # aistudio.google.com 무료 키
npx supabase functions deploy extract_inbody
```

## 배포

```bash
vercel --prod   # 또는 main 브랜치 push 시 자동 배포
```

## 폴더 구조

```
src/
├─ lib/         supabase 클라이언트 + 데이터 헬퍼(queries)
├─ auth/        AuthProvider + 라우팅 가드
├─ pages/       Login/ProfileSetup/TeamSetup/Dashboard/Inbody/Calendar/Feed
└─ components/  RankingTable·TeamSummaryCard·CertCard·ReactionBar·CommentSection·CertUploadModal …
supabase/
├─ migrations/  스키마·RLS·RPC·댓글
├─ functions/   extract_inbody (인바디 OCR)
└─ seed.sql
```

상세 설계는 [`돈독_기획설계문서.md`](./돈독_기획설계문서.md) 참고. (일부 항목은 초기 설계 기준이며 실제 구현과 다를 수 있음 — 예: 인증은 카카오→이메일로 변경됨)
