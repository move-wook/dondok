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
        // 성공 시 onAuthStateChange → session 세팅 → 위 useEffect 가 이동
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } }, // 트리거가 nickname 으로 사용
        });
        if (error) throw error;
        if (!data.session) {
          setMsg('가입 완료! 이메일 확인이 켜져 있으면 메일을 확인하세요. (확인 OFF면 바로 로그인됩니다)');
        }
      }
    } catch (e2) {
      setMsg(translateErr(e2.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <h1 className="text-3xl font-bold text-gray-800">돈독</h1>
      <p className="mt-2 text-gray-500">돈독하게 모여 독하게 빼자</p>

      <div className="mt-8 w-full max-w-xs">
        <div className="mb-4 flex rounded-lg bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => { setMode('login'); setMsg(''); }}
            className={`flex-1 rounded-md py-2 ${mode === 'login' ? 'bg-white font-semibold shadow' : 'text-gray-500'}`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMsg(''); }}
            className={`flex-1 rounded-md py-2 ${mode === 'signup' ? 'bg-white font-semibold shadow' : 'text-gray-500'}`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <input className={inp} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          )}
          <input className={inp} type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <input className={inp} type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {msg && <p className="text-sm text-red-500">{msg}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-gray-900 py-3 font-semibold text-white active:scale-95 transition disabled:opacity-50">
            {busy ? '처리중…' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-800 focus:outline-none';

function translateErr(m = '') {
  const s = m.toLowerCase();
  if (s.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않습니다.';
  if (s.includes('already registered') || s.includes('already been registered')) return '이미 가입된 이메일입니다. 로그인 해주세요.';
  if (s.includes('at least 6') || s.includes('password should be')) return '비밀번호는 6자 이상이어야 합니다.';
  if (s.includes('signup') && s.includes('disabled')) return '이메일 가입이 꺼져 있어요 → Supabase → Authentication → Providers → Email 에서 "Allow new users to sign up" 켜기';
  if (s.includes('invalid') && s.includes('email')) return '이메일 주소가 유효하지 않다고 떠요(Supabase가 거부). 실제 형태의 이메일을 써보세요.';
  return m || '요청 처리 실패'; // 모르는 에러는 원문 그대로 노출(가리지 않음)
}
