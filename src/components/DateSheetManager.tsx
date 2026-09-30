import React, { useState } from 'react';
import { DateSheetItem, Examination, ClassItem } from '../types';
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Save,
  BookOpen,
} from 'lucide-react';
import { OFFICIAL_FULL_TIMETABLE } from '../utils/timetableData';
import { normalizeClassName } from './StudentManager';

interface DateSheetManagerProps {
  dateSheet: DateSheetItem[];
  examinations: Examination[];
  classes?: ClassItem[];
  activeExamId: string;
  onSaveDateSheet: (items: DateSheetItem[]) => void;
}

const ALL_CLASS_NAMES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const QUICK_SUBJECT_SUGGESTIONS = [
  'Math',
  'Hindi',
  'Hindi I',
  'Hindi II',
  'English',
  'English I',
  'English II',
  'Science',
  'S.ST',
  'Computer',
  'Urdu',
  'Urdu / Sanskrit',
  'Drawing',
  'Math Writing',
  'Math oral',
  'Hindi Writing',
  'Hindi oral',
  'English Writing',
  'English oral',
];

export const DateSheetManager: React.FC<DateSheetManagerProps> = ({
  dateSheet,
  examinations,
  classes = [],
  activeExamId,
  onSaveDateSheet,
}) => {
  const [selectedExamId, setSelectedExamId] = useState(activeExamId);
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DateSheetItem | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Available classes combining provided classes and default 11 classes
  const availableClasses = Array.from(
    new Set([
      ...ALL_CLASS_NAMES,
      ...classes.map((c) => normalizeClassName(c.name)),
    ])
  ).filter(Boolean);

  // Filter items for current exam & selected class
  const examItems = dateSheet
    .filter((ds) => {
      const matchExam = !ds.examId || ds.examId === selectedExamId;
      if (!matchExam) return false;
      if (selectedClassFilter === 'all') return true;
      const dNorm = normalizeClassName(ds.className);
      return dNorm === normalizeClassName(selectedClassFilter);
    })
    .sort((a, b) => {
      // Sort first by class, then by order
      const normA = normalizeClassName(a.className);
      const normB = normalizeClassName(b.className);
      if (normA !== normB && selectedClassFilter === 'all') {
        return normA.localeCompare(normB, undefined, { numeric: true });
      }
      return (Number(a.order) || 0) - (Number(b.order) || 0);
    });

  // Calculate subject count per class
  const getClassSubjectCount = (clsName: string) => {
    return dateSheet.filter((ds) => {
      const matchExam = !ds.examId || ds.examId === selectedExamId;
      return matchExam && normalizeClassName(ds.className) === normalizeClassName(clsName);
    }).length;
  };

  const handleLoadOfficialTimeTable = () => {
    if (
      confirm(
        'Fill complete official class-wise timetable (Nursery to 8th) for this examination? This will load the exact schedule from your uploaded date sheet.'
      )
    ) {
      // Keep items from other exams intact
      const otherExamsItems = dateSheet.filter(
        (ds) => ds.examId && ds.examId !== selectedExamId
      );
      // Map official timetable to current exam
      const newSchedule = OFFICIAL_FULL_TIMETABLE.map((item, idx) => ({
        ...item,
        id: `ds-${selectedExamId}-${idx + 1}-${Date.now()}`,
        examId: selectedExamId,
      }));

      const merged = [...otherExamsItems, ...newSchedule];
      onSaveDateSheet(merged);
      showNotice();
    }
  };

  const showNotice = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const handleOpenAdd = () => {
    const targetClass = selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 1';
    const nextOrder = examItems.length + 1;
    setEditingItem({
      id: `ds-${Date.now()}-${nextOrder}`,
      examId: selectedExamId,
      className: targetClass,
      date: '05/10/2026',
      day: 'Monday',
      subject: '',
      time: '09:00 AM – 12:00 PM',
      room: 'Main Hall',
      order: nextOrder,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DateSheetItem) => {
    setEditingItem({
      ...item,
      className: item.className || 'Class 1',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this subject entry from the schedule?')) {
      const updated = dateSheet.filter((ds) => ds.id !== id);
      onSaveDateSheet(updated);
      showNotice();
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...examItems];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[target];
    newItems[target] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    const otherItems = dateSheet.filter(
      (ds) => !examItems.some((ei) => ei.id === ds.id)
    );
    onSaveDateSheet([...otherItems, ...newItems]);
    showNotice();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.subject.trim()) return;

    const cleanItem: DateSheetItem = {
      ...editingItem,
      subject: editingItem.subject.trim(),
      className: editingItem.className ? normalizeClassName(editingItem.className) : '',
      date: editingItem.date.trim(),
      day: editingItem.day.trim(),
      time: editingItem.time.trim() || '09:00 AM – 12:00 PM',
      room: editingItem.room?.trim() || '',
      order: Number(editingItem.order) || 1,
    };

    const existingIndex = dateSheet.findIndex((d) => d.id === cleanItem.id);
    let updated: DateSheetItem[];
    if (existingIndex >= 0) {
      updated = [...dateSheet];
      updated[existingIndex] = cleanItem;
    } else {
      updated = [...dateSheet, cleanItem];
    }

    onSaveDateSheet(updated);
    showNotice();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveAllExplicitly = () => {
    onSaveDateSheet([...dateSheet]);
    showNotice();
  };

  return (
    <div className="space-y-4">
      {/* Success Notification Bar */}
      {saveSuccessNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Time Table successfully saved and synced across all devices!</span>
          </div>
          <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded-md">Cloud Synced</span>
        </div>
      )}

      {/* Header and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Examination Date Sheet & Timetable
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
              {examItems.length} Entries in View
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
              Total {dateSheet.length} Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fill and manage class-wise timetable (Dates, Days, Subjects, and Timings) printed on the admit cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Examination selector */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          {/* Quick Load Official 11 Classes Timetable Button */}
          <button
            onClick={handleLoadOfficialTimeTable}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer hover:shadow"
            title="Load the complete official 76-subject schedule from your uploaded timetable (Nursery to Class 8)"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" /> Fill Official Time Table
          </button>

          {/* Explicit Cloud Save Button */}
          <button
            onClick={handleSaveAllExplicitly}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            title="Force immediate cloud save & sync"
          >
            <Save className="w-3.5 h-3.5 text-slate-300" /> Save & Sync
          </button>

          {/* Add Manual Subject Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Class Switcher Filter Pills */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Filter By Class:</span>
          <span className="text-slate-400 font-normal">Click any class to view and edit its timetable</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedClassFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-400'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>All Classes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedClassFilter === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {dateSheet.length}
            </span>
          </button>

          {availableClasses.map((clsName) => {
            const count = getClassSubjectCount(clsName);
            const isSelected = selectedClassFilter === clsName;
            return (
              <button
                key={clsName}
                onClick={() => setSelectedClassFilter(clsName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-400'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{clsName}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 text-[11px]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Exam Date</th>
              <th className="py-3 px-4">Day</th>
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-4">Assigned Class</th>
              <th className="py-3 px-4">Timing</th>
              <th className="py-3 px-4 text-center">Order</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {examItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">No timetable entries found for this class.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click <span className="font-bold text-emerald-600">"Fill Official Time Table"</span> to load the complete schedule, or click <span className="font-bold text-blue-600">"+ Add Subject"</span> to add manually.
                  </p>
                </td>
              </tr>
            ) : (
              examItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600 whitespace-nowrap">{item.day}</td>
                  <td className="py-3 px-4 font-extrabold text-blue-950 text-sm">
                    {item.subject}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                      {item.className ? normalizeClassName(item.className) : 'All Classes'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {item.time || '09:00 AM – 12:00 PM'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === examItems.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Subject Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                {editingItem.subject ? 'Edit Subject Schedule' : 'Add New Subject Schedule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Class Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Target Class *
                </label>
                <select
                  value={editingItem.className || 'Class 1'}
                  onChange={(e) => setEditingItem({ ...editingItem, className: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Classes (Common for everyone)</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Name Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Math, Hindi I, English II, Science, Drawing"
                  value={editingItem.subject}
                  onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-slate-900"
                />

                {/* Quick Subject Suggestions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold mr-1">Quick pick:</span>
                  {QUICK_SUBJECT_SUGGESTIONS.slice(0, 10).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, subject: sub })}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors cursor-pointer"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Day Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Exam Date (DD/MM/YYYY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="05/10/2026"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={editingItem.day}
                    onChange={(e) => setEditingItem({ ...editingItem, day: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white cursor-pointer"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exam Timing */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Exam Timing (Printed on Admit Card)
                </label>
                <input
                  type="text"
                  placeholder="09:00 AM – 12:00 PM"
                  value={editingItem.time}
                  onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Save Subject Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
