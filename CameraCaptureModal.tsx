import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (base64OrUrl: string) => void;
  currentImage?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onImageSelected,
  currentImage,
}) => {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [capturedImage, setCapturedImage] = useState<string>(currentImage || '');
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start live camera
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung pada browser ini.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 800 }, height: { ideal: 600 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Gagal mengakses kamera perangkat. Pastikan izin kamera aktif atau gunakan opsi Upload File.');
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, mode]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCameraStream();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageSelected(capturedImage);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Foto Sampul Produk Herbal</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File / Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'camera'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Buka Kamera Langsung</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto mb-4 flex flex-col items-center justify-center">
          {mode === 'camera' ? (
            <div className="w-full space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setMode('upload')}
                      className="mt-2 text-blue-600 underline font-bold"
                    >
                      Beralih ke Unggah File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                      <span>Mengaktifkan kamera...</span>
                    </div>
                  )}
                </div>
              )}

              {isCameraActive && (
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Sampul Ini</span>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full space-y-3">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <Upload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pilih Foto dari Galeri / Drive
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Mendukung JPG, PNG, WEBP (maks 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Preview of captured image */}
          {capturedImage && (
            <div className="mt-4 w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Pratinjau Foto Sampul:
              </span>
              <img
                src={capturedImage}
                alt="Preview Sampul"
                className="w-36 h-36 mx-auto object-cover rounded-xl border border-slate-200 dark:border-slate-600 shadow-xs"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!capturedImage}
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Gunakan Foto Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};
