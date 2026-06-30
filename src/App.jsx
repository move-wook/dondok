import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import TeamSetupPage from './pages/TeamSetupPage';
import DashboardPage from './pages/DashboardPage';
import InbodyPage from './pages/InbodyPage';
import CalendarPage from './pages/CalendarPage';
import FeedPage from './pages/FeedPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup/profile" element={<RequireAuth><ProfileSetupPage /></RequireAuth>} />
          <Route path="/setup/team" element={<RequireAuth><TeamSetupPage /></RequireAuth>} />

          {/* 인증 + 셋업 완료된 메인 화면 (공통 레이아웃) */}
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inbody" element={<InbodyPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/feed" element={<FeedPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
