import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, GitCompare, Users, CreditCard, LogOut, Building2 } from 'lucide-react';
import api from '../api';

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/items',   icon: Package,         label: 'Found Items' },
  { to: '/matches', icon: GitCompare,      label: 'Matches' },
  { to: '/team',    icon: Users,           label: 'Team' },
  { to: '/subscription', icon: CreditCard, label: 'Subscription' },
];

export default function Layout({ children, auth, onLogout }) {
  const { user, organization, org_role } = auth;

  const handleLogout = async () => {
    try { await api.post('/business/auth/logout'); } catch {}
    onLogout();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-100 flex flex-col fixed h-full z-10">
        {/* Logo + org */}
        <div className="p-5 border-b border-zinc-100">
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-widest font-medium">Business</p>
        </div>

        {/* Org badge */}
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-zinc-900 truncate">{organization?.name}</p>
            <p className="text-[10px] text-zinc-400 capitalize truncate">{organization?.type}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-zinc-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-400 truncate capitalize">{org_role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-[12px] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
