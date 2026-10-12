import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';
import { MdSecurity } from 'react-icons/md';

const FloatingShape = ({ className }) => (
  <div className={`absolute rounded-3xl opacity-20 ${className}`} />
);

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState('');
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[520px]">

        {/* ── Left Panel ─────────────────────────────────────────────── */}
        <div className="relative hidden md:flex md:w-5/12 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-400 flex-col items-center justify-center p-10 overflow-hidden">

          {/* Geometric shapes */}
          <FloatingShape className="w-64 h-64 bg-white -top-16 -left-16 rotate-12" />
          <FloatingShape className="w-48 h-48 bg-white bottom-10 -right-12 rotate-45" />
          <FloatingShape className="w-32 h-32 bg-indigo-300 top-1/2 left-1/3 -rotate-12" />
          <FloatingShape className="w-20 h-20 bg-blue-200 top-10 right-10 rotate-6" />

          {/* Chevron accent — mirrors the reference arrow shape */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
              <path d="M0 0 L80 100 L0 200 Z" fill="white" fillOpacity="0.12" />
              <path d="M20 20 L80 100 L20 180 Z" fill="white" fillOpacity="0.10" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MdSecurity size={44} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-wide">VMS</h2>
            <p className="text-indigo-100 text-sm font-medium tracking-widest uppercase mb-8">
              Visitor Management
            </p>
            <div className="space-y-3 text-left">
              {['Secure check-in & check-out', 'Real-time visitor tracking', 'WhatsApp gate pass delivery'].map((f) => (
                <div key={f} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                  <span className="text-sm text-white/90">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab pills — LOGIN / SIGN IN like reference */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 -mr-px">
            <div className="bg-white text-indigo-600 font-bold text-xs px-4 py-2 rounded-l-full shadow-md tracking-wider">
              LOGIN
            </div>
            <div className="bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-l-full tracking-wider">
              SIGN IN
            </div>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-10">

          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <MdSecurity size={32} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-wide">LOGIN</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="relative">
              <div className={`flex items-center border-b-2 transition-colors duration-200 pb-1 ${
                focused === 'email' ? 'border-indigo-500' : 'border-gray-200'
              }`}>
                <FiMail className={`mr-3 flex-shrink-0 transition-colors duration-200 ${
                  focused === 'email' ? 'text-indigo-500' : 'text-gray-400'
                }`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  placeholder="Email"
                  className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm py-1"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <div className={`flex items-center border-b-2 transition-colors duration-200 pb-1 ${
                focused === 'password' ? 'border-indigo-500' : 'border-gray-200'
              }`}>
                <FiLock className={`mr-3 flex-shrink-0 transition-colors duration-200 ${
                  focused === 'password' ? 'text-indigo-500' : 'text-gray-400'
                }`} size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  placeholder="Password"
                  className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm py-1"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-indigo-500 transition-colors ml-2"
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password row */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-indigo-500 cursor-pointer hover:underline">
                Forgot Password?
              </span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm px-8 py-2.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <FiLogIn size={15} />
                )}
                {loading ? 'Signing in...' : 'LOGIN'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">Or Login with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150 text-sm text-gray-600 font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-150 text-sm text-gray-600 font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#1877F2" d="M48 24C48 10.7 37.3 0 24 0S0 10.7 0 24c0 12 8.8 21.9 20.3 23.7V30.9h-6.1V24h6.1v-5.3c0-6 3.6-9.3 9-9.3 2.6 0 5.4.5 5.4.5v5.9h-3c-3 0-3.9 1.9-3.9 3.8V24h6.6l-1.1 6.9h-5.6v16.8C39.2 45.9 48 36 48 24z"/>
                <path fill="#fff" d="M33.4 30.9l1.1-6.9h-6.6v-4.4c0-1.9.9-3.8 3.9-3.8h3v-5.9s-2.7-.5-5.4-.5c-5.5 0-9 3.3-9 9.3V24h-6.1v6.9h6.1v16.8c1.2.2 2.5.3 3.7.3s2.5-.1 3.7-.3V30.9h5.6z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Demo hint */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Demo: <span className="text-indigo-500 font-medium">admin@vms.com</span> / <span className="text-indigo-500 font-medium">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
