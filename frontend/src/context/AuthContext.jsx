import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { requestFCMToken, onForegroundMessage } from '../utils/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const registerFCM = async () => {
  try {
    const token = await requestFCMToken();
    if (token) await authAPI.saveFcmToken(token);
  } catch (err) {
    console.error('[FCM] Registration failed:', err.message);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.profile()
        .then((res) => {
          setUser(res.data);
          registerFCM(); // re-register FCM on page reload
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Show foreground push notifications as toasts
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (!title) return;
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-80 bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden border border-gray-100`}>
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-start gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-lg">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
              {body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>}
            </div>
            <button onClick={() => toast.dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 text-lg leading-none mt-0.5">
              ×
            </button>
          </div>
        </div>
      ), { duration: 6000 });
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    registerFCM(); // request permission + save token after login
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
