import { useState, useEffect } from 'react';
import { preRegAPI, hostAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser, FiPhone, FiMail, FiBriefcase, FiClock, FiUserPlus, FiLogIn } from 'react-icons/fi';

const statusConfig = {
  pending:   { cls: 'bg-amber-100 text-amber-700',   label: 'Pending' },
  approved:  { cls: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  rejected:  { cls: 'bg-red-100 text-red-600',        label: 'Rejected' },
  completed: { cls: 'bg-gray-100 text-gray-600',      label: 'Completed' },
};

export default function PreRegister() {
  const [hosts, setHosts] = useState([]);
  const [preRegs, setPreRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    visitor_name: '', visitor_email: '', visitor_phone: '', visitor_company: '',
    host_id: '', purpose: '', expected_date: '', expected_time: ''
  });

  useEffect(() => {
    hostAPI.getAll().then((res) => setHosts(res.data));
    preRegAPI.getAll().then((res) => setPreRegs(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await preRegAPI.create(form);
      toast.success('Pre-registration created successfully');
      setForm({ visitor_name: '', visitor_email: '', visitor_phone: '', visitor_company: '', host_id: '', purpose: '', expected_date: '', expected_time: '' });
      preRegAPI.getAll().then((res) => setPreRegs(res.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pre-Register Visitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Register expected visitors in advance</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Visitor Name *</label>
              <div className="relative">
                <FiUser size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.visitor_name}
                  onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                  className={`${inputClass} pl-9`} required placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone *</label>
                <div className="relative">
                  <FiPhone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.visitor_phone}
                    onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
                    className={`${inputClass} pl-9`} required placeholder="10-digit number" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.visitor_email}
                    onChange={(e) => setForm({ ...form, visitor_email: e.target.value })}
                    className={`${inputClass} pl-9`} placeholder="email@example.com" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company</label>
              <div className="relative">
                <FiBriefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.visitor_company}
                  onChange={(e) => setForm({ ...form, visitor_company: e.target.value })}
                  className={`${inputClass} pl-9`} placeholder="Company name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Host *</label>
              <select value={form.host_id} onChange={(e) => setForm({ ...form, host_id: e.target.value })}
                className={inputClass} required>
                <option value="">Select a host</option>
                {hosts.map((h) => <option key={h.id} value={h.id}>{h.name} — {h.department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Purpose of Visit</label>
              <input type="text" value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className={inputClass} placeholder="e.g. Business meeting, Interview..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Expected Date *</label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={form.expected_date}
                    onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                    className={`${inputClass} pl-9`} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Expected Time</label>
                <div className="relative">
                  <FiClock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="time" value={form.expected_time}
                    onChange={(e) => setForm({ ...form, expected_time: e.target.value })}
                    className={`${inputClass} pl-9`} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-all active:scale-95 shadow-sm disabled:opacity-60 mt-2">
              <FiUserPlus size={16} />
              {loading ? 'Registering...' : 'Pre-Register Visitor'}
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Visits</h2>
          <p className="text-sm text-gray-500 mt-0.5">{preRegs.length} pre-registered visitors</p>
        </div>
        <div className="space-y-3">
          {preRegs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiCalendar size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No upcoming pre-registrations</p>
            </div>
          )}
          {preRegs.map((pr) => (
            <div key={pr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-0.5 ${pr.status === 'pending' ? 'bg-amber-400' : pr.status === 'approved' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                      {pr.visitor_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{pr.visitor_name}</p>
                      <p className="text-xs text-gray-400">{pr.visitor_company || 'Individual'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[pr.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                    {statusConfig[pr.status]?.label || pr.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <FiUser size={11} className="text-gray-400" />{pr.host_name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiCalendar size={11} className="text-gray-400" />
                    {format(new Date(pr.expected_date), 'MMM d, yyyy')}
                  </div>
                  {pr.expected_time && (
                    <div className="flex items-center gap-1.5">
                      <FiClock size={11} className="text-gray-400" />{pr.expected_time}
                    </div>
                  )}
                  {pr.visitor_phone && (
                    <div className="flex items-center gap-1.5">
                      <FiPhone size={11} className="text-gray-400" />{pr.visitor_phone}
                    </div>
                  )}
                </div>
                {pr.status === 'pending' && (
                  <button onClick={() => navigate('/checkin', { state: { preReg: pr } })}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-95">
                    <FiLogIn size={13} /> Check In Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
