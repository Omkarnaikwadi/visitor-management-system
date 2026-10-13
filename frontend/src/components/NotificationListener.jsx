import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { FiUserCheck, FiUserX } from 'react-icons/fi';

export default function NotificationListener() {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('visitor_arrived', (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-80 bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden border border-gray-100`}>
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-start gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <FiUserCheck className="text-emerald-600" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">New Visitor Arrived</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                <span className="font-medium text-gray-700">{data.visitor_name}</span> → {data.host_name}
              </p>
              {data.purpose && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">Purpose: {data.purpose}</p>
              )}
            </div>
            <button onClick={() => toast.dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 text-lg leading-none mt-0.5">
              ×
            </button>
          </div>
        </div>
      ), { duration: 6000 });
    });

    socket.on('visitor_checkout', (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-72 bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden border border-gray-100`}>
          <div className="h-1 bg-gradient-to-r from-gray-300 to-gray-400" />
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FiUserX className="text-gray-500" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Visitor Checked Out</p>
              <p className="text-xs text-gray-400 mt-0.5">Visit completed</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 text-lg leading-none">
              ×
            </button>
          </div>
        </div>
      ), { duration: 4000 });
    });

    return () => {
      socket.off('visitor_arrived');
      socket.off('visitor_checkout');
    };
  }, [socket]);

  return null;
}
