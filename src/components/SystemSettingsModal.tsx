import React, { useState } from 'react';
import { UserSession, SchoolSettings } from '../types';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  school: SchoolSettings;
  onSaveSession: (session: UserSession) => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  userSession,
  school,
  onSaveSession,
}) => {
  const [username, setUsername] = useState(userSession.username || 'Manoj Pandey');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSession({
      ...userSession,
      username,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Administrator Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-base flex items-center justify-center shadow-2xs">
              MP
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{username}</h4>
              <p className="text-xs text-blue-700 font-semibold">School Administrator & Principal</p>
              <p className="text-[10px] text-slate-400">{school.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrator / Manager Name
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Mobile Number
            </label>
            <input
              type="text"
              value={school.mobile}
              readOnly
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow-2xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
