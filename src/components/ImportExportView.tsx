import React, { useState } from 'react';
import { Student, SchoolSettings, Examination, ClassItem } from '../types';
import {
  exportStudentsToCSV,
  importStudentsFromCSV,
  downloadCSV,
  generateSampleCSV,
} from '../utils/csv';
import {
  parseExcelPastedText,
  generateSampleExcelText,
} from '../utils/excelImport';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ClipboardPaste,
  Copy,
  Check,
  GraduationCap,
  Layers,
  Sparkles,
} from 'lucide-react';
import { findDuplicateStudent } from './StudentManager';

interface ImportExportViewProps {
  students: Student[];
  classes: ClassItem[];
  school: SchoolSettings;
  examinations: Examination[];
  onImportStudents: (newStudents: Student[]) => void;
  onExportFullBackup: () => void;
  onImportFullBackup: (jsonString: string) => void;
  onResetToDefaults: () => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  students,
  classes,
  school,
  examinations,
  onImportStudents,
  onExportFullBackup,
  onImportFullBackup,
  onResetToDefaults,
}) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const [stagedStudents, setStagedStudents] = useState<Student[] | null>(null);

  // Excel Copy-Paste State
  const [importMode, setImportMode] = useState<'excel' | 'csv'>('excel');
  const [excelText, setExcelText] = useState<string>('');
  const [targetClass, setTargetClass] = useState<string>('auto');
  const [parsedExcelStudents, setParsedExcelStudents] = useState<Student[]>([]);
  const [excelHeadersFound, setExcelHeadersFound] = useState<string[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelStrategy, setExcelStrategy] = useState<'append' | 'replace'>('append');
  const [sampleCopied, setSampleCopied] = useState<boolean>(false);

  const handleExcelTextChange = (text: string, cls = targetClass) => {
    setExcelText(text);
    if (!text.trim()) {
      setParsedExcelStudents([]);
      setExcelHeadersFound([]);
      setExcelErrors([]);
      return;
    }
    const fallbackCls = cls !== 'auto' ? cls : 'Class 1';
    const result = parseExcelPastedText(text, fallbackCls, 'A', school.admitCardNumberPrefix || 'HDP/2026/');
    // If target class is specifically chosen (not auto), override class for all parsed students
    if (cls !== 'auto') {
      result.students = result.students.map((s) => ({ ...s, className: cls }));
    }
    setParsedExcelStudents(result.students);
    setExcelHeadersFound(result.headersFound);
    setExcelErrors(result.errors);
  };

  const handleCopyExcelSample = () => {
    const sample = generateSampleExcelText();
    navigator.clipboard.writeText(sample).then(() => {
      setSampleCopied(true);
      setTimeout(() => setSampleCopied(false), 3000);
    });
  };

  const handleConfirmExcelImport = () => {
    if (parsedExcelStudents.length === 0) return;
    if (excelStrategy === 'replace') {
      if (
        students.length > 0 &&
        !confirm(`Are you sure you want to replace all ${students.length} existing students with these ${parsedExcelStudents.length} new students?`)
      ) {
        return;
      }
      onImportStudents(parsedExcelStudents);
      setImportStatus(`Successfully replaced and loaded ${parsedExcelStudents.length} students!`);
    } else {
      const uniqueStudents: Student[] = [];
      let dupCount = 0;
      parsedExcelStudents.forEach((ns) => {
        if (!findDuplicateStudent(ns, [...students, ...uniqueStudents])) {
          uniqueStudents.push(ns);
        } else {
          dupCount++;
        }
      });

      if (uniqueStudents.length === 0) {
        alert('All rows in this paste already exist in the database (duplicates). No new students were added.');
        return;
      }

      onImportStudents([...students, ...uniqueStudents]);
      setImportStatus(
        dupCount > 0
          ? `Successfully added ${uniqueStudents.length} students across classes (Skipped ${dupCount} duplicate entries)!`
          : `Successfully added ${uniqueStudents.length} students across classes (Total: ${students.length + uniqueStudents.length})!`
      );
    }
    setExcelText('');
    setParsedExcelStudents([]);
    setTimeout(() => setImportStatus(''), 5000);
  };

  const handleDownloadSample = () => {
    const sample = generateSampleCSV();
    downloadCSV(sample, 'School_Student_Import_Template.csv');
  };

  const handleExportStudents = () => {
    const csv = exportStudentsToCSV(students);
    downloadCSV(csv, `School_Students_Roster_${Date.now()}.csv`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = importStudentsFromCSV(text, targetClass !== 'auto' ? targetClass : undefined);
        if (parsed.length === 0) {
          alert('No valid student rows found in the CSV file.');
          return;
        }
        setStagedStudents(parsed);
      } catch (err: any) {
        alert(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!stagedStudents) return;
    const uniqueStudents: Student[] = [];
    let dupCount = 0;
    stagedStudents.forEach((ns) => {
      if (!findDuplicateStudent(ns, [...students, ...uniqueStudents])) {
        uniqueStudents.push(ns);
      } else {
        dupCount++;
      }
    });

    if (uniqueStudents.length === 0) {
      alert('All students in this CSV already exist in the database (duplicates). No new students were added.');
      setStagedStudents(null);
      return;
    }

    onImportStudents([...students, ...uniqueStudents]);
    setImportStatus(
      dupCount > 0
        ? `Successfully imported ${uniqueStudents.length} students from CSV (Skipped ${dupCount} duplicates)!`
        : `Successfully imported ${uniqueStudents.length} students from CSV!`
    );
    setStagedStudents(null);
    setTimeout(() => setImportStatus(''), 4000);
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const json = evt.target?.result as string;
      try {
        onImportFullBackup(json);
        alert('System data and settings successfully restored!');
      } catch (err: any) {
        alert(`Error restoring backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Bulk Student Import & Data Backup
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Copy-paste directly from Excel / Google Sheets, upload CSV files, or safely backup and restore all school records
        </p>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Main Import Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Excel / CSV Import */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Bulk Student Import</h3>
              <p className="text-[11px] text-slate-500">
                Import students class-by-class or import multiple classes in one go
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setImportMode('excel')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  importMode === 'excel'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Copy-Paste from Excel
              </button>
              <button
                type="button"
                onClick={() => setImportMode('csv')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  importMode === 'csv'
                    ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📁 CSV File Upload
              </button>
            </div>
          </div>

          {/* Target Class Assignment Selector */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-700">Class Routing Mode:</span>
            </div>
            <select
              value={targetClass}
              onChange={(e) => {
                setTargetClass(e.target.value);
                if (excelText) handleExcelTextChange(excelText, e.target.value);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value="auto">Auto-detect Class per student row (Keep separate classes)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  Force all students into: {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* TAB 1: EXCEL DIRECT COPY-PASTE */}
          {importMode === 'excel' ? (
            <div className="space-y-3">
              {/* Instructions and Sample Helper */}
              <div className="flex items-center justify-between gap-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                <div className="leading-tight">
                  <span className="font-bold block">Copy directly from Excel or Google Sheets:</span>
                  <span className="text-[11px] text-emerald-800">
                    Select rows in Excel (Roll No, Name, Father Name, Mother Name, Class, Adm No, Mobile) and paste below.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyExcelSample}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  {sampleCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copy Sample Format</span>
                    </>
                  )}
                </button>
              </div>

              {/* Large Paste Textarea */}
              <div className="relative">
                <textarea
                  rows={6}
                  value={excelText}
                  onChange={(e) => handleExcelTextChange(e.target.value)}
                  placeholder={`Paste copied Excel data here (Ctrl+V)...\nExample:\nRoll No\tName\tFather Name\tMother Name\tClass\tSection\tAdmission No\tMobile\n01\tAarav Pandey\tRajesh Pandey\tSunita Pandey\tClass 8\tA\tHDP-2026-081\t9838767297\n02\tPriya Sharma\tDinesh Sharma\tMeena Sharma\tClass 9\tA\tHDP-2026-082\t9838767298`}
                  className="w-full p-3 font-mono text-[11px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed bg-slate-50/50"
                />
                {excelText && (
                  <button
                    onClick={() => handleExcelTextChange('')}
                    className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-white/80 rounded border border-slate-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Live Parsed Preview & Import Options */}
              {parsedExcelStudents.length > 0 ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-xs text-emerald-950">
                        {parsedExcelStudents.length} Students Detected!
                      </span>
                    </div>

                    {/* Append or Replace strategy */}
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="excelStrategy"
                          checked={excelStrategy === 'append'}
                          onChange={() => setExcelStrategy('append')}
                          className="accent-emerald-600"
                        />
                        <span>Append to existing (+{parsedExcelStudents.length})</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="excelStrategy"
                          checked={excelStrategy === 'replace'}
                          onChange={() => setExcelStrategy('replace')}
                          className="accent-emerald-600"
                        />
                        <span>Replace existing ({students.length} students)</span>
                      </label>
                    </div>
                  </div>

                  {/* Scrollable Preview Table */}
                  <div className="max-h-40 overflow-y-auto border border-emerald-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-emerald-100/60 font-bold text-emerald-900 border-b border-emerald-200 sticky top-0">
                          <th className="py-1 px-2">Roll</th>
                          <th className="py-1 px-2">Student Name</th>
                          <th className="py-1 px-2">Father's Name</th>
                          <th className="py-1 px-2">Class</th>
                          <th className="py-1 px-2">Admission No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedExcelStudents.slice(0, 6).map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-2 font-mono font-bold text-blue-900">{s.rollNumber}</td>
                            <td className="py-1 px-2 font-bold uppercase">{s.name}</td>
                            <td className="py-1 px-2 text-slate-600">{s.fatherName || '—'}</td>
                            <td className="py-1 px-2 font-bold text-blue-700">{s.className}-{s.section}</td>
                            <td className="py-1 px-2 font-mono text-[10px] text-slate-500">{s.admissionNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedExcelStudents.length > 6 && (
                    <div className="text-[10.5px] font-semibold text-emerald-800 text-center">
                      ...and {parsedExcelStudents.length - 6} more students ready to import into their respective classes.
                    </div>
                  )}

                  {/* Confirm Import Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleExcelTextChange('')}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExcelImport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Add {parsedExcelStudents.length} Students</span>
                    </button>
                  </div>
                </div>
              ) : excelText.trim() ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    No valid students detected. Please ensure your pasted data has at least Student Name.
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            /* TAB 2: CSV FILE UPLOAD */
            <div className="space-y-3">
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg transition-colors w-full justify-center cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Sample CSV Template
              </button>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Select Student CSV File or Drag Here
                </p>
                <p className="text-[10px] text-slate-400 mb-3">
                  Columns: Name, Father Name, Mother Name, Class, Section, Roll No, Adm No...
                </p>
                <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg inline-block">
                  Choose CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {stagedStudents && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Ready to Add: {stagedStudents.length} Students
                    </span>
                    <button
                      onClick={handleConfirmImport}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs cursor-pointer"
                    >
                      Save Import
                    </button>
                  </div>
                  <div className="text-[11px] text-blue-800 max-h-24 overflow-y-auto">
                    {stagedStudents.slice(0, 3).map((s, idx) => (
                      <div key={idx}>
                        • {s.name} ({s.className} - {s.section}, Roll: {s.rollNumber})
                      </div>
                    ))}
                    {stagedStudents.length > 3 && (
                      <div>...and {stagedStudents.length - 3} more students</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Export CSV & System Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Data Backup & Safety</h3>
              <p className="text-[11px] text-slate-500">Backup & Restore School Records</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Download All Students CSV</span>
                <span className="text-[10px] text-slate-500">
                  Total {students.length} enrolled students
                </span>
              </div>
              <button
                onClick={handleExportStudents}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" /> Export CSV
              </button>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Full System Backup (JSON)</span>
                <span className="text-[10px] text-slate-500">
                  Students, Examinations, Timetable & Design
                </span>
              </div>
              <button
                onClick={onExportFullBackup}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Backup
              </button>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Restore Backup File</span>
                <span className="text-[10px] text-slate-500">Restore from JSON file</span>
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" /> Select File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-700 block">Reset to Official Defaults</span>
                <span className="text-[10px] text-slate-500">Reload official school template data</span>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to reset all data and settings back to the default state?'
                    )
                  ) {
                    onResetToDefaults();
                  }
                }}
                className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
