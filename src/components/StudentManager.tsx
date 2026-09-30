import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  ClassItem,
  CustomField,
  SchoolSettings,
} from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Trash2,
  Edit,
  Eye,
  CheckSquare,
  Square,
  FileCheck,
  Printer,
  X,
  Upload,
  Sparkles,
  ClipboardPaste,
  Copy,
  Check,
  Layers,
  GraduationCap,
  Download,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';
import { DEFAULT_STUDENT_AVATARS } from '../utils/defaultData';
import { parseExcelPastedText } from '../utils/excelImport';
import { compressImage } from '../utils/imageCompressor';

// Helper to normalize class names (e.g., '1st', 'Class - 1st', 'Nursary', 'LKG', 'UKG' -> standard 'Class 1', 'Nursery', etc.)
export function normalizeClassName(cls?: string): string {
  if (!cls) return '';
  const trimmed = cls.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('nur')) return 'Nursery';
  if (lower.includes('lkg') || lower.includes('l.k.g')) return 'LKG';
  if (lower.includes('ukg') || lower.includes('u.k.g')) return 'UKG';
  const numMatch = trimmed.match(/(\d+)/);
  if (numMatch) return `Class ${numMatch[1]}`;
  return trimmed;
}

// Strips redundant "Class" prefix so "CLASS: Class 1" becomes "CLASS: 1"
export function formatClassNumberOnly(cls?: string): string {
  if (!cls) return '';
  const trimmed = cls.trim();
  const cleaned = trimmed.replace(/^class\s+/i, '');
  return cleaned || trimmed;
}

// Natural Serial Sorter by Roll Number (1, 2, 3, ... 10, 11) grouped by Class and Section
export function sortStudentsByRollNumber(studentsList: Student[]): Student[] {
  return [...studentsList].sort((a, b) => {
    // 1. Group by Class
    const normA = normalizeClassName(a.className);
    const normB = normalizeClassName(b.className);
    const classNumA = parseInt(normA.replace(/[^0-9]/g, '') || '0', 10);
    const classNumB = parseInt(normB.replace(/[^0-9]/g, '') || '0', 10);
    if (classNumA !== classNumB) return classNumA - classNumB;
    if (normA !== normB) return normA.localeCompare(normB);

    // 2. Group by Section ('A', 'B', 'C'...)
    const secA = (a.section || 'A').trim().toUpperCase();
    const secB = (b.section || 'A').trim().toUpperCase();
    if (secA !== secB) return secA.localeCompare(secB);

    // 3. Serial Numeric Order by Roll Number: 1, 2, 3, 4, ... 10, 11
    const rollNumA = parseInt(a.rollNumber.replace(/[^0-9]/g, '') || '0', 10);
    const rollNumB = parseInt(b.rollNumber.replace(/[^0-9]/g, '') || '0', 10);
    if (rollNumA > 0 && rollNumB > 0 && rollNumA !== rollNumB) {
      return rollNumA - rollNumB;
    }

    return (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

// Duplicate detector: checks roll number in same class, admission number, or name + father name in same class
export function findDuplicateStudent(
  student: Partial<Student>,
  existingStudents: Student[],
  excludeId?: string
): Student | undefined {
  const normClass = normalizeClassName(student.className);
  const roll = (student.rollNumber || '').trim().toLowerCase();
  const adm = (student.admissionNumber || '').trim().toLowerCase();
  const name = (student.name || '').trim().toLowerCase();
  const father = (student.fatherName || '').trim().toLowerCase();

  return existingStudents.find((s) => {
    if (excludeId && s.id === excludeId) return false;
    const sNormClass = normalizeClassName(s.className);
    const sRoll = (s.rollNumber || '').trim().toLowerCase();
    const sAdm = (s.admissionNumber || '').trim().toLowerCase();
    const sName = (s.name || '').trim().toLowerCase();
    const sFather = (s.fatherName || '').trim().toLowerCase();

    // Check 1: Same roll number in same class
    if (roll && sRoll && roll === sRoll && normClass === sNormClass) {
      return true;
    }
    // Check 2: Same admission number (if non-empty)
    if (adm && sAdm && adm === sAdm) {
      return true;
    }
    // Check 3: Same student name + father name in same class
    if (name && sName && name === sName && father && sFather && father === sFather && normClass === sNormClass) {
      return true;
    }
    return false;
  });
}

interface StudentManagerProps {
  students: Student[];
  classes: ClassItem[];
  customFields: CustomField[];
  school: SchoolSettings;
  selectedClassFilter?: string;
  onSaveStudent: (student: Student) => void;
  onBulkAddStudents?: (
    students: Student[],
    importMode?: 'update' | 'skip' | 'replace_class',
    targetClassName?: string
  ) => void;
  onResequenceRollNumbers?: (targetClassName: string) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onGenerateAdmitCards: (ids: string[]) => void;
  onPrintSelected: (students: Student[]) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  classes,
  customFields,
  school,
  selectedClassFilter: initialClassFilter,
  onSaveStudent,
  onBulkAddStudents,
  onResequenceRollNumbers,
  onDeleteStudent,
  onDeleteMultiple,
  onGenerateAdmitCards,
  onPrintSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(initialClassFilter || 'all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'pending'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Keep selectedClass synchronized with parent class filter props
  useEffect(() => {
    if (initialClassFilter) {
      setSelectedClass(initialClassFilter);
    }
  }, [initialClassFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [photoCopied, setPhotoCopied] = useState(false);

  // Quick Paste from Excel / Sheets State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedRawText, setPastedRawText] = useState('');
  const [defaultPasteClass, setDefaultPasteClass] = useState('auto');
  const [defaultPasteSection, setDefaultPasteSection] = useState('A');
  const [parsedPasteStudents, setParsedPasteStudents] = useState<Student[]>([]);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Calculate all available unique classes from classes list AND student records (strictly deduplicated by normalized name)
  const allAvailableClasses = useMemo(() => {
    const classMap = new Map<string, string>();
    classes.forEach((c) => {
      if (c.name && c.name.trim()) {
        const norm = normalizeClassName(c.name);
        if (!classMap.has(norm)) {
          classMap.set(norm, norm);
        }
      }
    });
    students.forEach((s) => {
      if (s.className && s.className.trim()) {
        const norm = normalizeClassName(s.className);
        if (!classMap.has(norm)) {
          classMap.set(norm, norm);
        }
      }
    });
    return Array.from(classMap.values()).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '') || '0', 10);
      const numB = parseInt(b.replace(/[^0-9]/g, '') || '0', 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [classes, students]);

  // Filter students based on class, section, search term, and status
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admitCardNumber && s.admitCardNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchClass =
        selectedClass === 'all' ||
        normalizeClassName(s.className) === normalizeClassName(selectedClass);

      const sSec = (s.section || 'A').trim().toUpperCase();
      const matchSection =
        selectedSection === 'all' ||
        sSec === selectedSection.trim().toUpperCase();

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'generated' && s.isGenerated) ||
        (statusFilter === 'pending' && !s.isGenerated);

      return matchSearch && matchClass && matchSection && matchStatus;
    });
  }, [students, searchTerm, selectedClass, selectedSection, statusFilter]);

  // Parse tabular copy-paste data
  const parsePastedData = (
    text: string,
    clsName: string,
    secName: string
  ): Student[] => {
    if (!text.trim()) return [];
    const parsed = parseExcelPastedText(
      text,
      clsName === 'auto' ? 'Class 1' : clsName,
      secName,
      school.admitCardNumberPrefix || 'HDP/2026/'
    );
    if (clsName !== 'auto') {
      return parsed.students.map((s) => ({ ...s, className: clsName }));
    }
    return parsed.students;
  };

  const handlePastedTextChange = (text: string, cls = defaultPasteClass) => {
    setPastedRawText(text);
    const parsed = parsePastedData(text, cls, defaultPasteSection);
    setParsedPasteStudents(parsed);
  };

  const handleExecutePasteImport = () => {
    if (parsedPasteStudents.length === 0) {
      alert('No valid student rows detected to import.');
      return;
    }

    const uniqueToImport: Student[] = [];
    let duplicateCount = 0;

    parsedPasteStudents.forEach((newSt) => {
      const isDup = findDuplicateStudent(newSt, [...students, ...uniqueToImport]);
      if (isDup) {
        duplicateCount++;
      } else {
        uniqueToImport.push(newSt);
      }
    });

    if (uniqueToImport.length === 0) {
      alert(
        `All ${parsedPasteStudents.length} students in this paste are already present in the database (duplicates). No new students were added.`
      );
      return;
    }

    if (onBulkAddStudents) {
      onBulkAddStudents(uniqueToImport);
    } else {
      uniqueToImport.forEach((st) => onSaveStudent(st));
    }

    const notice =
      duplicateCount > 0
        ? `Successfully imported ${uniqueToImport.length} students into their respective classes! (Skipped ${duplicateCount} duplicate entries).`
        : `Successfully imported ${uniqueToImport.length} students into their respective classes!`;

    setPasteNotice(notice);
    setTimeout(() => {
      setPasteNotice(null);
      setIsPasteModalOpen(false);
      setPastedRawText('');
      setParsedPasteStudents([]);
    }, 2000);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAddForClass = (targetClass: string) => {
    const finalClass = targetClass !== 'all' ? targetClass : (classes[0]?.name || 'Class 1');
    const classStudents = students.filter(
      (s) => normalizeClassName(s.className) === normalizeClassName(finalClass)
    );
    const nextRoll = String(classStudents.length + 1).padStart(2, '0');
    const classNum = finalClass.replace(/[^0-9]/g, '') || '1';
    const nextCardNum = `${school.admitCardNumberPrefix || 'HDP/2026/'}${classNum.padStart(2, '0')}${nextRoll}`;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      name: '',
      fatherName: '',
      motherName: '',
      className: finalClass,
      section: selectedSection !== 'all' ? selectedSection : 'A',
      rollNumber: String(classStudents.length + 1),
      admissionNumber: `HDP-${new Date().getFullYear()}-${classNum}${nextRoll}`,
      dob: '2014-01-01',
      gender: 'Male',
      studentMobile: school.mobile,
      parentMobile: school.mobile,
      address: 'Baurbyas, Mehdawal, SKN',
      photoUrl: DEFAULT_STUDENT_AVATARS[students.length % DEFAULT_STUDENT_AVATARS.length],
      studentId: `STD-${Date.now().toString().slice(-4)}`,
      admitCardNumber: nextCardNum,
      customFieldValues: {},
      isGenerated: false,
    };
    setEditingStudent(newStudent);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent({ ...student });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.name.trim()) {
      setModalError('Please enter student name.');
      return;
    }

    // DUPLICATE STUDENT VERIFICATION
    const duplicate = findDuplicateStudent(editingStudent, students, editingStudent.id);
    if (duplicate) {
      setModalError(
        `Duplicate Student Error: A student named "${duplicate.name}" with Roll No "${duplicate.rollNumber}" already exists in ${duplicate.className}. Duplicate entries are not allowed.`
      );
      return;
    }

    onSaveStudent(editingStudent);
    setIsModalOpen(false);
    setEditingStudent(null);
    setModalError(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingStudent) {
      try {
        const compressed = await compressImage(file, 200, 260, 0.82);
        setEditingStudent({
          ...editingStudent,
          photoUrl: compressed,
        });
      } catch (err) {
        console.error('Photo compression error:', err);
      }
    }
  };

  // Class-wise Admit card generation for current filtered class
  const handleGenerateClassAdmitCards = () => {
    const classStudentIds = filteredStudents.map((s) => s.id);
    if (classStudentIds.length === 0) return;
    onGenerateAdmitCards(classStudentIds);
  };

  // Class-wise Print for current filtered class
  const handlePrintCurrentClass = () => {
    if (filteredStudents.length === 0) {
      alert('No students to print in this view.');
      return;
    }
    onPrintSelected(filteredStudents);
  };

  return (
    <div className="space-y-4">
      {/* CLASS & SECTION FILTER TABS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Class-Wise Student Management</span>
                {selectedClass !== 'all' ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800">
                    Active Class: {selectedClass} {selectedSection !== 'all' ? `(Sec ${selectedSection})` : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700">
                    All Classes ({students.length})
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500">
                View students class-by-class and section-by-section. Add students, generate cards, or print A4 sheets.
              </p>
            </div>
          </div>

          {/* Quick Buttons for currently selected Class */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Add Student in this class */}
            <button
              onClick={() => handleOpenAddForClass(selectedClass !== 'all' ? selectedClass : 'Class 1')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {selectedClass !== 'all' ? `+ Add Student (${selectedClass})` : '+ Add Student'}
              </span>
            </button>

            {/* Quick Paste from Excel for this class */}
            <button
              onClick={() => {
                setDefaultPasteClass('auto');
                setIsPasteModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>📋 Paste from Excel</span>
            </button>

            {/* Print Current Class */}
            {filteredStudents.length > 0 && (
              <button
                onClick={handlePrintCurrentClass}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  Print {selectedClass !== 'all' ? selectedClass : 'All'} ({filteredStudents.length})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 1. Class Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedClass('all');
              setSelectedSection('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedClass === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Classes ({students.length})
          </button>

          {allAvailableClasses.map((clsName) => {
            const count = students.filter(
              (s) => normalizeClassName(s.className) === normalizeClassName(clsName)
            ).length;
            const isCurrent = normalizeClassName(selectedClass) === normalizeClassName(clsName);
            return (
              <button
                key={clsName}
                onClick={() => {
                  setSelectedClass(clsName);
                  setSelectedSection('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200'
                }`}
              >
                <span>{clsName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Section Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
            Section:
          </span>
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSection === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sections
          </button>
          {['A', 'B', 'C', 'D'].map((sec) => {
            const secCount = students.filter((s) => {
              const matchCls =
                selectedClass === 'all' ||
                normalizeClassName(s.className) === normalizeClassName(selectedClass);
              const matchSec = (s.section || 'A').trim().toUpperCase() === sec;
              return matchCls && matchSec;
            }).length;

            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSection === sec
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                <span>Section {sec}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedSection === sec ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {secCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Action Bar: Generate / Print / Batch Operations */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Admit Cards for this class */}
          <button
            onClick={handleGenerateClassAdmitCards}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {selectedClass !== 'all' ? `Generate ${selectedClass} Cards` : 'Generate All Admit Cards'}
            </span>
          </button>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => onGenerateAdmitCards(selectedIds)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Generate ({selectedIds.length})
              </button>
              <button
                onClick={() => {
                  const selected = students.filter((s) => selectedIds.includes(s.id));
                  onPrintSelected(selected);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedIds.length} selected students?`)) {
                    onDeleteMultiple(selectedIds);
                    setSelectedIds([]);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.length})
              </button>
            </>
          )}
        </div>

        {/* Search Input & Status Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="p-1 hover:text-slate-900 cursor-pointer">
                    {selectedIds.length > 0 && selectedIds.length === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Roll No</th>
                <th className="py-2.5 px-3">Class & Sec</th>
                <th className="py-2.5 px-3">Father's Name</th>
                <th className="py-2.5 px-3">Admission No</th>
                <th className="py-2.5 px-3">Admit Card No</th>
                <th className="py-2.5 px-3 text-center">Card Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">
                      {selectedClass !== 'all'
                        ? `No students found in ${selectedClass}${selectedSection !== 'all' ? ` (Section ${selectedSection})` : ''}`
                        : 'No students found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Add Student" or "📋 Paste from Excel" to add students to this class.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(s.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={s.photoUrl || DEFAULT_STUDENT_AVATARS[0]}
                            alt={s.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="block font-bold">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {s.gender} • जन्म: {s.dob || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3 font-mono font-black text-red-600">
                        {s.rollNumber}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {s.className} - {s.section}
                      </td>

                      <td className="py-2 px-3">{s.fatherName}</td>

                      <td className="py-2 px-3 font-mono text-slate-600">{s.admissionNumber}</td>

                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {s.admitCardNumber || 'Pending'}
                      </td>

                      <td className="py-2 px-3 text-center">
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

                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPrintSelected([s])}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Print Admit Card for this student"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                            title="View Student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete student "${s.name}"?`)) {
                                onDeleteStudent(s.id);
                              }
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingStudent.name ? `Edit Student: ${editingStudent.name}` : `Add New Student (${editingStudent.className})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="p-5 overflow-y-auto space-y-4">
              {/* Photo & Basic Details */}
              <div className="flex flex-col sm:flex-row gap-4 items-start pb-3 border-b border-slate-100">
                <div className="flex flex-col items-center gap-1.5 w-full sm:w-36 flex-shrink-0">
                  <div className="w-20 h-24 rounded-lg border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center relative group shadow-2xs">
                    {editingStudent.photoUrl ? (
                      <img
                        src={editingStudent.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-bold">No Photo</span>
                    )}
                    {editingStudent.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingStudent({ ...editingStudent, photoUrl: '' })}
                        className="absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove Photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md flex items-center gap-1 shadow-2xs transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {editingStudent.photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingStudent.photoUrl);
                          setPhotoCopied(true);
                          setTimeout(() => setPhotoCopied(false), 2000);
                        }}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                        title="Copy Base64 URL"
                      >
                        {photoCopied ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="w-full mt-1">
                    <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                      <LinkIcon className="w-2.5 h-2.5" /> Photo URL / Base64:
                    </label>
                    <input
                      type="text"
                      value={editingStudent.photoUrl}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, photoUrl: e.target.value })
                      }
                      placeholder="Paste Image URL..."
                      className="w-full px-2 py-1 text-[9px] font-mono rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingStudent.fatherName}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, fatherName: e.target.value })
                      }
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mother's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingStudent.motherName}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, motherName: e.target.value })
                      }
                      placeholder="e.g. Sunita Sharma"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={editingStudent.gender}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, gender: e.target.value as any })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Academic Enrollment Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class *</label>
                  <select
                    value={editingStudent.className}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, className: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={editingStudent.section}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, section: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Roll No *</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.rollNumber}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, rollNumber: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admission No</label>
                  <input
                    type="text"
                    value={editingStudent.admissionNumber}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, admissionNumber: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Identifiers & Admit Card No. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={editingStudent.dob}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admit Card Roll / Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.admitCardNumber}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, admitCardNumber: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parent Mobile</label>
                  <input
                    type="text"
                    value={editingStudent.parentMobile}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, parentMobile: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, address: e.target.value })
                  }
                  placeholder="Village, Post, Tehsil, District..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Quick Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Student Profile</h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={viewingStudent.photoUrl || DEFAULT_STUDENT_AVATARS[0]}
                alt={viewingStudent.name}
                className="w-16 h-20 rounded object-cover border border-slate-300"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-extrabold text-base text-slate-900">{viewingStudent.name}</h4>
                <p className="text-xs font-bold text-blue-700">
                  {viewingStudent.className} - Section {viewingStudent.section} (Roll: {viewingStudent.rollNumber})
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Admit Card No: {viewingStudent.admitCardNumber || 'Pending'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-200">
              <div>
                <span className="text-slate-500">Father's Name: </span>
                <strong className="text-slate-800">{viewingStudent.fatherName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Mother's Name: </span>
                <strong className="text-slate-800">{viewingStudent.motherName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Admission No: </span>
                <strong className="text-slate-800">{viewingStudent.admissionNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Date of Birth: </span>
                <strong className="text-slate-800">{viewingStudent.dob}</strong>
              </div>
              <div>
                <span className="text-slate-500">Mobile: </span>
                <strong className="text-slate-800">{viewingStudent.parentMobile}</strong>
              </div>
              <div>
                <span className="text-slate-500">Address: </span>
                <strong className="text-slate-800">{viewingStudent.address}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const toPrint = [viewingStudent];
                  setViewingStudent(null);
                  onPrintSelected(toPrint);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Admit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Paste from Excel / Google Sheets Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Quick Copy-Paste from Excel or Google Sheets
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select rows in Excel, press Ctrl+C, and paste below. The system automatically detects classes per row and routes each student!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {pasteNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{pasteNotice}</span>
                </div>
              )}

              {/* Target Class selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Class Routing Mode / Fallback Class:
                  </label>
                  <select
                    value={defaultPasteClass}
                    onChange={(e) => {
                      setDefaultPasteClass(e.target.value);
                      setParsedPasteStudents(parsePastedData(pastedRawText, e.target.value, defaultPasteSection));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="auto">Auto-detect from pasted row (Separate classes automatically)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        Force into: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Default Section:
                  </label>
                  <input
                    type="text"
                    value={defaultPasteSection}
                    onChange={(e) => {
                      setDefaultPasteSection(e.target.value);
                      setParsedPasteStudents(parsePastedData(pastedRawText, defaultPasteClass, e.target.value));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Paste Textarea */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Paste Data Here (Ctrl+V):</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Format: Roll No | Name | Father's Name | Mother's Name | Class | Section | Mobile
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={pastedRawText}
                  onChange={(e) => handlePastedTextChange(e.target.value)}
                  placeholder={`Roll No\tName\tFather's Name\tMother's Name\tClass\tSection\tAdmission No\tMobile\n1\tAarav Pandey\tRajesh Pandey\tSunita Pandey\tClass 8\tA\tHDP-2026-001\t9838112233\n2\tPriya Sharma\tManoj Sharma\tRekha Sharma\tClass 9\tA\tHDP-2026-002\t9838223344`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* Live Parsed Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Detected Students Preview
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {parsedPasteStudents.length} Students parsed
                    </span>
                  </div>
                  {pastedRawText && (
                    <button
                      type="button"
                      onClick={() => handlePastedTextChange('')}
                      className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {parsedPasteStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Roll</th>
                          <th className="py-2 px-3">Student Name</th>
                          <th className="py-2 px-3">Father's Name</th>
                          <th className="py-2 px-3">Assigned Class</th>
                          <th className="py-2 px-3">Admission No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedPasteStudents.map((st, idx) => (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-red-700">
                              {st.rollNumber}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">
                              {st.name}
                            </td>
                            <td className="py-1.5 px-3 text-slate-700">
                              {st.fatherName}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-blue-700">
                              {st.className} - {st.section}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-[10px] text-slate-600">
                              {st.admissionNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
                    Paste your Excel / Sheets data above to see the student list and detected classes preview.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={parsedPasteStudents.length === 0}
                onClick={handleExecutePasteImport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <ClipboardPaste className="w-4 h-4" />
                Import All {parsedPasteStudents.length} Students into Respective Classes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
