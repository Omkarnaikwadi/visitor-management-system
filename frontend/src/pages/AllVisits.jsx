import { useState, useEffect } from 'react';
import { visitorAPI } from '../services/api';
import { format } from 'date-fns';

export default function AllVisits() {
  const [visits, setVisits] = useState([]);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  const fetchVisits = async () => {
    const res = await visitorAPI.getAll(filters);
    setVisits(res.data);
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchVisits();
  };

  const statusColors = {
    checked_in: 'bg-green-100 text-green-700',
    checked_out: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Visits</h1>

      <form onSubmit={handleFilter} className="bg-white rounded-xl p-4 shadow-sm mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input type="date" value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input type="date" value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border rounded-lg">
            <option value="">All</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Filter</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Visitor</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Host</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Purpose</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check In</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Check Out</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{v.visitor_name}</p>
                  <p className="text-sm text-gray-500">{v.company}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{v.host_name}</p>
                  <p className="text-sm text-gray-500">{v.department}</p>
                </td>
                <td className="px-4 py-3">{v.purpose}</td>
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
      </div>
    </div>
  );
}
