import { useState, useEffect } from 'react';
import { visitorAPI, hostAPI, preRegAPI, getPhotoUrl } from '../services/api';
import toast from 'react-hot-toast';
import { FiCamera, FiMaximize } from 'react-icons/fi';
import WebcamCapture from '../components/WebcamCapture';
import QRScanner from '../components/QRScanner';

export default function CheckIn() {
  const [hosts, setHosts] = useState([]);
  const [preReg, setPreReg] = useState(null);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', host_id: '', purpose: '',
    id_type: '', id_number: '', photo_base64: '', pre_registration_id: ''
  });

  useEffect(() => {
    hostAPI.getAll().then((res) => setHosts(res.data));
  }, []);

  const handlePhoneBlur = async () => {
    if (form.phone.length >= 10) {
      try {
        const res = await preRegAPI.getByPhone(form.phone);
        if (res.data.length > 0) {
          const pr = res.data[0];
          setPreReg(pr);
          setForm((f) => ({
            ...f,
            name: pr.visitor_name,
            email: pr.visitor_email || '',
            phone: pr.visitor_phone,
            company: pr.visitor_company || '',
            host_id: pr.host_id,
            purpose: pr.purpose || '',
            pre_registration_id: pr.id
          }));
          toast.success('Pre-registration found!');
        }
      } catch (err) {}
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      const res = await visitorAPI.scanQR(qrData);
      if (res.data.type === 'visitor') {
        const v = res.data.data;
        setForm((f) => ({
          ...f,
          name: v.name,
          email: v.email || '',
          phone: v.phone,
          company: v.company || ''
        }));
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
    setForm({
      name: '', email: '', phone: '', company: '', host_id: '', purpose: '',
      id_type: '', id_number: '', photo_base64: '', pre_registration_id: ''
    });
    setPreReg(null);
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visitor Check-In</h1>
        <button
          onClick={() => setShowQRScanner(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
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
          <button onClick={() => setResult(null)} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg">
            New Check-In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {preReg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              Pre-registration found for {preReg.visitor_name}
            </div>
          )}

          {/* Photo Section */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {form.photo_base64 ? (
                <img src={form.photo_base64} alt="Visitor" className="w-full h-full object-cover" />
              ) : (
                <FiCamera size={24} className="text-gray-400" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
              >
                {form.photo_base64 ? 'Retake Photo' : 'Capture Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-1">Optional: Capture visitor photo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={handlePhoneBlur} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Host *</label>
            <select value={form.host_id} onChange={(e) => setForm({ ...form, host_id: e.target.value })}
              className={inputClass} required>
              <option value="">Select Host</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>{h.name} - {h.department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Purpose of Visit *</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID Type</label>
              <select value={form.id_type} onChange={(e) => setForm({ ...form, id_type: e.target.value })} className={inputClass}>
                <option value="">Select ID Type</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="driving">Driving License</option>
                <option value="passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ID Number</label>
              <input type="text" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium">
            Check In Visitor
          </button>
        </form>
      )}

      {showCamera && <WebcamCapture onCapture={handlePhotoCapture} onClose={() => setShowCamera(false)} />}
      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
