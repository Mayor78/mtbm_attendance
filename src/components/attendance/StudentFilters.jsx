import React from 'react';

const StudentFilters = ({ sortBy, onSortChange, filterAttendance, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="flex-1 min-w-[120px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
      >
        <option value="name">Sort: Name</option>
        <option value="attendance">Sort: Count</option>
        <option value="percentage">Sort: %</option>
      </select>
      
      <select
        value={filterAttendance}
        onChange={(e) => onFilterChange(e.target.value)}
        className="flex-1 min-w-[120px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
      >
        <option value="all">All Students</option>
        <option value="high">High (75%+)</option>
        <option value="medium">Medium (50-74%)</option>
        <option value="low">Low (below 50%)</option>
      </select>
    </div>
  );
};

export default StudentFilters;