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
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FiUserCheck className="text-green-600" size={20} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">New Visitor Arrived</p>
                <p className="mt-1 text-sm text-gray-500">
                  {data.visitor_name} is here to meet {data.host_name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    });

    socket.on('visitor_checkout', (data) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <FiUserX className="text-gray-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Visitor Checked Out</p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 3000 });
    });

    return () => {
      socket.off('visitor_arrived');
      socket.off('visitor_checkout');
    };
  }, [socket]);

  return null;
}
