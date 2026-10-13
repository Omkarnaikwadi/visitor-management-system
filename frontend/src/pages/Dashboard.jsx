import { useState, useEffect } from 'react';
import { dashboardAPI, getPhotoUrl } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FiUsers, FiUserCheck, FiUserPlus, FiHome, FiWifi, FiWifiOff, FiTrendingUp, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className={`relative overflow-hidden rounded-2xl p-4 md:p-5 text-white shadow-lg ${gradient}`}>
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon size={18} className="text-white" />
        </div>
        {sub !== undefined && (
          <span className="text-[10px] md:text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{sub}</span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-bold mb-0.5 leading-none">{value}</p>
      <p className="text-white/80 text-xs md:text-sm font-medium leading-tight">{label}</p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-indigo-600">{payload[0].value} visits</p>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({ activeVisitors: 0, todayVisitors: 0, totalVisitors: 0, totalHosts: 0 });
  const [recent, setRecent] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [trend, setTrend] = useState([]);
  const { socket, connected } = useSocket();

  const fetchData = () => {
    dashboardAPI.getStats().then((res) => setStats(res.data));
    dashboardAPI.getRecent().then((res) => setRecent(res.data));
    dashboardAPI.getByDepartment().then((res) => setByDept(res.data));
    dashboardAPI.getTrend?.().then((res) => setTrend(res.data)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('stats_updated', fetchData);
    socket.on('visitor_checkin', fetchData);
    socket.on('visitor_checkout', fetchData);
    return () => { socket.off('stats_updated'); socket.off('visitor_checkin'); socket.off('visitor_checkout'); };
  }, [socket]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUserCheck} label="Active Visitors" value={stats.activeVisitors}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600" sub="Now" />
        <StatCard icon={FiUserPlus} label="Today's Visitors" value={stats.todayVisitors}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600" sub="Today" />
        <StatCard icon={FiUsers} label="Total Visitors" value={stats.totalVisitors}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard icon={FiHome} label="Total Hosts" value={stats.totalHosts}
          gradient="bg-gradient-to-br from-orange-400 to-rose-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 rounded-lg"><FiUsers size={16} className="text-indigo-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Visits by Department</h2>
              <p className="text-xs text-gray-400">Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDept} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
              <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-blue-50 rounded-lg"><FiTrendingUp size={16} className="text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Weekly Trend</h2>
              <p className="text-xs text-gray-400">Visitor activity this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'EEE')}
                tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <Line type="monotone" dataKey="count" stroke="url(#lineGrad)" strokeWidth={3}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-50">
          <div className="p-2 bg-gray-50 rounded-lg"><FiClock size={16} className="text-gray-600" /></div>
          <h2 className="text-sm font-semibold text-gray-800">Recent Visits</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-sm">No recent visits</p>
          )}
          {recent.map((visit) => (
            <div key={visit.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                {visit.photo_url ? (
                  <img src={getPhotoUrl(visit.photo_url)} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-gray-100">
                    {visit.visitor_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{visit.visitor_name}</p>
                  <p className="text-xs text-gray-400">→ {visit.host_name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  visit.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {visit.status.replace('_', ' ')}
                </span>
                <p className="text-xs text-gray-400 mt-1">{format(new Date(visit.check_in), 'MMM d, h:mm a')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
