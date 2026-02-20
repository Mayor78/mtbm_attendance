import React from 'react';

const AttendanceSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skeleton Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {/* Back Button Circle */}
            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              {/* Course Code Line */}
              <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
              {/* Course Title Line */}
              <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
          {/* Toggle Button Group Skeleton */}
          <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm" />
          <div className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm" />
        </div>

        {/* Skeleton Filter/Select Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <div className="h-2 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 w-full bg-slate-50 rounded-xl animate-pulse" />
        </div>

        {/* Skeleton List Items */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div 
              key={item} 
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  {/* Student Avatar Square */}
                  <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="space-y-2 py-1">
                    {/* Student Name */}
                    <div className="h-3 w-36 bg-slate-200 rounded animate-pulse" />
                    {/* Matric Number */}
                    <div className="h-2 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                {/* Status Badge */}
                <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              
              {/* Progress Bar Area (for student view) or Time area (for session view) */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-2 w-16 bg-slate-50 rounded animate-pulse" />
                  <div className="h-2 w-8 bg-slate-50 rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default AttendanceSkeleton