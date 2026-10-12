import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUserPlus, FiUsers, FiList, FiCalendar, FiLogOut, FiFileText } from 'react-icons/fi';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-4 border-b border-indigo-600">
          <h1 className="text-xl font-bold">VMS</h1>
          <p className="text-sm text-indigo-200">Visitor Management</p>
        </div>
        <nav className="p-4 flex-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                location.pathname === path ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-600">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-indigo-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-indigo-600 transition text-indigo-200 hover:text-white"
          >
            <FiLogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
