import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
 // Adjust path based on your folder structure
import { 
  Home, 
  BookOpen, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  ChevronRight,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Header from './Header';
import PerformanceMonitor from '../PerformanceMonitor';

export const Layout = ({ children }) => {
  const { profile, signOut, user} = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Integrated Minimalist Header */}
      <Header
        userRole={profile?.role || 'student'} 
        userData={profile} 
        username={user}
        onSignOut={signOut}
      />

      {/* Navigation Sidebar Overlay for Mobile */}
      <div 
        className={`fixed inset-0 z-[60] transition-visibility duration-300 lg:hidden ${
          sidebarOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleSidebar}
        />

        {/* Sidebar Panel */}
        <aside 
          className={`absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 flex items-center justify-between border-b border-slate-50">
            <span className="font-black text-indigo-600 tracking-tight text-xl">UniAttend</span>
            <button onClick={toggleSidebar} className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
            <SidebarLink to="/dashboard" icon={<Home size={20}/>} label="Dashboard" onClick={toggleSidebar} />
            <SidebarLink to="/courses" icon={<BookOpen size={20}/>} label="My Courses" onClick={toggleSidebar} />
            <SidebarLink to="/attendance" icon={<Calendar size={20}/>} label="History" onClick={toggleSidebar} />
            {profile?.role === 'admin' && (
              <SidebarLink to="/admin" icon={<ShieldCheck size={20}/>} label="Admin Portal" onClick={toggleSidebar} />
            )}
            <SidebarLink to="/settings" icon={<Settings size={20}/>} label="Account Settings" onClick={toggleSidebar} />
          </nav>

          {/* Bottom Profile Section in Sidebar */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                {profile?.full_name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{profile?.full_name}</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">{profile?.role}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col pt-20 sm:pt-24 min-h-screen">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Animated wrapper for children */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="max-w-7xl mx-auto w-full px-8 py-8 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <p>© 2026 UniAttend System</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors ">Built by Mayowa Abaham</a>
            </div>
            <PerformanceMonitor/>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Helper component for Sidebar Links
const SidebarLink = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center justify-between p-3.5 rounded-2xl transition-all group
      ${isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' 
        : 'text-slate-500 hover:bg-slate-50 font-semibold'
      }
    `}
  >
    <div className="flex items-center gap-3">
      <span className="opacity-80">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </NavLink>
);