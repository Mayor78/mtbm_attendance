import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Download } from 'lucide-react';

const QRModal = ({ isOpen, onClose, session, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
      <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100">
          <X size={20} />
        </button>
        
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{session.course_code}</h3>
          <p className="text-slate-500 text-sm">{session.course_title}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-50 flex justify-center shadow-inner mb-6">
          <QRCodeCanvas 
            value={JSON.stringify({ session_id: session.id, token: session.token })} 
            size={220} 
            level="H" 
          />
        </div>

        <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
          <div className="flex flex-col items-center">
            <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Backup Code</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-indigo-600 tracking-widest">{session.numeric_code}</span>
              <button 
                onClick={() => copyToClipboard(session.numeric_code)} 
                className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button onClick={onDownload} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
          <Download size={20} /> Save QR Code
        </button>
      </div>
    </div>
  );
};

export default QRModal;