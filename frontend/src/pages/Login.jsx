import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUser, FiPhone, FiUserPlus, FiShield } from 'react-icons/fi';

const FloatingShape = ({ className }) => (
  <div className={`absolute rounded-3xl opacity-20 ${className}`} />
);

const InputField = ({ icon: Icon, placeholder, type = 'text', value, onChange, onFocus, onBlur, focused, name, right }) => (
  <div className={`flex items-center border-b-2 transition-colors duration-200 pb-1 ${focused === name ? 'border-indigo-500' : 'border-gray-200'}`}>
    <Icon className={`mr-3 flex-shrink-0 transition-colors duration-200 ${focused === name ? 'text-indigo-500' : 'text-gray-400'}`} size={17} />
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={() => onFocus(name)}
      onBlur={() => onBlur('')}
      placeholder={placeholder}
      className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm py-1"
      required
    />
    {right}
  </div>
);

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

export default function Login() {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [focused, setFocused]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [sName, setSName]       = useState('');
  const [sEmail, setSEmail]     = useState('');
  const [sPhone, setSPhone]     = useState('');
  const [sPass, setSPass]       = useState('');
  const [sConfirm, setSConfirm] = useState('');

  const { login } = useAuth();
  const navigate  = useNavigate();

  const switchMode = (m) => {
    setMode(m);
    setFocused('');
    setShowPass(false);
    setShowConfirm(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      // Render free tier cold start — retry once automatically
      if (!err.response) {
        toast.loading('Server is waking up, retrying...', { id: 'retry' });
        try {
          await new Promise((r) => setTimeout(r, 4000));
          await login(email, password);
          toast.dismiss('retry');
          toast.success('Welcome back!');
          navigate('/');
          return;
        } catch (retryErr) {
          toast.dismiss('retry');
          toast.error(retryErr.response?.data?.error || 'Server is starting up, please try again in a moment');
        }
      } else {
        toast.error(err.response?.data?.error || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (sPass !== sConfirm) return toast.error('Passwords do not match');
    if (sPass.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authAPI.selfRegister({ name: sName, email: sEmail, phone: sPhone, password: sPass });
      localStorage.setItem('token', res.data.token);
      toast.success(`Account created! Welcome, ${res.data.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4" style={{ minHeight: '100dvh' }}>
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex" style={{ minHeight: 'min(560px, 95dvh)' }}>

        {/* ── Left Panel ───────────────────────────────────────────── */}
        <div className="relative hidden md:flex md:w-5/12 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-400 flex-col items-center justify-center p-10 overflow-hidden">
          <FloatingShape className="w-64 h-64 bg-white -top-16 -left-16 rotate-12" />
          <FloatingShape className="w-48 h-48 bg-white bottom-10 -right-12 rotate-45" />
          <FloatingShape className="w-32 h-32 bg-indigo-300 top-1/2 left-1/3 -rotate-12" />
          <FloatingShape className="w-20 h-20 bg-blue-200 top-10 right-10 rotate-6" />

          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <svg width="80" height="200" viewBox="0 0 80 200" fill="none">
              <path d="M0 0 L80 100 L0 200 Z" fill="white" fillOpacity="0.12" />
              <path d="M20 20 L80 100 L20 180 Z" fill="white" fillOpacity="0.10" />
            </svg>
          </div>

          <div className="relative z-10 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiShield size={44} className="text-white" />
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

          {/* Mode tab pills */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            <button onClick={() => switchMode('login')}
              className={`text-xs px-4 py-2 rounded-l-full font-bold tracking-wider transition-all duration-200 ${isLogin ? 'bg-white text-indigo-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              LOGIN
            </button>
            <button onClick={() => switchMode('signup')}
              className={`text-xs px-4 py-2 rounded-l-full font-semibold tracking-wider transition-all duration-200 ${!isLogin ? 'bg-white text-indigo-600 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* ── Right Panel ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 md:px-12 py-6 overflow-y-auto">

          {/* Mobile mode toggle */}
          <div className="flex md:hidden justify-center mb-6">
            <div className="flex bg-gray-100 rounded-full p-1">
              <button onClick={() => switchMode('login')}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isLogin ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>
                Login
              </button>
              <button onClick={() => switchMode('signup')}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${!isLogin ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>
                Sign Up
              </button>
            </div>
          </div>

          {/* Animated panel swap */}
          <div className="relative">

            {/* ── LOGIN FORM ── */}
            <div className={`transition-all duration-300 ${isLogin ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-8 pointer-events-none absolute inset-0'}`}>
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FiShield size={30} className="text-indigo-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-indigo-600 tracking-wide">LOGIN</h1>
                <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <InputField icon={FiMail} name="email" placeholder="Email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused} />

                <InputField icon={FiLock} name="password" placeholder="Password"
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused}
                  right={
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors ml-2">
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  } />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-indigo-500 cursor-pointer hover:underline">Forgot Password?</span>
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm px-8 py-2.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-60">
                    {loading ? <Spinner /> : <FiLogIn size={15} />}
                    {loading ? 'Signing in...' : 'LOGIN'}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">Don't have an account?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button onClick={() => switchMode('signup')}
                className="w-full flex items-center justify-center gap-2 border-2 border-indigo-100 text-indigo-600 font-semibold text-sm py-2.5 rounded-full hover:bg-indigo-50 active:scale-95 transition-all duration-200">
                <FiUserPlus size={15} /> Create an Account
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Demo: <span className="text-indigo-500 font-medium">admin@vms.com</span> / <span className="text-indigo-500 font-medium">admin123</span>
              </p>
            </div>

            {/* ── SIGNUP FORM ── */}
            <div className={`transition-all duration-300 ${!isLogin ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-8 pointer-events-none absolute inset-0'}`}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <FiUserPlus size={26} className="text-indigo-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-indigo-600 tracking-wide">SIGN UP</h1>
                <p className="text-gray-400 text-sm mt-1">Create your receptionist account</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <InputField icon={FiUser} name="sName" placeholder="Full Name"
                  value={sName} onChange={(e) => setSName(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused} />

                <InputField icon={FiMail} name="sEmail" placeholder="Email" type="email"
                  value={sEmail} onChange={(e) => setSEmail(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused} />

                <InputField icon={FiPhone} name="sPhone" placeholder="Phone Number" type="tel"
                  value={sPhone} onChange={(e) => setSPhone(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused} />

                <InputField icon={FiLock} name="sPass" placeholder="Password"
                  type={showPass ? 'text' : 'password'}
                  value={sPass} onChange={(e) => setSPass(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused}
                  right={
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors ml-2">
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  } />

                <InputField icon={FiLock} name="sConfirm" placeholder="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  value={sConfirm} onChange={(e) => setSConfirm(e.target.value)}
                  onFocus={setFocused} onBlur={setFocused} focused={focused}
                  right={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="text-gray-400 hover:text-indigo-500 transition-colors ml-2">
                      {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  } />

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm py-2.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-60 mt-2">
                  {loading ? <Spinner /> : <FiUserPlus size={15} />}
                  {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">Already have an account?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button onClick={() => switchMode('login')}
                className="w-full flex items-center justify-center gap-2 border-2 border-indigo-100 text-indigo-600 font-semibold text-sm py-2.5 rounded-full hover:bg-indigo-50 active:scale-95 transition-all duration-200">
                <FiLogIn size={15} /> Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
