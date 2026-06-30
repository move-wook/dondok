import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export default function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!email || !password) return setMsg('이메일과 비밀번호를 입력하세요.');
    if (mode === 'signup' && !name.trim()) return setMsg('이름을 입력하세요.');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setMsg('가입 완료! 이메일 확인이 켜져 있으면 메일을 확인하세요.');
      }
    } catch (e2) {
      setMsg(translateErr(e2.message));
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-6 pb-8 pt-16">
      {/* 로고 */}
      <div className="mb-10 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-sm font-extrabold text-white">독</span>
        <span className="text-xl font-extrabold tracking-tight text-gray-900">돈독</span>
      </div>

      {/* 인사 헤딩 */}
      <div className="mb-9">
        <h1 className="text-[28px] font-extrabold leading-snug text-gray-900">
          {isLogin ? (
            <>다시 오셨네요 👋<br />오늘도 독하게 가볼까요?</>
          ) : (
            <>독한 여정,<br />지금 시작해요 💪</>
          )}
        </h1>
        <p className="mt-3 text-[15px] text-gray-500">
          {isLogin ? '로그인하고 우리 팀 현황을 확인하세요.' : '이메일로 간단히 가입할 수 있어요.'}
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={submit} className="space-y-4">
        {!isLogin && (
          <Field label="이름">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요" maxLength={30} />
          </Field>
        )}

        <Field label="이메일">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력해 주세요" autoComplete="username" />
        </Field>

        <Field label="비밀번호">
          <div className="relative">
            <input
              className={`${inputCls} pr-12`}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력해 주세요"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-label="비밀번호 표시">
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </Field>

        {msg && <p className="text-sm font-medium text-red-500">{msg}</p>}

        <button
          disabled={busy}
          className="mt-2 w-full rounded-xl bg-gray-900 py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:bg-gray-300"
        >
          {busy ? '처리중…' : isLogin ? '로그인' : '가입하기'}
        </button>
      </form>

      {/* 하단 전환 */}
      <p className="mt-auto pt-10 text-center text-sm text-gray-400">
        {isLogin ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
        <button
          type="button"
          onClick={() => { setMode(isLogin ? 'signup' : 'login'); setMsg(''); }}
          className="font-bold text-gray-900 underline underline-offset-2"
        >
          {isLogin ? '회원가입' : '로그인'}
        </button>
      </p>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-transparent bg-gray-100 px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.2-.8" /><path d="m2 2 20 20" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function translateErr(m = '') {
  const s = m.toLowerCase();
  if (s.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않습니다.';
  if (s.includes('already registered') || s.includes('already been registered')) return '이미 가입된 이메일입니다. 로그인 해주세요.';
  if (s.includes('at least 6') || s.includes('password should be')) return '비밀번호는 6자 이상이어야 합니다.';
  if (s.includes('signup') && s.includes('disabled')) return '이메일 가입이 꺼져 있어요 → Supabase Email provider에서 가입 허용을 켜주세요.';
  if (s.includes('invalid') && s.includes('email')) return '이메일 주소가 유효하지 않다고 떠요. 실제 형태의 이메일을 써보세요.';
  return m || '요청 처리 실패';
}
