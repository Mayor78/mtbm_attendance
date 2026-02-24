import React from 'react';

const ReasonInput = ({ value, onChange }) => {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase ml-1">
        Reason
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Medical emergency, Network issues, etc."
        rows="3"
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 outline-none resize-none"
      />
    </div>
  );
};

export default ReasonInput;