import React, { useState } from 'react';
import Button from '../common/Button';

const NumericCodeDisplay = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Code Display */}
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Backup Entry Code</p>
        <p className="text-4xl font-bold text-gray-800 tracking-wider">{code}</p>
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-600 text-center">
        Students can enter this code if they can't scan the QR
      </p>

      {/* Copy Button */}
      <div className="flex justify-center">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? '✓ Copied!' : 'Copy Code'}
        </Button>
      </div>
    </div>
  );
};

export default NumericCodeDisplay;