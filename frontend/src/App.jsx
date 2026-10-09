import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import NotificationListener from './components/NotificationListener';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import ActiveVisitors from './pages/ActiveVisitors';
import AllVisits from './pages/AllVisits';
import Hosts from './pages/Hosts';
import PreRegister from './pages/PreRegister';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
      <Route path="/active" element={<ProtectedRoute><ActiveVisitors /></ProtectedRoute>} />
      <Route path="/visits" element={<ProtectedRoute><AllVisits /></ProtectedRoute>} />
      <Route path="/hosts" element={<ProtectedRoute><Hosts /></ProtectedRoute>} />
      <Route path="/pre-register" element={<ProtectedRoute><PreRegister /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationListener />
          <AppRoutes />
          <Toaster position="top-right" />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
