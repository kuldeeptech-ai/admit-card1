import React, { useState } from 'react';
import { Examination } from '../types';
import {
  CalendarCheck2,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

interface ExamManagerProps {
  examinations: Examination[];
  activeExamId: string;
  onSetActiveExam: (id: string) => void;
  onSaveExam: (exam: Examination) => void;
  onDeleteExam: (id: string) => void;
  onDuplicateExam: (exam: Examination) => void;
}

export const ExamManager: React.FC<ExamManagerProps> = ({
  examinations,
  activeExamId,
  onSetActiveExam,
  onSaveExam,
  onDeleteExam,
  onDuplicateExam,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Examination | null>(null);

  const handleOpenAdd = () => {
    setEditingExam({
      id: `exam-${Date.now()}`,
      name: 'Annual Examination 2026–27',
      academicSession: '2026–27',
      startDate: '2026-10-12',
      endDate: '2026-10-24',
      reportingTime: '08:30 AM',
      examStartTime: '09:00 AM',
      examEndTime: '12:00 PM',
      examinationCentre: 'H.D. Pandey Public School Campus, Baurbyas',
      instructionsTitle: 'EXAMINATION RULES & REGULATIONS',
      status: 'Upcoming',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Examination) => {
    setEditingExam({ ...exam });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.name.trim()) return;
    onSaveExam(editingExam);
    setIsModalOpen(false);
    setEditingExam(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Examination Sessions & Term Management</h2>
          <p className="text-xs text-slate-500">
            Create and manage Annual, Half-Yearly, Quarterly, or Pre-Board exams and set the active session
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Examination
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examinations.map((exam) => {
          const isActive = exam.id === activeExamId;
          return (
            <div
              key={exam.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE EXAM
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exam.status === 'Completed'
                            ? 'bg-slate-100 text-slate-600'
                            : exam.status === 'Upcoming'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {exam.status}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      Session: {exam.academicSession}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateExam(exam)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Duplicate Examination"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 cursor-pointer"
                      title="Edit Examination"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {examinations.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete exam "${exam.name}"?`)) {
                            onDeleteExam(exam.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="Delete Examination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 mb-1 line-clamp-1">{exam.name}</h3>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {exam.startDate} – {exam.endDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Reporting: <strong className="text-red-600">{exam.reportingTime}</strong> • Exam:{' '}
                      <strong>{exam.examStartTime} – {exam.examEndTime}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{exam.examinationCentre}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                {!isActive ? (
                  <button
                    onClick={() => onSetActiveExam(exam.id)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Set as Active Examination
                  </button>
                ) : (
                  <span className="w-full text-center py-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 rounded-lg">
                    Admit Cards are actively linked to this exam
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Exam Modal */}
      {isModalOpen && editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingExam.name ? 'Edit Examination Details' : 'Create New Examination'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingExam.name}
                  onChange={(e) => setEditingExam({ ...editingExam, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    value={editingExam.academicSession}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, academicSession: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingExam.status}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, status: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingExam.startDate}
                    onChange={(e) => setEditingExam({ ...editingExam, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingExam.endDate}
                    onChange={(e) => setEditingExam({ ...editingExam, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Reporting Time
                  </label>
                  <input
                    type="text"
                    placeholder="08:30 AM"
                    value={editingExam.reportingTime}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, reportingTime: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Exam Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={editingExam.examStartTime}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, examStartTime: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Exam End Time</label>
                  <input
                    type="text"
                    placeholder="12:00 PM"
                    value={editingExam.examEndTime}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, examEndTime: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Centre Location / School Campus
                </label>
                <input
                  type="text"
                  value={editingExam.examinationCentre}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, examinationCentre: e.target.value })
                  }
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
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  Save Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
