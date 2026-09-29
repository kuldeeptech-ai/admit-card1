import React, { useState } from 'react';
import { DateSheetItem, Examination, ClassItem } from '../types';
import { CalendarDays, Plus, Edit, Trash2, MoveUp, MoveDown, X, Sparkles, GraduationCap } from 'lucide-react';
import { INITIAL_DATE_SHEET } from '../utils/defaultData';

interface DateSheetManagerProps {
  dateSheet: DateSheetItem[];
  examinations: Examination[];
  classes?: ClassItem[];
  activeExamId: string;
  onSaveDateSheet: (items: DateSheetItem[]) => void;
}

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

  // Filter items for current exam & class
  const examItems = dateSheet
    .filter((ds) => {
      const matchExam = !ds.examId || ds.examId === selectedExamId;
      const matchClass = selectedClassFilter === 'all' || !ds.className || ds.className === selectedClassFilter;
      return matchExam && matchClass;
    })
    .sort((a, b) => a.order - b.order);

  const handleLoadAll11Subjects = () => {
    if (confirm('Load complete 11 subjects timetable for this examination?')) {
      const otherItems = dateSheet.filter((ds) => ds.examId && ds.examId !== selectedExamId);
      const new11Items = INITIAL_DATE_SHEET.map((item, idx) => ({
        ...item,
        id: `ds-${Date.now()}-${idx + 1}`,
        examId: selectedExamId,
        className: selectedClassFilter !== 'all' ? selectedClassFilter : undefined,
        order: idx + 1,
      }));
      onSaveDateSheet([...otherItems, ...new11Items]);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `ds-${Date.now()}`,
      examId: selectedExamId,
      className: selectedClassFilter !== 'all' ? selectedClassFilter : undefined,
      date: '12-10-2026',
      day: 'Monday',
      subject: '',
      time: '09:00 AM – 12:00 PM',
      room: 'Examination Hall 1',
      order: examItems.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DateSheetItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this subject from the examination schedule?')) {
      const updated = dateSheet.filter((ds) => ds.id !== id);
      onSaveDateSheet(updated);
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

    const otherItems = dateSheet.filter((ds) => ds.examId && ds.examId !== selectedExamId);
    onSaveDateSheet([...otherItems, ...newItems]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.subject.trim()) return;

    const existingIndex = dateSheet.findIndex((d) => d.id === editingItem.id);
    if (existingIndex >= 0) {
      const copy = [...dateSheet];
      copy[existingIndex] = editingItem;
      onSaveDateSheet(copy);
    } else {
      onSaveDateSheet([...dateSheet, editingItem]);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleQuickAdd = (subjectName: string) => {
    if (examItems.some((item) => item.subject.toLowerCase() === subjectName.toLowerCase())) {
      alert(`"${subjectName}" is already in the timetable.`);
      return;
    }

    const nextOrder = examItems.length + 1;
    const lastItem = examItems[examItems.length - 1];
    let nextDate = '12-10-2026';
    let nextDay = 'Monday';

    if (lastItem && lastItem.date.includes('-')) {
      const parts = lastItem.date.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        if (!isNaN(d)) {
          nextDate = `${String(d + 1).padStart(2, '0')}-${parts[1]}-${parts[2]}`;
        }
      }
    }

    const newItem: DateSheetItem = {
      id: `ds-${Date.now()}-${nextOrder}`,
      examId: selectedExamId,
      className: selectedClassFilter !== 'all' ? selectedClassFilter : undefined,
      date: nextDate,
      day: nextDay,
      subject: subjectName,
      time: lastItem?.time || '09:00 AM – 12:00 PM',
      room: lastItem?.room || 'Hall 1',
      order: nextOrder,
    };

    onSaveDateSheet([...dateSheet, newItem]);
  };

  const commonSubjects = [
    'Hindi',
    'English',
    'Mathematics',
    'Science',
    'Social Science',
    'Sanskrit',
    'Computer Science',
    'General Knowledge',
    'Drawing & Art',
    'Moral Science',
    'Oral / Viva',
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Examination Date Sheet & Timetable
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              {examItems.length} Subjects Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure exam dates, days, and exact timings (e.g. 09:00 AM – 12:00 PM) printed on the admit cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Exam selector */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {examinations.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          {/* Optional Class filter */}
          {classes.length > 0 && (
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Classes (Common Timetable)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleLoadAll11Subjects}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Load complete 11 subjects schedule"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" /> Load 11 Subjects
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Quick Add Subject Pill Bar */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          Quick Add Subject:
        </span>
        {commonSubjects.map((sub) => {
          const isAdded = examItems.some((item) => item.subject.toLowerCase() === sub.toLowerCase());
          return (
            <button
              key={sub}
              onClick={() => handleQuickAdd(sub)}
              disabled={isAdded}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAdded
                  ? 'bg-slate-200/70 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300 shadow-2xs'
              }`}
            >
              {isAdded ? `✓ ${sub}` : `+ ${sub}`}
            </button>
          );
        })}
      </div>

      {/* Date Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Exam Date</th>
              <th className="py-3 px-4">Day</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Exam Timing</th>
              <th className="py-3 px-4 text-center">Order</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {examItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No date sheet entries for this examination. Click "Load 11 Subjects" or "+ Add Subject".
                </td>
              </tr>
            ) : (
              examItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{item.day}</td>
                  <td className="py-3 px-4 font-extrabold text-blue-900">{item.subject}</td>
                  <td className="py-3 px-4 text-slate-500">{item.className || 'All Classes'}</td>
                  <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">{item.time}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === examItems.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingItem.subject ? 'Edit Subject Details' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hindi, English, Mathematics, Science"
                  value={editingItem.subject}
                  onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date (DD-MM-YYYY)</label>
                  <input
                    type="text"
                    placeholder="12-10-2026"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
                  <input
                    type="text"
                    placeholder="e.g. Monday"
                    value={editingItem.day}
                    onChange={(e) => setEditingItem({ ...editingItem, day: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Exam Timing (Full Display)</label>
                <input
                  type="text"
                  placeholder="09:00 AM – 12:00 PM"
                  value={editingItem.time}
                  onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
