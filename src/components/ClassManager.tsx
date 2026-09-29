import React, { useState } from 'react';
import { ClassItem, Student } from '../types';
import { GraduationCap, Plus, Edit, Trash2, Users, Printer, X, FileCheck, ArrowRight } from 'lucide-react';
import { normalizeClassName } from './StudentManager';

interface ClassManagerProps {
  classes: ClassItem[];
  students: Student[];
  onSaveClass: (cls: ClassItem) => void;
  onDeleteClass: (id: string) => void;
  onPrintClass: (className: string) => void;
  onViewClassStudents?: (className: string) => void;
  onGenerateClassCards?: (className: string) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  students,
  onSaveClass,
  onDeleteClass,
  onPrintClass,
  onViewClassStudents,
  onGenerateClassCards,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const handleOpenAdd = () => {
    setEditingClass({
      id: `cls-${Date.now()}`,
      name: `Class ${classes.length + 1}`,
      section: 'A',
      classTeacher: '',
      roomNo: `Room ${100 + classes.length + 1}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass({ ...cls });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editingClass.name.trim()) return;
    onSaveClass(editingClass);
    setIsModalOpen(false);
    setEditingClass(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Class Management</h2>
          <p className="text-xs text-slate-500">
            Manage Class 1 to 8 rosters, sections, class teachers, and print admit cards class-by-class
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const classStudents = students.filter(
            (s) => normalizeClassName(s.className) === normalizeClassName(cls.name)
          );
          const studentCount = classStudents.length;
          const generatedCount = classStudents.filter((s) => s.isGenerated).length;

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {cls.roomNo || 'Room —'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Edit Class"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${cls.name}? Students enrolled will need reassignment.`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    {cls.name.replace(/[^0-9]/g, '') || cls.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{cls.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Section: {cls.section}</p>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-xs space-y-1.5 border border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    Class Teacher: <strong className="text-slate-800">{cls.classTeacher || 'Not Assigned'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 text-slate-600 font-bold">
                      <Users className="w-3 h-3 text-slate-400" /> {studentCount} Students
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {generatedCount}/{studentCount} Generated
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                {onViewClassStudents && (
                  <button
                    onClick={() => onViewClassStudents(cls.name)}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" /> View Students ({studentCount})
                  </button>
                )}

                <button
                  disabled={studentCount === 0}
                  onClick={() => onPrintClass(cls.name)}
                  className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print {cls.name} Admit Cards ({studentCount})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Modal */}
      {isModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingClass.name ? 'Edit Class Details' : 'Add New Class'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 1, Class 2, Class 8"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="A"
                  value={editingClass.section}
                  onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Teacher Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sunita Mishra"
                  value={editingClass.classTeacher || ''}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, classTeacher: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room No.</label>
                <input
                  type="text"
                  placeholder="e.g. Room 101"
                  value={editingClass.roomNo || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, roomNo: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
