// components/lecturer/TeachingSchedule.jsx
import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

const TeachingSchedule = ({ courses }) => {
  // Group courses by day/time (you'd need to add schedule data to your DB)
  const schedule = [
    { day: 'Monday', time: '09:00 - 11:00', course: 'BUS301', room: 'Room 101' },
    { day: 'Monday', time: '13:00 - 15:00', course: 'MTH101', room: 'Room 203' },
    { day: 'Wednesday', time: '10:00 - 12:00', course: 'BUS302', room: 'Room 101' },
    { day: 'Friday', time: '14:00 - 16:00', course: 'MTH102', room: 'Room 203' },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-indigo-500" />
        Today's Schedule
      </h3>

      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
            <div className="w-16 text-xs font-medium text-slate-500">{item.time}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{item.course}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin size={10} />
                {item.room}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        View Full Schedule →
      </button>
    </div>
  );
};

export default TeachingSchedule;