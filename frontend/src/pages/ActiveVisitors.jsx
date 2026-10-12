import { useState, useEffect } from 'react';
import { visitorAPI, getPhotoUrl } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiMaximize, FiRefreshCw } from 'react-icons/fi';
import QRScanner from '../components/QRScanner';

export default function ActiveVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { socket } = useSocket();

  const fetchVisitors = async () => {
    try {
      const res = await visitorAPI.getActive();
      setVisitors(res.data);
    } catch (err) {
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('visitor_checkin', fetchVisitors);
    socket.on('visitor_checkout', fetchVisitors);
    return () => { socket.off('visitor_checkin'); socket.off('visitor_checkout'); };
  }, [socket]);

  const handleCheckOut = async (id) => {
    if (!confirm('Check out this visitor?')) return;
    try {
      await visitorAPI.checkOut(id);
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch (err) {
      toast.error('Check-out failed');
    }
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
        toast.info('Visitor is not currently checked in');
      }
    } catch (err) {
      toast.error('Invalid QR code');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Active Visitors ({visitors.length})</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-sm">
            <FiMaximize size={16} /> <span className="hidden sm:inline">Scan to Check Out</span>
          </button>
          <button onClick={fetchVisitors} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">No active visitors at the moment</div>
      ) : (
        <div className="grid gap-4">
          {visitors.map((v) => (
            <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {v.photo_url ? (
                  <img src={getPhotoUrl(v.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {v.visitor_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold truncate">{v.visitor_name}</p>
                      <p className="text-sm text-gray-500">{v.company || 'N/A'} • {v.visitor_phone}</p>
                    </div>
                    <button onClick={() => handleCheckOut(v.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm shrink-0">
                      Check Out
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div><span className="text-gray-400 text-xs">Host</span><p className="truncate">{v.host_name}</p></div>
                    <div><span className="text-gray-400 text-xs">Dept</span><p className="truncate">{v.department}</p></div>
                    <div><span className="text-gray-400 text-xs">Badge</span><p className="font-mono">{v.badge_number}</p></div>
                    <div><span className="text-gray-400 text-xs">Purpose</span><p className="truncate">{v.purpose}</p></div>
                    <div><span className="text-gray-400 text-xs">Check-in</span><p>{format(new Date(v.check_in), 'h:mm a')}</p></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
