import { useState, useEffect } from 'react';
import { visitorAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiMaximize } from 'react-icons/fi';
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

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('visitor_checkin', fetchVisitors);
    socket.on('visitor_checkout', fetchVisitors);

    return () => {
      socket.off('visitor_checkin');
      socket.off('visitor_checkout');
    };
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Visitors ({visitors.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
          >
            <FiMaximize /> Scan to Check Out
          </button>
          <button onClick={fetchVisitors} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Refresh
          </button>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          No active visitors at the moment
        </div>
      ) : (
        <div className="grid gap-4">
          {visitors.map((v) => (
            <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
              <div className="flex gap-4 items-center">
                {v.photo_url ? (
                  <img src={v.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {v.visitor_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{v.visitor_name}</p>
                  <p className="text-sm text-gray-500">{v.company || 'N/A'} • {v.visitor_phone}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{v.host_name}</p>
                <p className="text-xs text-gray-500">{v.department}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{v.purpose}</p>
                <p className="text-xs text-gray-500">Badge: {v.badge_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Checked in</p>
                <p className="text-sm">{format(new Date(v.check_in), 'h:mm a')}</p>
              </div>
              <button
                onClick={() => handleCheckOut(v.id)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                Check Out
              </button>
            </div>
          ))}
        </div>
      )}

      {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
}
