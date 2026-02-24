import React from 'react';
import { Map } from 'lucide-react';

const LocationSummary = ({ locations, studentStats }) => {
  const uniqueLocations = Array.from(new Set(
    studentStats
      .flatMap(s => s.locations)
      .filter(l => locations[l?.time])
      .map(l => locations[l.time]?.split(',')[0].trim())
  )).slice(0, 6);

  if (uniqueLocations.length === 0) return null;

  return (
    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Map size={14} className="text-indigo-600" />
        <h4 className="text-xs font-semibold text-indigo-900">Check-in Locations</h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {uniqueLocations.map((area, i) => (
          <span key={i} className="text-[10px] bg-white rounded-full px-2 py-1 text-indigo-700 border border-indigo-100">
            📍 {area}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LocationSummary;