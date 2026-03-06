import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, GitCompare, Users, CreditCard, LogOut, Building2, Menu, X, Settings } from 'lucide-react';
import api from '../api';

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/items',   icon: Package,         label: 'Found Items' },
  { to: '/matches', icon: GitCompare,      label: 'Matches' },
  { to: '/team',    icon: Users,           label: 'Team' },
  { to: '/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/settings',     icon: Settings,    label: 'Settings',     adminOnly: true },
];

export default function Layout({ children, auth, onLogout }) {
  const { user, organization, org_role } = auth;
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try { await api.post('/business/auth/logout'); } catch {}
    onLogout();
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-zinc-100">
        <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">Rekovr</h1>
        <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-widest font-medium">Business</p>
      </div>

      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Building2 size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <p data-testid="sidebar-org-name" className="text-[12px] font-semibold text-zinc-900 truncate">{organization?.name}</p>
          <p className="text-[10px] text-zinc-400 capitalize truncate">{organization?.type}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.filter(n => !n.adminOnly || org_role === 'admin').map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeMobile}
            data-testid={`nav-${to === '/' ? 'dashboard' : to.replace('/', '')}`}
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

      <div className="p-3 border-t border-zinc-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p data-testid="sidebar-user-name" className="text-[12px] font-medium text-zinc-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 truncate capitalize">{org_role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-[12px] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-zinc-100 flex items-center h-14 px-4">
        <button data-testid="mobile-menu-btn" onClick={() => setMobileOpen(true)} className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
          <Menu size={18} className="text-zinc-700" />
        </button>
        <span className="ml-3 text-[14px] font-bold text-zinc-900">{organization?.name || 'Rekovr'}</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={closeMobile} />
          <aside className="relative w-60 bg-white flex flex-col h-full shadow-xl">
            <button
              onClick={closeMobile}
              className="absolute top-4 right-3 w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"
            >
              <X size={16} className="text-zinc-600" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-zinc-100 flex-col fixed h-full z-10">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="lg:ml-60 flex-1 p-4 pt-18 lg:p-8 lg:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
