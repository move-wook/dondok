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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-7">
      {/* 로고 */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          돈<span className="text-violet-600">독</span>
        </h1>
        <p className="mt-4 text-lg font-bold text-gray-700">돈독하게 모여 독하게 빼자 💪</p>
      </div>

      {/* 폼 */}
      <form onSubmit={submit} className="space-y-7">
        {mode === 'signup' && (
          <UnderlineField label="이름">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="독한이" maxLength={30} />
          </UnderlineField>
        )}

        <UnderlineField label="이메일">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="username" />
        </UnderlineField>

        <UnderlineField label="비밀번호">
          <div className="relative">
            <input
              className={inputCls}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-0 bottom-2 text-gray-400" aria-label="비밀번호 표시">
              {showPw ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </UnderlineField>

        {msg && <p className="text-sm font-medium text-red-500">{msg}</p>}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-violet-600 py-4 text-lg font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? '처리중…' : mode === 'login' ? '로그인' : '가입하기'}
        </button>
      </form>

      {/* 하단 전환 */}
      <p className="mt-7 text-center text-sm text-gray-400">
        {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}
          className="font-bold text-violet-600 underline underline-offset-2"
        >
          {mode === 'login' ? '회원가입' : '로그인'}
        </button>
      </p>
    </div>
  );
}

const inputCls =
  'w-full border-0 border-b border-gray-200 bg-transparent pb-2 pt-1 text-lg font-semibold text-gray-900 placeholder-gray-300 focus:border-violet-600 focus:outline-none focus:ring-0';

function UnderlineField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-base font-bold text-gray-900">{label}</span>
      {children}
    </label>
  );
}

function Eye() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.2-.8" />
      <path d="m2 2 20 20" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
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
