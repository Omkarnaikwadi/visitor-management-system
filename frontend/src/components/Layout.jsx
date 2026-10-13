import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUserPlus, FiUsers, FiList, FiCalendar,
  FiLogOut, FiFileText, FiMenu, FiX, FiShield
} from 'react-icons/fi';

const navItems = [
  { path: '/',             icon: FiHome,     label: 'Dashboard' },
  { path: '/checkin',      icon: FiUserPlus, label: 'Check In' },
  { path: '/active',       icon: FiUsers,    label: 'Active' },
  { path: '/visits',       icon: FiList,     label: 'Visits' },
  { path: '/hosts',        icon: FiUsers,    label: 'Hosts' },
  { path: '/pre-register', icon: FiCalendar, label: 'Pre-Reg' },
  { path: '/reports',      icon: FiFileText, label: 'Reports' },
];

// Bottom nav shows only 5 most used items on mobile
const bottomNavItems = [
  { path: '/',        icon: FiHome,     label: 'Home' },
  { path: '/checkin', icon: FiUserPlus, label: 'Check In' },
  { path: '/active',  icon: FiUsers,    label: 'Active' },
  { path: '/visits',  icon: FiList,     label: 'Visits' },
  { path: '/reports', icon: FiFileText, label: 'Reports' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50" style={{ height: '100dvh' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-60 bg-gradient-to-b from-indigo-700 to-indigo-800 flex-col shrink-0 shadow-xl">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <FiShield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">VMS</h1>
            <p className="text-xs text-indigo-300 mt-0.5">Visitor Management</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/10 mb-3" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon size={17} className={active ? 'text-indigo-600' : ''} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 h-px bg-white/10 mt-3" />

        {/* User */}
        <div className="p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate leading-none">{user?.name}</p>
              <p className="text-xs text-indigo-300 capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-indigo-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
            <FiLogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${open ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)} />
        {/* Drawer */}
        <div className={`absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-indigo-700 to-indigo-800 flex flex-col shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-5 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <FiShield size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">VMS</h1>
                <p className="text-xs text-indigo-300 mt-0.5">Visitor Management</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 text-indigo-300 hover:text-white rounded-xl hover:bg-white/10">
              <FiX size={20} />
            </button>
          </div>

          <div className="mx-4 h-px bg-white/10 mb-3" />

          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  }`}>
                  <Icon size={18} className={active ? 'text-indigo-600' : ''} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 h-px bg-white/10 mt-3" />

          <div className="p-3">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white font-bold shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-indigo-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
              <FiLogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors active:scale-95">
              <FiMenu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <FiShield size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">VMS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 page-enter">
          {children}
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-1">
            {bottomNavItems.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${
                    active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-indigo-50' : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-semibold truncate ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
