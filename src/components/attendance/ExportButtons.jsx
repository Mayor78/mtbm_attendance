import React from 'react';
import { FileText, Download } from 'lucide-react';

export const SessionExportButton = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md group"
  >
    <FileText size={16} className="mb-1 group-hover:scale-110 transition-transform" />
    <span className="text-[10px] uppercase font-bold">PDF</span>
  </button>
);

export const StudentExportButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md"
  >
    <Download size={16} className="mb-1" />
    <span className="text-[10px] uppercase font-bold">Export</span>
  </button>
);