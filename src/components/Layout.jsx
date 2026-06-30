import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../lib/useProfile';
import { useAuth } from '../auth/AuthProvider';
import TabBar from './TabBar';

// 인증된 메인 화면 공통 레이아웃 + 셋업 게이팅 + 하단 탭바
export default function Layout() {
  const { profile, loading } = useProfile();
  const { signOut } = useAuth();

  if (loading) return <div className="p-8 text-center text-gray-400">로딩중…</div>;
  if (!profile || profile.nickname === '회원') return <Navigate to="/setup/profile" replace />;
  if (!profile.team_id) return <Navigate to="/setup/team" replace />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-gray-50/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-xs font-extrabold text-white">독</span>
          <span className="font-extrabold tracking-tight text-gray-900">돈독</span>
        </div>
        <button onClick={signOut} className="text-sm text-gray-400">로그아웃</button>
      </header>

      <main className="flex-1 pb-24">
        <Outlet context={{ profile }} />
      </main>

      <TabBar />
    </div>
  );
}
