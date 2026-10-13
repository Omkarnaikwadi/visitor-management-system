import { useState, useEffect } from 'react';
import { visitorAPI } from '../services/api';
import { format } from 'date-fns';
import { FiFilter, FiSearch, FiCalendar, FiUser, FiBriefcase } from 'react-icons/fi';

const statusConfig = {
  checked_in:  { label: 'Checked In',  cls: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: 'Checked Out', cls: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-100 text-red-600' },
};

export default function AllVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await visitorAPI.getAll(filters);
      setVisits(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVisits(); }, []);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Visits</h1>
        <p className="text-sm text-gray-500 mt-0.5">{visits.length} records found</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From Date</label>
            <input type="date" value={filters.start_date} onChange={(e) => set('start_date', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To Date</label>
            <input type="date" value={filters.end_date} onChange={(e) => set('end_date', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select value={filters.status} onChange={(e) => set('status', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white">
              <option value="">All Statuses</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 sm:invisible">Search</label>
            <button onClick={fetchVisits}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm whitespace-nowrap">
              <FiSearch size={14} /> Search
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Visitor', 'Host', 'Purpose', 'Check In', 'Check Out', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {v.visitor_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{v.visitor_name}</p>
                          <p className="text-xs text-gray-400">{v.company || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{v.host_name}</p>
                      <p className="text-xs text-gray-400">{v.department}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-[160px] truncate">{v.purpose}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <FiCalendar size={12} className="text-gray-400" />
                        {format(new Date(v.check_in), 'MMM d, h:mm a')}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {v.check_out ? format(new Date(v.check_out), 'h:mm a') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[v.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                        {statusConfig[v.status]?.label || v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.length === 0 && (
              <div className="text-center py-16">
                <FiSearch size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No visits found</p>
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {visits.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-gray-400 text-sm">No visits found</p>
              </div>
            )}
            {visits.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-purple-500" />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {v.visitor_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{v.visitor_name}</p>
                        <p className="text-xs text-gray-400">{v.company || '—'}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[v.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                      {statusConfig[v.status]?.label || v.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <FiUser size={11} className="text-gray-400" />{v.host_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <FiBriefcase size={11} className="text-gray-400" />{v.department}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
                      <FiCalendar size={11} className="text-gray-400" />
                      {format(new Date(v.check_in), 'MMM d, h:mm a')}
                      {v.check_out && <span className="text-gray-300 mx-1">→</span>}
                      {v.check_out && format(new Date(v.check_out), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
