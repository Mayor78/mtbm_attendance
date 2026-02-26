// components/lecturer/PendingApprovals.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, User, AlertCircle } from 'lucide-react';

const PendingApprovals = ({ courses, onApprove }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courses && courses.length > 0) {
      fetchPendingApprovals();
    } else {
      setPending([]);
      setLoading(false);
    }
  }, [courses]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const courseIds = courses.map(c => c.id);
      
      if (courseIds.length === 0) {
        setPending([]);
        return;
      }

      // Use the view we created - it's more reliable
      const { data, error } = await supabase
        .from('pending_approvals_view')
        .select('*')
        .in('course_id', courseIds)
        .order('scanned_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending approvals:', error);
        throw error;
      }

      console.log('Pending approvals:', data);
      setPending(data || []);
    } catch (error) {
      console.error('Error in fetchPendingApprovals:', error);
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (recordId, approved) => {
    try {
      setProcessingId(recordId);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('attendance_records')
        .update({
          verified_by: userData.user?.id,
          verified_at: new Date().toISOString(),
          is_suspicious: !approved
        })
        .eq('id', recordId);

      if (error) throw error;

      setPending(prev => prev.filter(r => r.id !== recordId));
      onApprove?.();
      
    } catch (error) {
      console.error('Error updating record:', error);
      setError('Failed to update record');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={20} className="text-green-500" />
        </div>
        <h3 className="text-sm font-medium text-slate-900">All Caught Up!</h3>
        <p className="text-xs text-slate-500 mt-1">No pending approvals at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <AlertCircle size={18} className="text-yellow-500" />
        Pending Approvals ({pending.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {pending.map((record) => (
          <div
            key={record.id}
            className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-900">
                    {record.student_name}
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                    Pending
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 mt-1">
                  {record.matric_no}
                </p>

                <p className="text-xs text-indigo-600 mt-1">
                  {record.course_code} - {record.course_title}
                </p>

                {record.manual_reason && (
                  <p className="text-xs text-slate-600 bg-white p-2 rounded mt-2">
                    <span className="font-medium">Reason:</span> {record.manual_reason}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{new Date(record.scanned_at).toLocaleString()}</span>
                  {record.marked_by_name && (
                    <>
                      <span>•</span>
                      <User size={12} />
                      <span>{record.marked_by_name}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => handleApproval(record.id, true)}
                  disabled={processingId === record.id}
                  className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
                  title="Approve"
                >
                  <CheckCircle size={16} />
                </button>
                <button
                  onClick={() => handleApproval(record.id, false)}
                  disabled={processingId === record.id}
                  className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                  title="Reject"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;