import React, { useState } from 'react';
import { MapPin, Trash2, AlertCircle, UserCheck, Clock, User } from 'lucide-react';

const AttendanceRecordsList = ({ records, locations, onRemoveFromSession, userRole, profiles }) => {
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

  const isManualRecord = (record) => {
    return record.marked_manually === true;
  };

  const getStudentName = (record) => {
    // Try multiple possible locations for the student name
    if (record.student_name) {
      return record.student_name;
    }
    if (record.students?.profiles?.full_name) {
      return record.students.profiles.full_name;
    }
    if (record.students?.full_name) {
      return record.students.full_name;
    }
    if (record.full_name) {
      return record.full_name;
    }
    if (record.profiles?.full_name) {
      return record.profiles.full_name;
    }
    // If we have matric number but no name, show "Student" + last 4 digits of matric
    if (record.matric_no) {
      const lastFour = record.matric_no.slice(-4);
      return `Student (${lastFour})`;
    }
    return 'Unknown';
  };

  const getMatricNo = (record) => {
    if (record.matric_no) {
      return record.matric_no;
    }
    if (record.students?.matric_no) {
      return record.students.matric_no;
    }
    return 'N/A';
  };

  const getMarkerInfo = (record) => {
    if (!record.marked_manually) {
      return { type: 'QR Scan', icon: null, color: 'text-blue-600', bg: 'bg-blue-50' };
    }
    
    const markerName = record.marked_by_name || 
                      (record.marked_by && profiles?.[record.marked_by]?.full_name) || 
                      'Unknown';
    
    return {
      type: 'Manual',
      icon: UserCheck,
      marker: markerName,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    };
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {records.map((record) => {
          const markerInfo = getMarkerInfo(record);
          const MarkerIcon = markerInfo.icon;
          const studentName = getStudentName(record);
          const matricNo = getMatricNo(record);
          
          return (
            <div key={record.id} className="p-4 space-y-2 hover:bg-slate-50 relative group">
              {canRemove && (
                <button
                  onClick={() => handleRemoveClick(record)}
                  className="absolute top-11 right-4 px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded-lg transition-opacity text-xs z-10"
                  title="Remove from this session"
                >
                  remove
                </button>
              )}

              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 text-sm">
                      {studentName}
                    </p>
                    {isManualRecord(record) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                        <UserCheck size={10} />
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {matricNo}
                  </p>
                  
                  {isManualRecord(record) && markerInfo.marker && (
                    <div className="flex items-center gap-1 mt-1">
                      {MarkerIcon && <MarkerIcon size={10} className="text-purple-500" />}
                      <span className="text-xs text-purple-600">
                        by {markerInfo.marker}
                      </span>
                    </div>
                  )}
                  
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
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Student</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Matric No</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Time</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Method</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Marked By</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Location</th>
              {canRemove && <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map((record) => {
              const markerInfo = getMarkerInfo(record);
              const MarkerIcon = markerInfo.icon;
              const isManual = isManualRecord(record);
              const studentName = getStudentName(record);
              const matricNo = getMatricNo(record);
              
              return (
                <tr key={record.id} className={`hover:bg-slate-50/50 group ${isManual ? 'bg-purple-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {studentName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {matricNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-indigo-600">
                    {new Date(record.scanned_at).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isManual ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isManual ? <UserCheck size={12} /> : null}
                      {isManual ? 'Manual' : 'QR Scan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isManual ? (
                      <div className="flex items-center gap-1 text-sm text-purple-600">
                        {MarkerIcon && <MarkerIcon size={12} />}
                        <span>{markerInfo.marker || 'Unknown'}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {record.location_lat ? (
                      locations[record.id] || 'Loading...'
                    ) : (
                      <span className="text-slate-400 italic">No location</span>
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
              );
            })}
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
                {getStudentName(showRemoveConfirm)} ({getMatricNo(showRemoveConfirm)})
              </span>{' '}
              from this session? This will mark them as absent.
              {showRemoveConfirm.marked_manually && (
                <span className="block mt-2 text-purple-600 text-xs">
                  <span className="font-medium">Manual entry</span>
                  {showRemoveConfirm.manual_reason && `: "${showRemoveConfirm.manual_reason}"`}
                  {showRemoveConfirm.marked_by_name && (
                    <span className="block mt-1 text-xs">
                      Marked by: {showRemoveConfirm.marked_by_name}
                    </span>
                  )}
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