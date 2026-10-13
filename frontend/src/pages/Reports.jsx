import { useState, useEffect } from 'react';
import { hostAPI, reportAPI } from '../services/api';
import { FiDownload, FiFileText, FiFile, FiFilter, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Reports() {
  const [hosts, setHosts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '', department: '', host_id: '' });

  useEffect(() => {
    hostAPI.getAll().then((res) => setHosts(res.data));
    reportAPI.getDepartments().then((res) => setDepartments(res.data));
  }, []);

  const cleanFilters = () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));

  const handleExportCSV = () => { reportAPI.exportCSV(cleanFilters()); toast.success('CSV download started'); };
  const handleExportPDF = () => { reportAPI.exportPDF(cleanFilters()); toast.success('PDF download started'); };

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition-all";

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
        <p className="text-sm text-gray-500 mt-0.5">Filter and export visitor data in your preferred format</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <FiFilter size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filter Options</span>
          </div>
          {activeFilters > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              {activeFilters} active
            </span>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Start Date</label>
            <input type="date" value={filters.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">End Date</label>
            <input type="date" value={filters.end_date} onChange={(e) => set('end_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
            <select value={filters.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              <option value="">All Statuses</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Department</label>
            <select value={filters.department} onChange={(e) => set('department', e.target.value)} className={inputClass}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Host</label>
            <select value={filters.host_id} onChange={(e) => set('host_id', e.target.value)} className={inputClass}>
              <option value="">All Hosts</option>
              {hosts.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button onClick={() => setFilters({ start_date: '', end_date: '', status: '', department: '', host_id: '' })}
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <FiFileText size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Export as CSV</h3>
                <p className="text-xs text-gray-400 mt-0.5">For Excel / Google Sheets</p>
              </div>
            </div>
            <button onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm transition-all active:scale-95 shadow-sm">
              <FiDownload size={16} /> Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-1 bg-gradient-to-r from-rose-400 to-red-500" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-red-50 rounded-xl">
                <FiFile size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Export as PDF</h3>
                <p className="text-xs text-gray-400 mt-0.5">Printable report format</p>
              </div>
            </div>
            <button onClick={handleExportPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm transition-all active:scale-95 shadow-sm">
              <FiDownload size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FiInfo size={15} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-indigo-800">Report Contents</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {['Visitor name, phone, email & company', 'Host information and department',
            'Visit purpose and badge number', 'Check-in and check-out timestamps',
            'Visit status', 'Parking slot (if assigned)'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-indigo-700">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
