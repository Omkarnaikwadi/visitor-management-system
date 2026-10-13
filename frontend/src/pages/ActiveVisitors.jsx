import { useState, useEffect } from 'react';
import { visitorAPI, getPhotoUrl } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiMaximize2, FiRefreshCw, FiLogOut, FiUser, FiBriefcase, FiClock, FiHash, FiMapPin } from 'react-icons/fi';
import QRScanner from '../components/QRScanner';

export default function ActiveVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const { socket } = useSocket();

  const fetchVisitors = async () => {
    try {
      const res = await visitorAPI.getActive();
      setVisitors(res.data);
    } catch { toast.error('Failed to load visitors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisitors(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('visitor_checkin', fetchVisitors);
    socket.on('visitor_checkout', fetchVisitors);
    return () => { socket.off('visitor_checkin'); socket.off('visitor_checkout'); };
  }, [socket]);

  const handleCheckOut = async (id, name) => {
    if (!confirm(`Check out ${name}?`)) return;
    setCheckingOut(id);
    try {
      await visitorAPI.checkOut(id);
      toast.success(`${name} checked out`);
      fetchVisitors();
    } catch { toast.error('Check-out failed'); }
    finally { setCheckingOut(null); }
  };

  const handleQRScan = async (qrData) => {
    try {
      const res = await visitorAPI.scanQR(qrData);
      if (res.data.type === 'visit' && res.data.data.status === 'checked_in') {
        const visit = res.data.data;
        if (confirm(`Check out ${visit.visitor_name}?`)) {
          await visitorAPI.checkOut(visit.id);
          toast.success('Visitor checked out');
          fetchVisitors();
        }
      } else {
        toast('Visitor is not currently checked in', { icon: 'ℹ️' });
      }
    } catch { toast.error('Invalid QR code'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Visitors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {visitors.length} {visitors.length === 1 ? 'person' : 'people'} currently inside
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all active:scale-95">
            <FiMaximize2 size={15} />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
          <button onClick={fetchVisitors}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all active:scale-95 shadow-sm">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiUser size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No active visitors</p>
          <p className="text-gray-400 text-sm mt-1">Visitors will appear here after check-in</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visitors.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Card top accent */}
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-5">
                {/* Visitor identity */}
                <div className="flex items-start gap-3 mb-4">
                  {v.photo_url ? (
                    <img src={getPhotoUrl(v.photo_url)} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {v.visitor_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{v.visitor_name}</p>
                    <p className="text-xs text-gray-500 truncate">{v.company || 'Individual'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.visitor_phone}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">In</span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FiUser size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Host</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{v.host_name}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FiBriefcase size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Dept</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{v.department}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FiClock size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Check-in</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{format(new Date(v.check_in), 'h:mm a')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FiHash size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-400">Badge</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 font-mono">{v.badge_number}</p>
                  </div>
                  {v.parking_slot && (
                    <div className="col-span-2 bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FiMapPin size={11} className="text-blue-400" />
                        <span className="text-xs text-blue-400">Parking</span>
                      </div>
                      <p className="text-sm font-bold text-blue-700">🅿️ {v.parking_slot}</p>
                    </div>
                  )}
                </div>

                <button onClick={() => handleCheckOut(v.id, v.visitor_name)}
                  disabled={checkingOut === v.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
                  <FiLogOut size={14} />
                  {checkingOut === v.id ? 'Checking out...' : 'Check Out'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
