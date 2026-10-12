import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUserPlus, FiUsers, FiList, FiCalendar, FiLogOut, FiFileText, FiMenu, FiX } from 'react-icons/fi';

const navItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/checkin', icon: FiUserPlus, label: 'Check In' },
  { path: '/active', icon: FiUsers, label: 'Active Visitors' },
  { path: '/visits', icon: FiList, label: 'All Visits' },
  { path: '/hosts', icon: FiUsers, label: 'Hosts' },
  { path: '/pre-register', icon: FiCalendar, label: 'Pre-Register' },
  { path: '/reports', icon: FiFileText, label: 'Reports' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-indigo-600 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">VMS</h1>
          <p className="text-sm text-indigo-200">Visitor Management</p>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-indigo-200 hover:text-white">
          <FiX size={22} />
        </button>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
              location.pathname === path ? 'bg-indigo-800' : 'hover:bg-indigo-600'
            }`}>
            <Icon size={20} />{label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-indigo-600">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-indigo-600 transition text-indigo-200 hover:text-white">
          <FiLogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-indigo-700 text-white flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 bg-indigo-700 text-white flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setOpen(true)}><FiMenu size={22} /></button>
          <span className="font-bold text-lg">VMS</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
