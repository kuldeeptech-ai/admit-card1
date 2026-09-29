import React from 'react';
import {
  SchoolSettings,
  Examination,
  UserSession,
} from '../types';
import { Printer, Eye, BookOpen, Menu, Sparkles, UserCheck } from 'lucide-react';

interface NavbarProps {
  school: SchoolSettings;
  examinations: Examination[];
  activeExamId: string;
  onSelectActiveExam: (id: string) => void;
  onOpenPrint: () => void;
  onOpenPreview: () => void;
  userSession: UserSession;
  onOpenLoginModal: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  school,
  examinations,
  activeExamId,
  onSelectActiveExam,
  onOpenPrint,
  onOpenPreview,
  userSession,
  onOpenLoginModal,
  onToggleSidebar,
}) => {
  return (
    <header className="no-print sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile menu toggle + School Branding */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt="Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white p-0.5 object-contain flex-shrink-0 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                HD
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-white truncate max-w-[180px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-[420px]">
                  {school.name}
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-900/60 text-blue-200 border border-blue-700/50 px-2 py-0.5 rounded-full flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Admit Card System
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden md:block max-w-[360px] lg:max-w-[440px]">
                {school.address} • Manager: {school.managedBy}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Exam Selector */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-800/90 border border-slate-700/70 rounded-lg px-3 py-1.5 flex-shrink-0">
          <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-300">Exam:</span>
          <select
            value={activeExamId}
            onChange={(e) => onSelectActiveExam(e.target.value)}
            className="bg-slate-900 text-xs font-bold text-white rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[220px] truncate"
          >
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Active Examination" />
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Open Live Preview"
          >
            <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm hover:shadow-md cursor-pointer"
            title="Print A4 Admit Cards"
          >
            <Printer className="w-4 h-4 text-white flex-shrink-0" />
            <span>Print A4</span>
          </button>

          {/* Admin Profile Button */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-slate-700 hover:opacity-90 transition-opacity cursor-pointer flex-shrink-0"
            title="Admin Profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
              MP
            </div>
            <div className="hidden 2xl:block text-left">
              <span className="block text-xs font-bold text-white line-clamp-1">{school.managedBy || 'Manoj Pandey'}</span>
              <span className="block text-[10px] text-amber-300/90 font-medium">Administrator</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
