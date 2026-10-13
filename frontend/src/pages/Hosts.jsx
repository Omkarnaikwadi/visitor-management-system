import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiBriefcase, FiX, FiUsers } from 'react-icons/fi';

const deptColors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700', 'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700'];
const getDeptColor = (dept) => deptColors[(dept?.charCodeAt(0) || 0) % deptColors.length];

const avatarGradients = [
  'from-blue-400 to-indigo-500', 'from-purple-400 to-pink-500', 'from-emerald-400 to-teal-500',
  'from-orange-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500',
];
const getGradient = (name) => avatarGradients[(name?.charCodeAt(0) || 0) % avatarGradients.length];

export default function Hosts() {
  const [hosts, setHosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: '' });

  const fetchHosts = async () => { const res = await hostAPI.getAll(); setHosts(res.data); };
  useEffect(() => { fetchHosts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editing ? await hostAPI.update(editing.id, form) : await hostAPI.create(form);
      toast.success(editing ? 'Host updated' : 'Host created');
      setShowModal(false); setEditing(null);
      setForm({ name: '', email: '', phone: '', department: '', designation: '' });
      fetchHosts();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  const handleEdit = (host) => { setEditing(host); setForm(host); setShowModal(true); };
  const handleDelete = async (id) => {
    if (!confirm('Deactivate this host?')) return;
    await hostAPI.delete(id); toast.success('Host deactivated'); fetchHosts();
  };
  const openAdd = () => { setShowModal(true); setEditing(null); setForm({ name: '', email: '', phone: '', department: '', designation: '' }); };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hosts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{hosts.length} registered hosts</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all active:scale-95">
          <FiPlus size={16} /> Add Host
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Host', 'Contact', 'Department', 'Designation', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {hosts.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(h.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {h.name?.charAt(0)}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{h.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <FiMail size={11} className="text-gray-400" />{h.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FiPhone size={11} className="text-gray-400" />{h.phone || '—'}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getDeptColor(h.department)}`}>
                    {h.department || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{h.designation || '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(h)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><FiEdit2 size={15} /></button>
                    <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hosts.length === 0 && (
          <div className="text-center py-16">
            <FiUsers size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hosts yet</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {hosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">No hosts yet</p>
          </div>
        )}
        {hosts.map((h) => (
          <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getGradient(h.name)} flex items-center justify-center text-white font-bold shrink-0`}>
                  {h.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{h.name}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${getDeptColor(h.department)}`}>
                    {h.department || '—'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(h)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FiEdit2 size={15} /></button>
                <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiMail size={11} className="text-gray-400" />{h.email}
              </div>
              {h.phone && <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiPhone size={11} className="text-gray-400" />{h.phone}
              </div>}
              {h.designation && <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiBriefcase size={11} className="text-gray-400" />{h.designation}
              </div>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Host' : 'Add New Host'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[['Full Name', 'name', 'text', true], ['Email Address', 'email', 'email', true],
                ['Phone Number', 'phone', 'tel', false], ['Department', 'department', 'text', false],
                ['Designation', 'designation', 'text', false]].map(([label, key, type, req]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{req && ' *'}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputClass} required={req} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
                  {editing ? 'Update Host' : 'Create Host'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
