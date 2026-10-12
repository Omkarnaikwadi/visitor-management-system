import { useState, useEffect } from 'react';
import { visitorAPI } from '../services/api';
import { format } from 'date-fns';

const statusColors = {
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AllVisits() {
  const [visits, setVisits] = useState([]);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  const fetchVisits = async () => {
    const res = await visitorAPI.getAll(filters);
    setVisits(res.data);
  };

  useEffect(() => { fetchVisits(); }, []);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold mb-6">All Visits</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">From</label>
            <input type="date" value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">To</label>
            <input type="date" value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">All</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchVisits} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Visitor', 'Host', 'Purpose', 'Check In', 'Check Out', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-sm font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-medium">{v.visitor_name}</p><p className="text-sm text-gray-500">{v.company}</p></td>
                <td className="px-4 py-3"><p>{v.host_name}</p><p className="text-sm text-gray-500">{v.department}</p></td>
                <td className="px-4 py-3 text-sm">{v.purpose}</td>
                <td className="px-4 py-3 text-sm">{format(new Date(v.check_in), 'MMM d, h:mm a')}</td>
                <td className="px-4 py-3 text-sm">{v.check_out ? format(new Date(v.check_out), 'h:mm a') : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[v.status]}`}>
                    {v.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && <p className="text-center py-8 text-gray-500">No visits found</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {visits.length === 0 && <div className="bg-white rounded-xl p-6 text-center text-gray-500">No visits found</div>}
        {visits.map((v) => (
          <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{v.visitor_name}</p>
                <p className="text-xs text-gray-500">{v.company || 'N/A'}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[v.status]}`}>
                {v.status.replace('_', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              <div><span className="text-xs text-gray-400">Host</span><p>{v.host_name}</p></div>
              <div><span className="text-xs text-gray-400">Dept</span><p>{v.department}</p></div>
              <div><span className="text-xs text-gray-400">Purpose</span><p>{v.purpose}</p></div>
              <div><span className="text-xs text-gray-400">Check In</span><p>{format(new Date(v.check_in), 'MMM d, h:mm a')}</p></div>
              {v.check_out && <div><span className="text-xs text-gray-400">Check Out</span><p>{format(new Date(v.check_out), 'h:mm a')}</p></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
