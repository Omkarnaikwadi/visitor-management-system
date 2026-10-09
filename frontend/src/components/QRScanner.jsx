import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';

export default function QRScanner({ onScan, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText);
          onClose();
        });
      },
      () => {} // Ignore scan errors
    ).catch((err) => {
      setError('Camera access denied or not available');
      console.error(err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        {error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <div id="qr-reader" className="rounded-lg overflow-hidden" />
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Point camera at visitor's QR code badge
        </p>
      </div>
    </div>
  );
}
