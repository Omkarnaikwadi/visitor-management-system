import { useState, useEffect } from 'react';
import { dashboardAPI, getPhotoUrl } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FiUsers, FiUserCheck, FiUserPlus, FiHome, FiWifi, FiWifiOff } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

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

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('stats_updated', fetchData);
    socket.on('visitor_checkin', fetchData);
    socket.on('visitor_checkout', fetchData);

    return () => {
      socket.off('stats_updated');
      socket.off('visitor_checkin');
      socket.off('visitor_checkout');
    };
  }, [socket]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {connected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={FiUserCheck} label="Active Visitors" value={stats.activeVisitors} color="bg-green-500" />
        <StatCard icon={FiUserPlus} label="Today's Visitors" value={stats.todayVisitors} color="bg-blue-500" />
        <StatCard icon={FiUsers} label="Total Visitors" value={stats.totalVisitors} color="bg-purple-500" />
        <StatCard icon={FiHome} label="Total Hosts" value={stats.totalHosts} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Visits by Department (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byDept}>
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Weekly Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend}>
              <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'EEE')} />
              <YAxis />
              <Tooltip labelFormatter={(d) => format(new Date(d), 'MMM d')} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent Visits</h2>
        <div className="space-y-3">
          {recent.map((visit) => (
            <div key={visit.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                {visit.photo_url ? (
                  <img src={getPhotoUrl(visit.photo_url)} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {visit.visitor_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium">{visit.visitor_name}</p>
                  <p className="text-sm text-gray-500">Host: {visit.host_name}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${
                  visit.status === 'checked_in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {visit.status.replace('_', ' ')}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(visit.check_in), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
