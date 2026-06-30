# 돈독 — 개발 환경 세팅 (집/새 컴퓨터)

새 컴퓨터에서 돈독을 개발하려면 **코드 받고 + `.env`만 다시 만들면** 됩니다.
DB·인증·Storage·OCR 함수·배포는 전부 클라우드(Supabase/Vercel)라 컴퓨터마다 세팅이 필요 없어요.

---

## 1. 도구 설치 (한 번만)
- **Node.js LTS** — https://nodejs.org (npm 포함)
- **Git** — https://git-scm.com

확인:
```bash
node -v
git --version
```

## 2. 레포 클론
```bash
git clone https://github.com/move-wook/dondok.git
cd dondok
```

## 3. 의존성 설치
```bash
npm install
```

## 4. `.env` 만들기 ⚠️ (유일한 수동 작업)
`.env`는 비밀값이라 git에 안 올라가요. 직접 만들어야 합니다.

```bash
# Windows PowerShell
Copy-Item .env.example .env
# macOS / Linux
cp .env.example .env
```

`.env` 열어서 채우기:
```
VITE_SUPABASE_URL=https://zbfyqbpsqddbyrtesrdg.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public 키>
```
- `anon public` 키 위치: Supabase 대시보드 → **Project Settings → API → Project API keys → `anon` `public`**
- (또는 기존 PC의 `.env`에서 그대로 복사)

## 5. 실행
```bash
npm run dev
```
→ http://localhost:5173 — 끝! 같은 Supabase DB에 붙어 동일하게 동작합니다.

---

## 자주 쓰는 명령어
```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (검증용)
npm run preview  # 빌드 결과 미리보기
```

## 작업 동기화 (회사 ↔ 집)
```bash
git pull        # 시작 전: 최신 코드 받기
# ... 작업 ...
git add -A
git commit -m "작업 내용"
git push        # 끝나고: 올리기
```
> `.env`는 동기화 안 되니 **양쪽 PC에 한 번씩** 만들어두면 됩니다.

---

## 선택 (필요할 때만)

### 배포
- **추천:** Vercel ↔ GitHub 연결해두면 `git push`만 해도 자동 배포.
- 수동 배포:
  ```bash
  npm i -g vercel
  vercel login
  vercel link        # 레포를 Vercel 프로젝트에 연결
  vercel --prod
  ```

### 인바디 OCR 함수 수정/배포 (Supabase Edge Function)
```bash
npx supabase login
npx supabase link --project-ref zbfyqbpsqddbyrtesrdg
npx supabase functions deploy extract_inbody
# 시크릿(키)은 이미 등록돼 있음. 새로 넣을 때만:
# npx supabase secrets set GEMINI_API_KEY=...
```

### DB 스키마 변경
`supabase/migrations/*.sql` 을 Supabase **SQL Editor**에 붙여넣고 실행.

---

## 폴더 구조 요약
```
src/
├─ lib/         supabase 클라이언트 + 데이터 헬퍼(queries)
├─ auth/        로그인 상태 + 라우팅 가드
├─ pages/       Login/ProfileSetup/TeamSetup/Dashboard/Inbody/Feed/Ranking
└─ components/  Layout·TabBar·CertCard·MemberList·Ranking/요약 카드 등
supabase/
├─ migrations/  스키마·RLS·RPC·댓글·팀원통계
└─ functions/   extract_inbody (인바디 OCR, Gemini)
```
