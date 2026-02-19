import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut, Anchor, Menu } from 'lucide-react';

const Header = ({ schoolName = "FCFMT", username, onSignOut, userData, onMenuClick }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Anchor size={18} />
              </div>
              <span className="text-lg font-black text-slate-800 tracking-tighter">{schoolName}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 py-1 group"
              >
                <div className=" bg-slate-100 py-1 px-2 rounded-md flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 group-hover:border-blue-300 transition-all">
                {userData?.full_name?.length > 7 
  ? userData.full_name.substring(0, 7) + "..." 
  : userData?.full_name || "Guest"}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account</p>
                    <p className="text-sm font-bold text-slate-700 truncate"> {userData?.full_name?.length > 15 
  ? userData.full_name.substring(0, 15) + "..." 
  : userData?.full_name || "Guest"}</p>
                  </div>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    <User size={16} /> Profile
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors" onClick={onSignOut}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;