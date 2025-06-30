import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Zap, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Barcode scanning interval
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;

    if (isOpen && !isLoading && !error) {
      scanInterval = setInterval(() => {
        scanBarcode();
      }, 500); // Scan every 500ms
    }

    return () => {
      if (scanInterval) {
        clearInterval(scanInterval);
      }
    };
  }, [isOpen, isLoading, error]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      stopCamera();

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for barcode detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple barcode detection simulation
    // In a real implementation, you would use a library like QuaggaJS or ZXing
    detectBarcode(imageData);
  };

  const detectBarcode = (imageData: ImageData) => {
    // This is a simplified barcode detection simulation
    // In production, you would use a proper barcode scanning library
    
    // Simulate barcode detection with random success
    if (Math.random() < 0.1) { // 10% chance of "detecting" a barcode
      const simulatedBarcodes = [
        '1234567890123',
        '2345678901234',
        '3456789012345',
        '4567890123456',
        '5678901234567'
      ];
      
      const detectedBarcode = simulatedBarcodes[Math.floor(Math.random() * simulatedBarcodes.length)];
      
      if (detectedBarcode !== lastScan) {
        setIsScanning(true);
        setLastScan(detectedBarcode);
        
        // Vibrate if supported
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
        
        // Call the onScan callback
        onScan(detectedBarcode);
        
        setTimeout(() => {
          setIsScanning(false);
        }, 1000);
      }
    }
  };

  const handleManualClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-screen">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Camera className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Barcode Scanner</h2>
                <p className="text-sm opacity-75">Point camera at barcode to scan</p>
              </div>
            </div>
            <button
              onClick={handleManualClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white max-w-md mx-auto p-6">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
                <p className="text-sm opacity-75 mb-4">{error}</p>
                <Button onClick={startCamera} variant="secondary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Hidden Canvas for Image Processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Scanning Frame */}
            <div className="relative">
              <div className={`w-64 h-40 border-2 rounded-lg transition-colors ${
                isScanning 
                  ? 'border-green-400 shadow-lg shadow-green-400/50' 
                  : 'border-white border-opacity-50'
              }`}>
                {/* Corner Indicators */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-white"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-white"></div>
                
                {/* Scanning Line Animation */}
                {!isScanning && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-full h-0.5 bg-red-400 animate-pulse"
                         style={{
                           animation: 'scan 2s linear infinite',
                           top: '50%'
                         }}>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center text-white">
                <p className="text-sm opacity-75">
                  {isScanning ? 'Barcode detected!' : 'Align barcode within the frame'}
                </p>
              </div>
            </div>
          </div>

          {/* Scan Success Indicator */}
          {isScanning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-500 text-white p-4 rounded-lg flex items-center space-x-2 animate-pulse">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Barcode Scanned!</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Switch Camera Button */}
            <Button
              variant="secondary"
              onClick={switchCamera}
              disabled={isLoading}
              className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Switch Camera
            </Button>

            {/* Manual Scan Button */}
            <Button
              onClick={() => {
                // Trigger manual scan
                const testBarcode = '1234567890123';
                onScan(testBarcode);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test Scan
            </Button>

            {/* Close Button */}
            <Button
              variant="secondary"
              onClick={handleManualClose}
              className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30"
            >
              Close Scanner
            </Button>
          </div>

          {/* Last Scan Info */}
          {lastScan && (
            <div className="mt-3 text-center text-white text-sm opacity-75">
              Last scan: {lastScan}
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation for Scanning Line */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;