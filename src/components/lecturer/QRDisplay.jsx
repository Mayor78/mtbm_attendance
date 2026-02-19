import React from 'react';
import Button from '../common/Button';

const QRDisplay = ({ qrValue }) => {
  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Mock QR Code */}
          <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg p-2">
            <div className="grid grid-cols-7 gap-0.5">
              {[...Array(49)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square ${
                    Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                  }`}
                ></div>
              ))}
            </div>
          </div>
          {/* Center logo */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-300 rounded"></div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-600 text-center">
        Students can scan this QR code to mark attendance
      </p>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="secondary" size="sm">
          Refresh QR Code
        </Button>
      </div>
    </div>
  );
};

export default QRDisplay;