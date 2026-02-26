import React, { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';

const CourseModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingCourse,
  departments,
  mtbmCourseOptions,
  semesters,
  user 
}) => {
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_title: '',
    department: '',
    semester: ''
  });
  const [studentLevel, setStudentLevel] = useState('');

  useEffect(() => {
    if (editingCourse) {
      setCourseForm(editingCourse);
    } else {
      setCourseForm({ course_code: '', course_title: '', department: '', semester: '' });
    }
  }, [editingCourse]);

  useEffect(() => {
    if (isOpen && !editingCourse) {
      const fetchStudentLevel = async () => {
        const { data } = await supabase
          .from('students')
          .select('level')
          .eq('user_id', user.id)
          .single();
        if (data) setStudentLevel(data.level);
      };
      fetchStudentLevel();
    }
  }, [isOpen, editingCourse, user.id]);

  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    setCourseForm({ 
      ...courseForm, 
      department: selectedDept,
      course_code: '', 
      course_title: ''
    });
  };

  const handleCourseCodeChange = (e) => {
    const selectedCode = e.target.value;
    if (courseForm.department.includes('MTBM')) {
      const selectedCourse = mtbmCourseOptions.find(c => c.code === selectedCode);
      setCourseForm({ 
        ...courseForm, 
        course_code: selectedCode,
        course_title: selectedCourse ? selectedCourse.title : ''
      });
    } else {
      setCourseForm({ ...courseForm, course_code: selectedCode });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(courseForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110] transition-all">
      <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg p-8 animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
            <BookOpen size={28} />
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">
              {editingCourse ? 'Modify Course' : 'Launch New Course'}
            </h3>
            <p className="text-slate-500 text-sm font-medium">Please provide accurate academic details below.</p>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
              <select 
                required 
                value={courseForm.department} 
                onChange={handleDepartmentChange} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-medium appearance-none"
              >
                <option value="">Select Faculty...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code</label>
                {courseForm.department.includes('MTBM') ? (
                  <select 
                    required 
                    value={courseForm.course_code} 
                    onChange={handleCourseCodeChange} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                  >
                    <option value="">Code</option>
                    {mtbmCourseOptions.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required 
                    value={courseForm.course_code} 
                    onChange={handleCourseCodeChange} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" 
                    placeholder="CS301"
                  />
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                <select 
                  required 
                  value={courseForm.semester} 
                  onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium"
                >
                  <option value="">Select...</option>
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Course Title</label>
              <input 
                type="text" 
                required 
                value={courseForm.course_title} 
                onChange={(e) => setCourseForm({ ...courseForm, course_title: e.target.value })} 
                readOnly={courseForm.department.includes('MTBM')}
                className={`w-full px-5 py-4 rounded-2xl font-bold transition-all ${
                  courseForm.department.includes('MTBM') 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' 
                    : 'bg-slate-50 border border-slate-100 focus:bg-white'
                }`}
                placeholder="Enter course name..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            {editingCourse ? 'Save Changes' : 'Confirm Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CourseModal;