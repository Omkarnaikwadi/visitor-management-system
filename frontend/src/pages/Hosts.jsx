import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Hosts</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <FiPlus /> Add Host
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Phone', 'Department', 'Designation', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {hosts.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{h.name}</td>
                <td className="px-4 py-3 text-sm">{h.email}</td>
                <td className="px-4 py-3 text-sm">{h.phone}</td>
                <td className="px-4 py-3 text-sm">{h.department}</td>
                <td className="px-4 py-3 text-sm">{h.designation}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                  <button onClick={() => handleDelete(h.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hosts.length === 0 && <p className="text-center py-8 text-gray-500">No hosts found</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {hosts.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gray-500">No hosts found</div>}
        {hosts.map((h) => (
          <div key={h.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{h.name}</p>
                <p className="text-sm text-gray-500">{h.designation} • {h.department}</p>
                <p className="text-sm text-gray-500 mt-1">{h.email}</p>
                <p className="text-sm text-gray-500">{h.phone}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                <button onClick={() => handleDelete(h.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Host' : 'Add Host'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[['Name', 'name', 'text', true], ['Email', 'email', 'email', true], ['Phone', 'phone', 'tel', false],
                ['Department', 'department', 'text', false], ['Designation', 'designation', 'text', false]].map(([label, key, type, req]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}{req && ' *'}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputClass} required={req} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
