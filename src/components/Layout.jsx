import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, GitCompare, Users, CreditCard,
  LogOut, Building2, Menu, X, Settings, CalendarDays, ScanLine
} from 'lucide-react';
import api from '../api';
import { useI18n } from '../contexts/I18nContext';

export default function Layout({ children, auth, onLogout }) {
  const { user, organization, org_role } = auth;
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = [
    { to: '/',           icon: LayoutDashboard, labelKey: 'navDashboard' },
    { to: '/items',      icon: Package,         labelKey: 'navFoundItems' },
    { to: '/events',     icon: CalendarDays,    labelKey: 'navEvents' },
    { to: '/matches',    icon: GitCompare,       labelKey: 'navMatches' },
    { to: '/pickups',    icon: ScanLine,        labelKey: 'navPickups' },
    { to: '/team',       icon: Users,           labelKey: 'navTeam' },
    { to: '/subscription', icon: CreditCard,   labelKey: 'navSubscription' },
    { to: '/settings',   icon: Settings,        labelKey: 'navSettings', adminOnly: true },
  ];

  const handleLogout = async () => {
    try { await api.post('/business/auth/logout'); } catch {}
    onLogout();
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-800">
        <span
          className="text-sm tracking-tight text-white"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}
        >
          re<span style={{ color: '#0D9488' }}>k</span>ovr<span style={{ color: '#14B8A6' }}>.</span>
        </span>
        <span className="ml-2 text-xs text-slate-500 uppercase tracking-wide">Business</span>
      </div>

      {/* Org */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Building2 size={13} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <p
              data-testid="sidebar-org-name"
              className="text-sm font-medium text-white truncate leading-tight"
            >
              {organization?.name}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate leading-tight mt-0.5">
              {organization?.type}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV
          .filter(n => !n.adminOnly || org_role === 'admin')
          .map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeMobile}
              data-testid={`nav-${to === '/' ? 'dashboard' : to.replace('/', '')}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-900/40 text-teal-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={15} />
              {t(labelKey)}
            </NavLink>
          ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p
              data-testid="sidebar-user-name"
              className="text-sm font-medium text-white truncate leading-tight"
            >
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate leading-tight mt-0.5">
              {org_role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-xs text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut size={13} />
          {t('logout')}
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-950 border-b border-slate-800 flex items-center h-12 px-4 gap-3">
        <button
          data-testid="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center"
        >
          <Menu size={16} className="text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-white">
          {organization?.name || 'Rekovr'}
        </span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={closeMobile} />
          <aside className="relative w-60 bg-slate-950 flex flex-col h-full shadow-xl">
            <button
              onClick={closeMobile}
              className="absolute top-3.5 right-3 w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center z-10"
            >
              <X size={14} className="text-slate-400" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-slate-950 flex-col fixed h-full z-10">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="lg:ml-56 flex-1 px-6 py-6 pt-18 lg:px-8 lg:py-8 min-h-screen">
        {children}
      </main>

    </div>
  );
}
