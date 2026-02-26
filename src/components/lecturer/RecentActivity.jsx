// components/lecturer/RecentActivity.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, UserCheck, QrCode, UserPlus } from 'lucide-react';

const RecentActivity = ({ courses }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courses && courses.length > 0) {
      fetchRecentActivity();
    } else {
      setActivities([]);
      setLoading(false);
    }
  }, [courses]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      const courseIds = courses.map(c => c.id);
      
      if (courseIds.length === 0) {
        setActivities([]);
        return;
      }

      // Get recent sessions
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          is_active,
          courses (
            course_code
          ),
          profiles!created_by (
            full_name
          )
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent manual entries from the view
      const { data: manual } = await supabase
        .from('pending_approvals_view')
        .select('*')
        .in('course_id', courseIds)
        .order('scanned_at', { ascending: false })
        .limit(5);

      // Combine and sort
      const sessionActivities = (sessions || []).map(s => ({
        id: `session-${s.id}`,
        type: 'session',
        message: `${s.profiles?.full_name || 'Someone'} started a session`,
        course: s.courses?.course_code,
        time: s.start_time,
        icon: QrCode,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      }));

      const manualActivities = (manual || []).map(m => ({
        id: `manual-${m.id}`,
        type: 'manual',
        message: `${m.marked_by_name || 'HOC'} manually added ${m.student_name}`,
        course: m.course_code,
        time: m.scanned_at,
        reason: m.manual_reason,
        icon: UserPlus,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      }));

      const allActivities = [...sessionActivities, ...manualActivities]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-12 bg-slate-100 rounded"></div>
          <div className="h-12 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
        <Clock size={24} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock size={18} className="text-indigo-500" />
        Recent Activity
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <div className={`w-8 h-8 rounded-lg ${activity.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={activity.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activity.course}</p>
                {activity.reason && (
                  <p className="text-xs text-slate-400 mt-1 italic truncate">"{activity.reason}"</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(activity.time).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;