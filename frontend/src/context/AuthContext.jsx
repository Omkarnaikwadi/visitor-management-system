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
      if (title) toast(
        <div>
          <p className="font-semibold text-sm">{title}</p>
          {body && <p className="text-xs text-gray-600 mt-0.5">{body}</p>}
        </div>,
        { icon: '🔔', duration: 6000 }
      );
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
