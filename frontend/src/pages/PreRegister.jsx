import { useState, useEffect } from 'react';
import { preRegAPI, hostAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PreRegister() {
  const [hosts, setHosts] = useState([]);
  const [preRegs, setPreRegs] = useState([]);
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
    try {
      await preRegAPI.create(form);
      toast.success('Pre-registration created');
      setForm({ visitor_name: '', visitor_email: '', visitor_phone: '', visitor_company: '', host_id: '', purpose: '', expected_date: '', expected_time: '' });
      preRegAPI.getAll().then((res) => setPreRegs(res.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    }
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-6">Pre-Register Visitor</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 md:p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Visitor Name *</label>
            <input type="text" value={form.visitor_name}
              onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
              className={inputClass} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input type="tel" value={form.visitor_phone}
                onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
                className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.visitor_email}
                onChange={(e) => setForm({ ...form, visitor_email: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input type="text" value={form.visitor_company}
              onChange={(e) => setForm({ ...form, visitor_company: e.target.value })}
              className={inputClass} />
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
            <label className="block text-sm font-medium mb-1">Purpose</label>
            <input type="text" value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Date *</label>
              <input type="date" value={form.expected_date}
                onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Time</label>
              <input type="time" value={form.expected_time}
                onChange={(e) => setForm({ ...form, expected_time: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
            Pre-Register
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-6">Upcoming Visits</h2>
        <div className="space-y-3">
          {preRegs.map((pr) => (
            <div key={pr.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{pr.visitor_name}</p>
                  <p className="text-sm text-gray-500">{pr.visitor_company || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  pr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {pr.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Host: {pr.host_name}</p>
                <p>Date: {format(new Date(pr.expected_date), 'MMM d, yyyy')} {pr.expected_time || ''}</p>
              </div>
            </div>
          ))}
          {preRegs.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              No upcoming pre-registrations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
