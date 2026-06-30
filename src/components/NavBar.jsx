import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const tabs = [
  { to: '/', label: '우리팀', end: true },
  { to: '/inbody', label: '인바디' },
  { to: '/feed', label: '피드' },
  { to: '/calendar', label: '달력' },
];

export default function NavBar() {
  const { signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-gray-800">돈독</span>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
          <button onClick={signOut} className="ml-1 px-2 text-sm text-gray-400">
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  );
}
