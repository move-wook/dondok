import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: '우리팀', end: true, icon: IconHome },
  { to: '/feed', label: '피드', icon: IconFeed },
  { to: '/inbody', label: '인바디', icon: IconChart },
  { to: '/ranking', label: '랭킹', icon: IconTrophy },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white/95 backdrop-blur">
      <div className="flex">
        {TABS.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                isActive ? 'font-bold text-gray-900' : 'text-gray-400'
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

const svg = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function IconHome() {
  return (<svg {...svg}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
}
function IconChart() {
  return (<svg {...svg}><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></svg>);
}
function IconFeed() {
  return (<svg {...svg}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M3 9h18" /><circle cx="7" cy="6" r=".5" fill="currentColor" /></svg>);
}
function IconTrophy() {
  return (<svg {...svg}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /><path d="M9 14.5V17h6v-2.5M8 21h8M12 17v4" /></svg>);
}
