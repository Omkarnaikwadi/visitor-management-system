import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FiCamera, FiRefreshCw, FiX } from 'react-icons/fi';

export default function WebcamCapture({ onCapture, onClose }) {
  const webcamRef = useRef(null);
  const [photo, setPhoto] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setPhoto(imageSrc);
  }, []);

  const retake = () => setPhoto(null);

  const confirm = () => {
    onCapture(photo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Capture Photo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden mb-4">
          {photo ? (
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex gap-3">
          {photo ? (
            <>
              <button onClick={retake} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <FiRefreshCw /> Retake
              </button>
              <button onClick={confirm} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Use Photo
              </button>
            </>
          ) : (
            <button onClick={capture} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <FiCamera size={20} /> Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
