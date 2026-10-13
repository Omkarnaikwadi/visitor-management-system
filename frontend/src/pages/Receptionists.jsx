import { useState, useEffect } from 'react';
import { receptionistAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiUsers, FiMail, FiPhone, FiLock, FiToggleLeft, FiToggleRight, FiKey } from 'react-icons/fi';

const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all';

export default function Receptionists() {
  const [receptionists, setReceptionists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const fetchAll = async () => {
    try { const res = await receptionistAPI.getAll(); setReceptionists(res.data); }
    catch { toast.error('Failed to load receptionists'); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await receptionistAPI.create({ ...form, role: 'receptionist' });
      toast.success('Receptionist added');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', password: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
  };

  const handleToggle = async (r) => {
    try {
      await receptionistAPI.toggleActive(r.id);
      toast.success(`${r.name} ${r.is_active ? 'deactivated' : 'activated'}`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await receptionistAPI.resetPassword(resetTarget.id, newPassword);
      toast.success('Password reset successfully');
      setResetTarget(null);
      setNewPassword('');
    } catch { toast.error('Failed to reset password'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receptionists</h1>
          <p className="text-sm text-gray-500 mt-0.5">{receptionists.length} registered</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all active:scale-95">
          <FiPlus size={16} /> Add Receptionist
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Name', 'Contact', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {receptionists.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {r.name?.charAt(0)}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><FiMail size={11} className="text-gray-400" />{r.email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500"><FiPhone size={11} className="text-gray-400" />{r.phone || '—'}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleToggle(r)} title={r.is_active ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-lg transition-colors ${r.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {r.is_active ? <FiToggleRight size={17} /> : <FiToggleLeft size={17} />}
                    </button>
                    <button onClick={() => { setResetTarget(r); setNewPassword(''); }} title="Reset password"
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <FiKey size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {receptionists.length === 0 && (
          <div className="text-center py-16">
            <FiUsers size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No receptionists yet</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {receptionists.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No receptionists yet</p>
          </div>
        )}
        {receptionists.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {r.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{r.name}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleToggle(r)}
                  className={`p-2 rounded-lg transition-colors ${r.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {r.is_active ? <FiToggleRight size={17} /> : <FiToggleLeft size={17} />}
                </button>
                <button onClick={() => { setResetTarget(r); setNewPassword(''); }}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                  <FiKey size={15} />
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500"><FiMail size={11} className="text-gray-400" />{r.email}</div>
              {r.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><FiPhone size={11} className="text-gray-400" />{r.phone}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Add Receptionist Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Receptionist</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[['Full Name', 'name', 'text', true], ['Email Address', 'email', 'email', true],
                ['Phone Number', 'phone', 'tel', false]].map(([label, key, type, req]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{req && ' *'}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputClass} required={req} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                <div className="relative">
                  <FiLock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`${inputClass} pl-9`} required minLength={6} placeholder="Min. 6 characters" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
              <button onClick={() => setResetTarget(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Set a new password for <span className="font-semibold text-gray-800">{resetTarget.name}</span></p>
              <div className="relative">
                <FiLock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pl-9`} required minLength={6} placeholder="New password (min. 6 chars)" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setResetTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all active:scale-95 shadow-sm">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
