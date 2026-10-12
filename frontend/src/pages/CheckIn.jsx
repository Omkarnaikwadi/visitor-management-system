import { useState, useEffect } from 'react';
import { visitorAPI, hostAPI, preRegAPI, getPhotoUrl, otpAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiMaximize } from 'react-icons/fi';
import WebcamCapture from '../components/WebcamCapture';
import QRScanner from '../components/QRScanner';

const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address',
  phone: (v) => /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a valid 10-digit mobile number',
  aadhar: (v) => /^\d{12}$/.test(v) ? '' : 'Aadhar number must be exactly 12 digits',
  pan: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase()) ? '' : 'PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)',
  driving: (v) => v.length >= 6 ? '' : 'Enter a valid driving license number',
  passport: (v) => /^[A-Z][0-9]{7}$/.test(v.toUpperCase()) ? '' : 'Passport format: A1234567 (1 letter + 7 digits)',
};

const validateIdNumber = (type, value) => {
  if (!type || !value) return '';
  return validators[type] ? validators[type](value) : '';
};

export default function CheckIn() {
  const [hosts, setHosts] = useState([]);
  const [preReg, setPreReg] = useState(null);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', host_id: '', purpose: '',
    id_type: '', id_number: '', photo_base64: '', pre_registration_id: ''
  });

  useEffect(() => {
    hostAPI.getAll().then((res) => setHosts(res.data));
  }, []);

  const setError = (field, msg) => setErrors((e) => ({ ...e, [field]: msg }));
  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const handleSendOTP = async () => {
    const emailErr = validators.email(form.email);
    if (emailErr) { setError('email', emailErr); return; }
    setOtpLoading(true);
    try {
      await otpAPI.send(form.email);
      setOtpStep(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setOtpLoading(true);
    try {
      await otpAPI.verify(form.email, otp);
      setOtpVerified(true);
      setOtpStep(false);
      toast.success('Email verified!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
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
        setForm((f) => ({
          ...f, name: pr.visitor_name, email: pr.visitor_email || '',
          phone: pr.visitor_phone, company: pr.visitor_company || '',
          host_id: pr.host_id, purpose: pr.purpose || '', pre_registration_id: pr.id
        }));
        toast.success('Pre-registration found!');
      }
    } catch (err) {}
  };

  const handleQRScan = async (qrData) => {
    try {
      const res = await visitorAPI.scanQR(qrData);
      if (res.data.type === 'visitor') {
        const v = res.data.data;
        setForm((f) => ({ ...f, name: v.name, email: v.email || '', phone: v.phone, company: v.company || '' }));
        toast.success('Visitor found! Please select host and purpose.');
      } else if (res.data.type === 'visit') {
        const visit = res.data.data;
        if (visit.status === 'checked_in') {
          if (confirm(`${visit.visitor_name} is currently checked in. Check out now?`)) {
            await visitorAPI.checkOut(visit.id);
            toast.success('Visitor checked out');
          }
        } else {
          toast.info('This visit has already been completed.');
        }
      }
    } catch (err) {
      toast.error('Invalid QR code');
    }
  };

  const handlePhotoCapture = (photoData) => {
    setForm((f) => ({ ...f, photo_base64: photoData }));
    toast.success('Photo captured');
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

    try {
      const res = await visitorAPI.checkIn(form);
      setResult(res.data);
      toast.success('Visitor checked in successfully');
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', company: '', host_id: '', purpose: '', id_type: '', id_number: '', photo_base64: '', pre_registration_id: '' });
    setPreReg(null); setOtpStep(false); setOtpVerified(false); setOtp(''); setErrors({});
  };

  const inputClass = (field) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`;

  const ErrMsg = ({ field }) => errors[field]
    ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visitor Check-In</h1>
        <button onClick={() => setShowQRScanner(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <FiMaximize /> Scan QR
        </button>
      </div>

      {result ? (
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-green-600 mb-4">✓ Check-In Successful</h2>
          {result.photo_url && (
            <img src={getPhotoUrl(result.photo_url)} alt="Visitor" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
          )}
          <p className="text-lg mb-2">Welcome, {result.visitor_name}!</p>
          <p className="text-gray-600 mb-4">Badge: <span className="font-mono font-bold">{result.badge_number}</span></p>
          {result.qr_code && <img src={result.qr_code} alt="QR Code" className="mx-auto w-48 h-48 mb-4" />}
          <p className="text-sm text-gray-500">Host: {result.host_name} ({result.department})</p>
          <button onClick={() => setResult(null)} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">New Check-In</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {preReg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              Pre-registration found for {preReg.visitor_name}
            </div>
          )}

          {/* Photo */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {form.photo_base64
                ? <img src={form.photo_base64} alt="Visitor" className="w-full h-full object-cover" />
                : <FiCamera size={24} className="text-gray-400" />}
            </div>
            <div>
              <button type="button" onClick={() => setShowCamera(true)} className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200">
                {form.photo_base64 ? 'Retake Photo' : 'Capture Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-1">Optional: Capture visitor photo</p>
            </div>
          </div>

          {/* Email + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <div className="flex gap-2">
                <input type="email" value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setOtpVerified(false); setOtpStep(false); setOtp(''); clearError('email'); }}
                  onBlur={() => { const err = validators.email(form.email); if (err) setError('email', err); }}
                  className={inputClass('email')} required />
                {!otpVerified && (
                  <button type="button" onClick={handleSendOTP} disabled={otpLoading}
                    className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-sm whitespace-nowrap disabled:opacity-50">
                    {otpLoading ? '...' : 'Send OTP'}
                  </button>
                )}
                {otpVerified && <span className="px-3 py-2 bg-green-100 text-green-600 rounded-lg text-sm whitespace-nowrap">✓ Verified</span>}
              </div>
              <ErrMsg field="email" />
              {otpStep && (
                <div className="flex gap-2 mt-2">
                  <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-widest font-mono" />
                  <button type="button" onClick={handleVerifyOTP} disabled={otpLoading}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
                    {otpLoading ? '...' : 'Verify'}
                  </button>
                  <button type="button" onClick={handleSendOTP} disabled={otpLoading}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50">
                    Resend
                  </button>
                </div>
              )}
              {otpVerified && <p className="text-xs text-green-600 mt-1">✓ Gate pass will be sent to this email after check-in</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass('name')} required />
            </div>
          </div>

          {/* Phone + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone * <span className="text-xs text-gray-400">(WhatsApp gate pass)</span></label>
              <input type="tel" value={form.phone} maxLength={10}
                onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/\D/g, '') }); clearError('phone'); }}
                onBlur={handlePhoneBlur} className={inputClass('phone')} required />
              <ErrMsg field="phone" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass('company')} />
            </div>
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-medium mb-1">Host *</label>
            <select value={form.host_id} onChange={(e) => setForm({ ...form, host_id: e.target.value })} className={inputClass('host_id')} required>
              <option value="">Select Host</option>
              {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} - {h.department}</option>)}
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium mb-1">Purpose of Visit *</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass('purpose')} required />
          </div>

          {/* ID Type + ID Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID Type</label>
              <select value={form.id_type}
                onChange={(e) => { setForm({ ...form, id_type: e.target.value, id_number: '' }); clearError('id_number'); }}
                className={inputClass('id_type')}>
                <option value="">Select ID Type</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="driving">Driving License</option>
                <option value="passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                ID Number
                {form.id_type === 'aadhar' && <span className="text-xs text-gray-400 ml-1">(12 digits)</span>}
                {form.id_type === 'pan' && <span className="text-xs text-gray-400 ml-1">(ABCDE1234F)</span>}
                {form.id_type === 'passport' && <span className="text-xs text-gray-400 ml-1">(A1234567)</span>}
              </label>
              <input type="text" value={form.id_number}
                maxLength={form.id_type === 'aadhar' ? 12 : form.id_type === 'pan' ? 10 : undefined}
                onChange={(e) => {
                  const val = form.id_type === 'pan' ? e.target.value.toUpperCase() : e.target.value;
                  setForm({ ...form, id_number: val });
                  clearError('id_number');
                }}
                onBlur={() => {
                  if (form.id_type && form.id_number) {
                    const err = validateIdNumber(form.id_type, form.id_number);
                    if (err) setError('id_number', err);
                  }
                }}
                className={inputClass('id_number')} />
              <ErrMsg field="id_number" />
            </div>
          </div>

          <button type="submit" disabled={!otpVerified}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {otpVerified ? 'Check In Visitor' : 'Verify Email to Check In'}
          </button>
        </form>
      )}

      {showCamera && <WebcamCapture onCapture={handlePhotoCapture} onClose={() => setShowCamera(false)} />}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
