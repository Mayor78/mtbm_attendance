import React from 'react';

const LocationAccuracyWarning = ({ accuracy }) => {
  if (accuracy > 50) {
    return (
      <p className="text-xs text-yellow-600 mt-1">
        ⚠️ Low accuracy (±{Math.round(accuracy)}m). Students must be within 200m.
      </p>
    );
  }
  return null;
};

export default LocationAccuracyWarning;