import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { visitorAPI, hostAPI, preRegAPI, getPhotoUrl, otpAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiMaximize2, FiZap, FiMail, FiUser, FiPhone, FiBriefcase, FiShield, FiCheckCircle, FiUserPlus } from 'react-icons/fi';
import WebcamCapture from '../components/WebcamCapture';
import QRScanner from '../components/QRScanner';

const validators = {
  email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address',
  phone:   (v) => /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a valid 10-digit mobile number',
  aadhar:  (v) => /^\d{12}$/.test(v) ? '' : 'Aadhar must be exactly 12 digits',
  pan:     (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase()) ? '' : 'PAN format: ABCDE1234F',
  driving: (v) => v.length >= 6 ? '' : 'Enter a valid driving license number',
  passport:(v) => /^[A-Z][0-9]{7}$/.test(v.toUpperCase()) ? '' : 'Passport format: A1234567',
};
const validateIdNumber = (type, value) => (!type || !value) ? '' : (validators[type]?.(value) || '');

const inputCls = (err) =>
  `w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all focus:ring-2 ${
    err ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
  }`;

const ErrMsg = ({ msg }) => msg ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {msg}</p> : null;

const Label = ({ children }) => <label className="block text-xs font-semibold text-gray-500 mb-1.5">{children}</label>;

export default function CheckIn() {
  const [hosts, setHosts] = useState([]);
  const [preReg, setPreReg] = useState(null);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', host_id: '', purpose: '',
    id_type: '', id_number: '', photo_base64: '', pre_registration_id: ''
  });

  const location = useLocation();
  useEffect(() => { hostAPI.getAll().then((res) => setHosts(res.data)); }, []);

  useEffect(() => {
    const pr = location.state?.preReg;
    if (!pr) return;
    setPreReg(pr);
    setForm(f => ({ ...f, name: pr.visitor_name, email: pr.visitor_email || '', phone: pr.visitor_phone,
      company: pr.visitor_company || '', host_id: pr.host_id, purpose: pr.purpose || '', pre_registration_id: pr.id }));
  }, [location.state]);

  const setError = (field, msg) => setErrors(e => ({ ...e, [field]: msg }));
  const clearError = (field) => setErrors(e => ({ ...e, [field]: '' }));

  const handleSendOTP = async () => {
    const emailErr = validators.email(form.email);
    if (emailErr) { setError('email', emailErr); return; }
    try {
      const r = await visitorAPI.checkReturning(form.email);
      if (r.data.returning) {
        const v = r.data.visitor;
        setForm(f => ({ ...f, name: v.name || f.name, phone: v.phone || f.phone, company: v.company || f.company }));
        setFastTrack(true); setOtpVerified(true);
        toast.success('⚡ Returning visitor — OTP skipped!');
        return;
      }
    } catch {}
    setOtpLoading(true);
    try {
      await otpAPI.send(form.email);
      setOtpStep(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setOtpLoading(true);
    try {
      await otpAPI.verify(form.email, otp);
      setOtpVerified(true); setOtpStep(false);
      toast.success('Email verified!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally { setOtpLoading(false); }
  };

  const handlePhoneBlur = async () => {
    const err = validators.phone(form.phone);
    if (err) { setError('phone', err); return; }
    clearError('phone');
    try {
      const res = await preRegAPI.getByPhone(form.phone);
      if (res.data.length > 0) {
        const pr = res.data[0];
        setPreReg(pr);
        setForm(f => ({ ...f, name: pr.visitor_name, email: pr.visitor_email || '', phone: pr.visitor_phone,
          company: pr.visitor_company || '', host_id: pr.host_id, purpose: pr.purpose || '', pre_registration_id: pr.id }));
        toast.success('Pre-registration found!');
      }
    } catch {}
  };

  const handleQRScan = async (qrData) => {
    try {
      const res = await visitorAPI.scanQR(qrData);
      if (res.data.type === 'visitor') {
        const v = res.data.data;
        setForm(f => ({ ...f, name: v.name, email: v.email || '', phone: v.phone, company: v.company || '' }));
        toast.success('Visitor found! Select host and purpose.');
      } else if (res.data.type === 'visit') {
        const visit = res.data.data;
        if (visit.status === 'checked_in') {
          if (confirm(`${visit.visitor_name} is checked in. Check out now?`)) {
            await visitorAPI.checkOut(visit.id);
            toast.success('Visitor checked out');
          }
        } else { toast('Visit already completed', { icon: 'ℹ️' }); }
      }
    } catch (err) {
      if (err.response?.data?.type === 'expired') toast.error('⛔ Gate pass expired — visitor already checked out.');
      else toast.error(err.response?.data?.error || 'Invalid QR code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (validators.email(form.email)) newErrors.email = validators.email(form.email);
    if (validators.phone(form.phone)) newErrors.phone = validators.phone(form.phone);
    if (form.id_type && form.id_number) {
      const idErr = validateIdNumber(form.id_type, form.id_number);
      if (idErr) newErrors.id_number = idErr;
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setSubmitting(true);
    try {
      const res = await visitorAPI.checkIn({ ...form, skip_otp: fastTrack });
      setResult(res.data);
      toast.success('Visitor checked in!');
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', company: '', host_id: '', purpose: '', id_type: '', id_number: '', photo_base64: '', pre_registration_id: '' });
    setPreReg(null); setOtpStep(false); setOtpVerified(false); setFastTrack(false); setOtp(''); setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Check-In</h1>
          <p className="text-sm text-gray-500 mt-0.5">Register a new visitor or scan their QR code</p>
        </div>
        <button onClick={() => setShowQRScanner(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all active:scale-95">
          <FiMaximize2 size={15} /> Scan QR
        </button>
      </div>

      {result ? (
        /* ── Success Screen ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Check-In Successful!</h2>
            <p className="text-gray-500 text-sm mb-6">Welcome, <span className="font-semibold text-gray-800">{result.visitor_name}</span></p>

            {result.photo_url && (
              <img src={getPhotoUrl(result.photo_url)} alt="Visitor"
                className="w-20 h-20 rounded-2xl mx-auto mb-5 object-cover ring-4 ring-gray-100" />
            )}

            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Badge Number</p>
                <p className="font-mono font-bold text-gray-800">{result.badge_number}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Host</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{result.host_name}</p>
              </div>
            </div>

            {result.parking_slot && (
              <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-6 py-3.5 mb-5">
                <span className="text-3xl">🅿️</span>
                <div className="text-left">
                  <p className="text-xs text-blue-500 font-semibold">Parking Assigned</p>
                  <p className="text-2xl font-bold text-blue-700">{result.parking_slot}</p>
                </div>
              </div>
            )}

            {result.qr_code && (
              <div className="inline-block p-3 bg-gray-50 rounded-2xl mb-5">
                <img src={result.qr_code} alt="QR Code" className="w-44 h-44" />
              </div>
            )}

            <p className="text-xs text-gray-400 mb-6">
              Gate pass sent to email{result.parking_slot ? ' · Parking slot assigned' : ''}
            </p>
            <button onClick={() => setResult(null)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-all active:scale-95 shadow-sm">
              New Check-In
            </button>
          </div>
        </div>
      ) : (
        /* ── Form ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">

            {preReg && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <FiCheckCircle size={16} className="text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Pre-registration found for <strong>{preReg.visitor_name}</strong></p>
              </div>
            )}

            {/* Photo */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-gray-100">
                {form.photo_base64
                  ? <img src={form.photo_base64} alt="Visitor" className="w-full h-full object-cover" />
                  : <FiCamera size={22} className="text-gray-400" />}
              </div>
              <div>
                <button type="button" onClick={() => setShowCamera(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-all shadow-sm">
                  <FiCamera size={14} /> {form.photo_base64 ? 'Retake Photo' : 'Capture Photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">Optional — for visitor identification</p>
              </div>
            </div>

            {/* Email + OTP */}
            <div>
              <Label>Email Address *</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiMail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={form.email} placeholder="visitor@email.com"
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setOtpVerified(false); setFastTrack(false); setOtpStep(false); setOtp(''); clearError('email'); }}
                      onBlur={() => { const err = validators.email(form.email); if (err) setError('email', err); }}
                      className={`${inputCls(errors.email)} pl-9`} required />
                  </div>
                  {!otpVerified ? (
                    <button type="button" onClick={handleSendOTP} disabled={otpLoading}
                      className="shrink-0 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 transition-all active:scale-95">
                      {otpLoading ? '...' : 'Send OTP'}
                    </button>
                  ) : fastTrack ? (
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold">
                      <FiZap size={13} /> Fast-track
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold">
                      <FiCheckCircle size={13} /> Verified
                    </span>
                  )}
                </div>
                <ErrMsg msg={errors.email} />
              {otpStep && (
                <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-medium mb-2">Enter the 6-digit OTP sent to your email</p>
                  <div className="flex gap-2">
                    <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                      placeholder="• • • • • •"
                      className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-[0.5em] font-mono text-lg bg-white" />
                    <button type="button" onClick={handleVerifyOTP} disabled={otpLoading}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 transition-all active:scale-95">
                      {otpLoading ? '...' : 'Verify'}
                    </button>
                    <button type="button" onClick={handleSendOTP} disabled={otpLoading}
                      className="px-3 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm disabled:opacity-50 transition-all">
                      Resend
                    </button>
                  </div>
                </div>
              )}
              {otpVerified && !fastTrack && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><FiCheckCircle size={11} /> Gate pass will be sent to this email</p>}
              {fastTrack && <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1"><FiZap size={11} /> Returning visitor — OTP skipped automatically</p>}
            </div>

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <div className="relative">
                  <FiUser size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`${inputCls(errors.name)} pl-9`} required placeholder="Visitor's full name" />
                </div>
              </div>
              <div>
                <Label>Phone Number *</Label>
                <div className="relative">
                  <FiPhone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone} maxLength={10} placeholder="10-digit mobile"
                    onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/\D/g, '') }); clearError('phone'); }}
                    onBlur={handlePhoneBlur} className={`${inputCls(errors.phone)} pl-9`} required />
                </div>
                <ErrMsg msg={errors.phone} />
              </div>
            </div>

            {/* Company + Host */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Company</Label>
                <div className="relative">
                  <FiBriefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className={`${inputCls()} pl-9`} placeholder="Company name" />
                </div>
              </div>
              <div>
                <Label>Host *</Label>
                <select value={form.host_id} onChange={(e) => setForm({ ...form, host_id: e.target.value })}
                  className={inputCls(errors.host_id)} required>
                  <option value="">Select a host</option>
                  {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} — {h.department}</option>)}
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <Label>Purpose of Visit *</Label>
              <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className={inputCls(errors.purpose)} required placeholder="e.g. Business meeting, Interview..." />
            </div>

            {/* ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>ID Type</Label>
                <div className="relative">
                  <FiShield size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={form.id_type}
                    onChange={(e) => { setForm({ ...form, id_type: e.target.value, id_number: '' }); clearError('id_number'); }}
                    className={`${inputCls()} pl-9 bg-white`}>
                    <option value="">Select ID type</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="driving">Driving License</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>
                  ID Number
                  {form.id_type === 'aadhar' && <span className="text-gray-400 font-normal ml-1">(12 digits)</span>}
                  {form.id_type === 'pan' && <span className="text-gray-400 font-normal ml-1">(ABCDE1234F)</span>}
                  {form.id_type === 'passport' && <span className="text-gray-400 font-normal ml-1">(A1234567)</span>}
                </Label>
                <input type="text" value={form.id_number}
                  maxLength={form.id_type === 'aadhar' ? 12 : form.id_type === 'pan' ? 10 : undefined}
                  onChange={(e) => {
                    const val = form.id_type === 'pan' ? e.target.value.toUpperCase() : e.target.value;
                    setForm({ ...form, id_number: val }); clearError('id_number');
                  }}
                  onBlur={() => { if (form.id_type && form.id_number) { const err = validateIdNumber(form.id_type, form.id_number); if (err) setError('id_number', err); } }}
                  className={inputCls(errors.id_number)} placeholder="Enter ID number" />
                <ErrMsg msg={errors.id_number} />
              </div>
            </div>

            <button type="submit" disabled={!otpVerified || submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking in...</>
              ) : otpVerified ? (
                <><FiUserPlus size={16} /> Check In Visitor</>
              ) : (
                'Verify Email to Continue'
              )}
            </button>
          </form>
        </div>
      )}

      {showCamera && <WebcamCapture onCapture={(d) => { setForm(f => ({ ...f, photo_base64: d })); toast.success('Photo captured'); }} onClose={() => setShowCamera(false)} />}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
