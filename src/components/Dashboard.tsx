import React from 'react';
import {
  Student,
  ClassItem,
  Examination,
  SchoolSettings,
} from '../types';
import {
  Users,
  GraduationCap,
  FileCheck,
  Clock,
  Printer,
  Palette,
  UserPlus,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { normalizeClassName } from './StudentManager';

interface DashboardProps {
  students: Student[];
  classes: ClassItem[];
  examinations: Examination[];
  activeExamId: string;
  school: SchoolSettings;
  onNavigate: (tab: any) => void;
  onSelectClassAndNavigate: (className: string, tab: any) => void;
  onPrintAll: () => void;
  onPrintClass: (className: string) => void;
  onBulkGenerate: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  classes,
  examinations,
  activeExamId,
  school,
  onNavigate,
  onSelectClassAndNavigate,
  onPrintAll,
  onPrintClass,
  onBulkGenerate,
}) => {
  const activeExam = examinations.find((e) => e.id === activeExamId) || examinations[0];

  const totalStudents = students.length;
  const totalClasses = classes.length;
  const generatedCount = students.filter((s) => s.isGenerated).length;
  const pendingCount = totalStudents - generatedCount;
  const completionPercentage = totalStudents > 0 ? Math.round((generatedCount / totalStudents) * 100) : 0;

  // Recent 6 students
  const recentStudents = [...students].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" /> School Examination Admit Card System • Session {school.academicSession}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
            {school.name}
          </h2>
          <p className="text-blue-200 text-xs sm:text-sm font-medium mb-4">
            {school.address} • Manager: <span className="text-amber-300 font-bold">{school.managedBy}</span> (Mob: {school.mobile})
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onPrintAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print All Admit Cards (A4 Sheets)
            </button>
            <button
              onClick={() => onNavigate('import_export')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> 📋 Bulk Excel Copy-Paste Import
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-300" /> View Class-Wise Students
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-[10px] text-slate-500 mt-1">Enrolled across classes</div>
        </div>

        {/* Total Classes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Classes</span>
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClasses}</div>
          <div className="text-[10px] text-slate-500 mt-1">Class 1 to 8 Rosters</div>
        </div>

        {/* Current Examination */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Exam</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-black text-slate-900 line-clamp-1" title={activeExam?.name}>
            {activeExam?.name || 'Annual Examination'}
          </div>
          <div className="inline-block px-1.5 py-0.5 mt-1 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-full">
            {activeExam?.status || 'Active'}
          </div>
        </div>

        {/* Generated Cards */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Generated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{generatedCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">{completionPercentage}% Ready</div>
        </div>

        {/* Pending Cards */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-1">Awaiting generation</div>
        </div>

        {/* Total A4 Sheets Required */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">A4 Paper Sheets</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {Math.ceil(totalStudents / 2)}
          </div>
          <div className="text-[10px] text-purple-600 mt-1">2 Cards Per A4 Sheet</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CLASS-WISE ROSTER & ONE-CLICK PRINT SECTION             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Class-Wise Students & Admit Card Print Hub
            </h3>
            <p className="text-xs text-slate-500">
              Each class is strictly separated. Generate, view, and print admit cards class-by-class.
            </p>
          </div>
          <button
            onClick={() => onNavigate('classes')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            Manage All Classes <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {classes.map((cls) => {
            const classStudents = students.filter(
              (s) => normalizeClassName(s.className) === normalizeClassName(cls.name)
            );
            const count = classStudents.length;
            const generated = classStudents.filter((s) => s.isGenerated).length;

            return (
              <div
                key={cls.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col justify-between hover:border-blue-300 hover:bg-white transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {cls.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      Sec: {cls.section}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-slate-900">{count} Students</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {generated}/{count} Ready
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3 truncate">
                    Teacher: <strong className="text-slate-700">{cls.classTeacher || '—'}</strong>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                  {/* View Students of this class */}
                  <button
                    onClick={() => onSelectClassAndNavigate(cls.name, 'students')}
                    className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" /> View Roster ({count})
                  </button>

                  {/* Print All Admit Cards for this class */}
                  <button
                    disabled={count === 0}
                    onClick={() => onPrintClass(cls.name)}
                    className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print {cls.name} Cards ({count})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generation Status & Current Exam Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Generation Progress & Quick Shortcuts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Admit Card Preparation Progress</h3>
              <p className="text-xs text-slate-500">
                {generatedCount} of {totalStudents} admit cards prepared for {activeExam?.name}
              </p>
            </div>
            {pendingCount > 0 ? (
              <button
                onClick={onBulkGenerate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Generate All {pendingCount} Pending Cards
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Cards Generated
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Quick Management Shortcuts */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onNavigate('students')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-blue-600 mb-1" />
              <div className="text-xs font-bold text-slate-800">Add Student</div>
              <div className="text-[10px] text-slate-500">Class-wise roster entry</div>
            </button>

            <button
              onClick={() => onNavigate('import_export')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600 mb-1" />
              <div className="text-xs font-bold text-slate-800">Excel Import</div>
              <div className="text-[10px] text-slate-500">Copy & paste sheets</div>
            </button>

            <button
              onClick={() => onNavigate('date_sheet')}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-600 mb-1" />
              <div className="text-xs font-bold text-slate-800">Exam Timetable</div>
              <div className="text-[10px] text-slate-500">11 Subjects schedule</div>
            </button>

            <button
              onClick={onPrintAll}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-600 mb-1" />
              <div className="text-xs font-bold text-slate-800">Print Engine (A4)</div>
              <div className="text-[10px] text-slate-500">2-Up / 4-Up Layout</div>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Current Exam Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Current Active Examination</h3>
              <button
                onClick={() => onNavigate('examinations')}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Title</span>
                <span className="font-extrabold text-slate-900">{activeExam?.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Exam Dates</span>
                  <span className="font-semibold text-slate-800">
                    {activeExam?.startDate} to {activeExam?.endDate}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Reporting Time</span>
                  <span className="font-semibold text-red-600">{activeExam?.reportingTime}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Examination Centre</span>
                <span className="font-medium text-slate-700">{activeExam?.examinationCentre}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Session: <strong className="text-slate-800">{activeExam?.academicSession}</strong></span>
            <span className="text-emerald-600 font-bold">✓ Active</span>
          </div>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recently Enrolled Students</h3>
            <p className="text-xs text-slate-500">Enrolled candidates ready for examination admit cards</p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            View All {students.length} Students →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Class & Sec</th>
                <th className="py-2.5 px-4">Roll No</th>
                <th className="py-2.5 px-4">Admission No</th>
                <th className="py-2.5 px-4">Father's Name</th>
                <th className="py-2.5 px-4">Admit Card No</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <img
                      src={s.photoUrl}
                      alt={s.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <span>{s.name}</span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {s.className} - {s.section}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-red-600">{s.rollNumber}</td>
                  <td className="py-2.5 px-4 font-mono">{s.admissionNumber}</td>
                  <td className="py-2.5 px-4">{s.fatherName}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {s.admitCardNumber || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {s.isGenerated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
