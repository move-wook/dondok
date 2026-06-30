import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../lib/useProfile';
import NavBar from './NavBar';

// 인증된 메인 화면 공통 레이아웃 + 셋업 게이팅
export default function Layout() {
  const { profile, loading } = useProfile();

  if (loading) return <div className="p-8 text-center text-gray-500">로딩중…</div>;

  // 트리거가 기본 닉네임 '회원' 으로 생성 → 아직 본인 설정 전이면 프로필 설정으로
  if (!profile || profile.nickname === '회원') {
    return <Navigate to="/setup/profile" replace />;
  }
  if (!profile.team_id) {
    return <Navigate to="/setup/team" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="mx-auto max-w-2xl">
        <Outlet context={{ profile }} />
      </main>
    </div>
  );
}
