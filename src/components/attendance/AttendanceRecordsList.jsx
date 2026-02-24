import React, { useState } from 'react';
import { MapPin, Trash2, AlertCircle, UserCheck, Clock } from 'lucide-react';

const AttendanceRecordsList = ({ records, locations, onRemoveFromSession, userRole }) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>No attendance records for this session</p>
      </div>
    );
  }

  const handleRemoveClick = (record) => {
    setShowRemoveConfirm(record);
  };

  const confirmRemove = () => {
    if (showRemoveConfirm && onRemoveFromSession) {
      onRemoveFromSession(showRemoveConfirm);
      setShowRemoveConfirm(null);
    }
  };

  const canRemove = userRole === 'hoc' || userRole === 'lecturer';

  // Helper to check if record is manual
  const isManualRecord = (record) => {
    return record.marked_manually === true;
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {records.map((record) => (
          <div key={record.id} className="p-4 space-y-2 hover:bg-slate-50 relative group">
            {/* Remove button - only for HOC/Lecturer */}
            {canRemove && (
              <button
                onClick={() => handleRemoveClick(record)}
                className="absolute top-11 right-4 px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded-lg  transition-opacity text-xs z-10"
                title="Remove from this session"
              >
                remove
              </button>
            )}

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">
                    {record.student_name || record.students?.profiles?.full_name}
                  </p>
                  {isManualRecord(record) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                      <UserCheck size={10} />
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {record.matric_no || record.students?.matric_no}
                </p>
                {isManualRecord(record) && record.manual_reason && (
                  <p className="text-xs text-purple-600 mt-1 italic">
                    "{record.manual_reason}"
                  </p>
                )}
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                {new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            {record.location_lat && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                <MapPin size={12} className="text-indigo-500 flex-shrink-0" />
                <span className="truncate">
                  {locations[record.id] || 'Loading location...'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Student</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Matric No</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Time</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Location</th>
              {canRemove && <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record) => (
              <tr key={record.id} className={`hover:bg-slate-50/50 group ${isManualRecord(record) ? 'bg-purple-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {record.student_name || record.students?.profiles?.full_name}
                    </span>
                    {isManualRecord(record) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                        <UserCheck size={10} />
                        Manual
                      </span>
                    )}
                  </div>
                  {isManualRecord(record) && record.manual_reason && (
                    <div className="text-xs text-purple-600 mt-1 italic flex items-center gap-1">
                      <Clock size={10} />
                      {record.manual_reason}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {record.matric_no || record.students?.matric_no}
                </td>
                <td className="px-4 py-3 text-sm text-indigo-600">
                  {new Date(record.scanned_at).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {record.location_lat ? (
                    locations[record.id] || 'Loading...'
                  ) : (
                    <span className="text-slate-400 italic">No location (manual entry)</span>
                  )}
                </td>
                {canRemove && (
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleRemoveClick(record)}
                      className="p-1.5 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                      title="Remove from this session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-900">Remove from Session?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove{' '}
              <span className="font-semibold">
                {showRemoveConfirm.student_name || showRemoveConfirm.students?.profiles?.full_name}
              </span>{' '}
              from this session? This will mark them as absent.
              {showRemoveConfirm.marked_manually && (
                <span className="block mt-2 text-purple-600 text-xs">
                  Note: This was a manual entry {showRemoveConfirm.manual_reason ? `(Reason: ${showRemoveConfirm.manual_reason})` : ''}
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceRecordsList;