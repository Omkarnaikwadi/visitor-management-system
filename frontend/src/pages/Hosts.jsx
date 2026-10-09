import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function Hosts() {
  const [hosts, setHosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', designation: '' });

  const fetchHosts = async () => {
    const res = await hostAPI.getAll();
    setHosts(res.data);
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await hostAPI.update(editing.id, form);
        toast.success('Host updated');
      } else {
        await hostAPI.create(form);
        toast.success('Host created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', email: '', phone: '', department: '', designation: '' });
      fetchHosts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (host) => {
    setEditing(host);
    setForm(host);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this host?')) return;
    await hostAPI.delete(id);
    toast.success('Host deactivated');
    fetchHosts();
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hosts</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); setForm({ name: '', email: '', phone: '', department: '', designation: '' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <FiPlus /> Add Host
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Designation</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {hosts.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{h.name}</td>
                <td className="px-4 py-3">{h.email}</td>
                <td className="px-4 py-3">{h.phone}</td>
                <td className="px-4 py-3">{h.department}</td>
                <td className="px-4 py-3">{h.designation}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleEdit(h)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <FiEdit2 />
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Host' : 'Add Host'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
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
