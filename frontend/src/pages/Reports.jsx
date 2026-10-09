import { useState, useEffect } from 'react';
import { hostAPI } from '../services/api';
import { reportAPI } from '../services/api';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Reports() {
  const [hosts, setHosts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    department: '',
    host_id: ''
  });

  useEffect(() => {
    hostAPI.getAll().then((res) => setHosts(res.data));
    reportAPI.getDepartments().then((res) => setDepartments(res.data));
  }, []);

  const handleExportCSV = () => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    reportAPI.exportCSV(cleanFilters);
    toast.success('CSV download started');
  };

  const handleExportPDF = () => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    );
    reportAPI.exportPDF(cleanFilters);
    toast.success('PDF download started');
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reports & Export</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className={inputClass}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Host</label>
            <select
              value={filters.host_id}
              onChange={(e) => setFilters({ ...filters, host_id: e.target.value })}
              className={inputClass}
            >
              <option value="">All Hosts</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Tip:</span>
          <span>Leave filters empty to export all records</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiFileText size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Export as CSV</h3>
              <p className="text-sm text-gray-500">Spreadsheet format for Excel/Google Sheets</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FiDownload /> Download CSV
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiFile size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Export as PDF</h3>
              <p className="text-sm text-gray-500">Printable report format</p>
            </div>
          </div>
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FiDownload /> Download PDF
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Report Contents</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Visitor details (name, phone, email, company)</li>
          <li>• Host information and department</li>
          <li>• Visit purpose and badge number</li>
          <li>• Check-in and check-out timestamps</li>
          <li>• Visit status</li>
        </ul>
      </div>
    </div>
  );
}
