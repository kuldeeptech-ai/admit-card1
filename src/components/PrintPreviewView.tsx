import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolSettings,
  Examination,
  DateSheetItem,
  InstructionItem,
  CustomField,
  FieldVisibility,
  SectionConfig,
  DesignSettings,
  PrintSettings,
  ClassItem,
} from '../types';
import { INITIAL_DATE_SHEET } from '../utils/defaultData';
import { A4PrintSheet } from './A4PrintSheet';
import { downloadAdmitCardsPdf, triggerPrintSheet } from '../utils/pdfExport';
import { normalizeClassName, sortStudentsByRollNumber } from './StudentManager';
import {
  Printer,
  Download,
  CheckCircle2,
  Filter,
  Scissors,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  UserCheck,
  Info,
  Loader2,
  ExternalLink,
  AlertCircle,
  Type,
  GraduationCap,
} from 'lucide-react';

interface PrintPreviewViewProps {
  students: Student[];
  classes: ClassItem[];
  school: SchoolSettings;
  exam: Examination;
  dateSheet: DateSheetItem[];
  instructions: InstructionItem[];
  customFields: CustomField[];
  visibility: FieldVisibility;
  sections: SectionConfig[];
  design: DesignSettings;
  printSettings: PrintSettings;
  onUpdatePrintSettings: (ps: PrintSettings) => void;
  onUpdateDesign?: (design: DesignSettings) => void;
  onUpdateDateSheet?: (items: DateSheetItem[]) => void;
  initialSelectedStudentIds?: string[] | null;
  initialClassFilter?: string;
  onClearSelectedIds?: () => void;
}

export const PrintPreviewView: React.FC<PrintPreviewViewProps> = ({
  students,
  classes,
  school,
  exam,
  dateSheet,
  instructions,
  customFields,
  visibility,
  sections,
  design,
  printSettings,
  onUpdatePrintSettings,
  onUpdateDesign,
  onUpdateDateSheet,
  initialSelectedStudentIds,
  initialClassFilter,
  onClearSelectedIds,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassFilter || 'all');
  const [filterMode, setFilterMode] = useState<'all' | 'class' | 'selected'>(
    initialSelectedStudentIds && initialSelectedStudentIds.length > 0
      ? 'selected'
      : initialClassFilter && initialClassFilter !== 'all'
      ? 'class'
      : 'all'
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initialSelectedStudentIds || []
  );
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  // Direct PDF Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, status: '' });
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Sync if initialSelectedStudentIds changes
  useEffect(() => {
    if (initialSelectedStudentIds && initialSelectedStudentIds.length > 0) {
      setSelectedStudentIds(initialSelectedStudentIds);
      setFilterMode('selected');
    }
  }, [initialSelectedStudentIds]);

  // Sync if initialClassFilter changes
  useEffect(() => {
    if (initialClassFilter) {
      setSelectedClassFilter(initialClassFilter);
      if (initialClassFilter !== 'all') {
        setFilterMode('class');
      }
    }
  }, [initialClassFilter]);

  // Compute active students to print
  let activeStudents: Student[] = [];
  if (filterMode === 'selected') {
    activeStudents = students.filter((s) => selectedStudentIds.includes(s.id));
  } else if (filterMode === 'class' && selectedClassFilter !== 'all') {
    activeStudents = students.filter(
      (s) => normalizeClassName(s.className) === normalizeClassName(selectedClassFilter)
    );
  } else {
    activeStudents = students;
  }
  // Strictly sort candidates serially by Roll Number (1, 2, 3...)
  activeStudents = sortStudentsByRollNumber(activeStudents);

  // Pre-print audit stats
  const isLandscape = printSettings.layout === 'landscape_2' || printSettings.orientation === 'landscape';
  const cardsPerPage = isLandscape ? 2 : 4;
  const missingRoll = activeStudents.filter((s) => !s.rollNumber.trim());
  const missingPhoto = activeStudents.filter((s) => !s.photoUrl);
  const totalPages = Math.ceil(activeStudents.length / cardsPerPage);

  // Direct PDF Download Execution
  const handleDirectDownloadPdf = async () => {
    if (activeStudents.length === 0) {
      alert('No students available to generate PDF.');
      return;
    }

    setIsExportingPdf(true);
    setExportErrorMessage(null);
    setExportSuccessMessage(null);
    setExportProgress({ current: 1, total: Math.max(1, totalPages), status: 'Initializing PDF Engine...' });

    try {
      const sanitizedExamName = (exam.name || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
      const classTag = filterMode === 'class' && selectedClassFilter !== 'all' ? `_${selectedClassFilter.replace(/\s+/g, '_')}` : '';
      const fileName = `Admit_Cards_${sanitizedExamName}${classTag}_A4.pdf`;

      await downloadAdmitCardsPdf('.a4-sheets-wrapper', {
        fileName,
        orientation: 'portrait',
        onProgress: (current, total, status) => {
          setExportProgress({ current, total, status });
        },
      });

      setExportSuccessMessage(`PDF file downloaded successfully! (${fileName})`);
      setTimeout(() => setExportSuccessMessage(null), 7000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setExportErrorMessage(
        'Direct PDF download encountered an issue. You can click "Print" and select "Save as PDF".'
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Cross-Browser Print Execution
  const handleTriggerPrint = () => {
    if (activeStudents.length === 0) {
      alert('No students selected to print.');
      return;
    }
    setIsPrinting(true);
    const originalTitle = document.title;
    const sanitizedExamName = (exam.name || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
    const classTag = filterMode === 'class' && selectedClassFilter !== 'all' ? `_${selectedClassFilter}` : '';
    document.title = `Admit_Cards_${sanitizedExamName}${classTag}`;

    try {
      triggerPrintSheet('.a4-sheets-wrapper', 'portrait');
    } catch (err) {
      window.print();
    }

    setTimeout(() => {
      document.title = originalTitle;
      setIsPrinting(false);
    }, 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Bar (hidden during browser print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs no-print space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Printer className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  A4 Admit Card Print & PDF Engine
                </h2>
                <p className="text-xs text-slate-500">
                  {isLandscape
                    ? `A4 Sheet (210mm × 297mm) • 2 Cards Per Page (198mm × 138mm) • Total ${activeStudents.length} Students = ${totalPages} A4 Pages`
                    : `A4 Sheet (210mm × 297mm) • 4 Cards Per Page (90mm × 140mm) • Total ${activeStudents.length} Students = ${totalPages} A4 Pages`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Direct Download PDF & Print Admit Cards */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Validation Audit */}
            <button
              onClick={() => setShowValidationModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
              title="Audit missing roll numbers and photos"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Audit Check
              {missingPhoto.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>

            {/* DIRECT DOWNLOAD PDF BUTTON */}
            <button
              onClick={handleDirectDownloadPdf}
              disabled={isExportingPdf || activeStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Directly download high-resolution A4 PDF file"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating PDF ({exportProgress.current}/{exportProgress.total})...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download PDF ({activeStudents.length} Students)</span>
                </>
              )}
            </button>

            {/* PRINT ADMIT CARDS BUTTON */}
            <button
              onClick={handleTriggerPrint}
              disabled={isPrinting || activeStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              title="Print directly to printer or save as PDF"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Print Dialog...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>
                    Print Cards ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {exportSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}

        {/* Error Toast */}
        {exportErrorMessage && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{exportErrorMessage}</span>
          </div>
        )}

        {/* Filter & Layout Switcher Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Mode Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setFilterMode('all');
                  setSelectedClassFilter('all');
                  if (onClearSelectedIds) onClearSelectedIds();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Classes ({students.length})
              </button>

              <button
                onClick={() => {
                  setFilterMode('class');
                  if (selectedClassFilter === 'all' && classes.length > 0) {
                    setSelectedClassFilter(classes[0].name);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  filterMode === 'class'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Class-Wise Print</span>
              </button>

              {selectedStudentIds.length > 0 && (
                <button
                  onClick={() => setFilterMode('selected')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === 'selected'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Selected ({selectedStudentIds.length})
                </button>
              )}
            </div>

            {/* Class Dropdown (if By Class selected) */}
            {filterMode === 'class' && (
              <div className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 p-1 rounded-xl">
                <span className="font-extrabold text-blue-900 pl-1.5">Select Class:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg text-xs font-bold py-1 px-2.5 text-blue-900 cursor-pointer"
                >
                  <option value="all">All Classes ({students.length})</option>
                  {classes.map((c) => {
                    const cnt = students.filter((s) => s.className === c.name).length;
                    return (
                      <option key={c.id} value={c.name}>
                        {c.name} ({cnt} students)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* A4 Paper Layout Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() =>
                  onUpdatePrintSettings({
                    ...printSettings,
                    layout: 'landscape_2',
                    orientation: 'landscape',
                    cardsPerPage: 2,
                    cardWidthMm: 198,
                    cardHeightMm: 138,
                  })
                }
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLandscape
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📄 Horizontal (2 Cards / Page)</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">198×138mm</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdatePrintSettings({
                    ...printSettings,
                    layout: 'portrait_4',
                    orientation: 'portrait',
                    cardsPerPage: 4,
                    cardWidthMm: 90,
                    cardHeightMm: 140,
                  })
                }
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isLandscape
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📑 Vertical (4 Cards / Page)</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">210×297mm</span>
              </button>
            </div>

            {/* Cutting Lines Toggle */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printSettings.showCuttingLine}
                  onChange={(e) =>
                    onUpdatePrintSettings({
                      ...printSettings,
                      showCuttingLine: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                Cutting Guide Lines
              </label>
            </div>
          </div>

          {/* Zoom Controls for On-screen Inspection */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Zoom:</span>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-slate-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(0.85)}
                className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-white cursor-pointer ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Notification Banner */}
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs text-blue-950 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Print Tips:</strong> In your browser print settings, choose <strong>Paper: A4</strong>, <strong>Margins: None / Minimum</strong>, and ensure <strong>Background Graphics is checked ON</strong> for perfect crisp borders and colors.
            </span>
          </div>
          <span className="font-extrabold text-blue-700">
            Selected: {activeStudents.length} Students ({totalPages} A4 Pages)
          </span>
        </div>
      </div>

      {/* PDF Generation Progress Modal */}
      {isExportingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Generating High-Resolution A4 PDF</h3>
              <p className="text-xs text-slate-500 mt-1">{exportProgress.status}</p>
            </div>
            {exportProgress.total > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              Please wait while all student cards, QR codes, and exam tables are compiled into PDF...
            </p>
          </div>
        </div>
      )}

      {/* Validation Audit Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Pre-Print Audit Check</h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Exam:</span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {exam.name}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Class Selection:</span>
                <span className="text-slate-900 font-bold">
                  {filterMode === 'class' && selectedClassFilter !== 'all' ? selectedClassFilter : 'All Classes'} ({activeStudents.length} students)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Missing Roll Numbers:</span>
                {missingRoll.length === 0 ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> None (0)
                  </span>
                ) : (
                  <span className="text-red-600 font-extrabold">{missingRoll.length} students</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Missing Photos:</span>
                {missingPhoto.length === 0 ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> All photos present
                  </span>
                ) : (
                  <span className="text-amber-600 font-extrabold">
                    {missingPhoto.length} students (Photo placeholder provided)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowValidationModal(false);
                  handleTriggerPrint();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Sheet Print Sheets Container */}
      <div className="flex flex-col items-center py-6 bg-slate-200/70 rounded-2xl p-3 sm:p-6 overflow-x-auto print:p-0 print:m-0 print:bg-transparent">
        {activeStudents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-slate-400 max-w-md shadow-xs">
            No students found for this selection.
          </div>
        ) : (
          <A4PrintSheet
            students={activeStudents}
            school={school}
            exam={exam}
            dateSheet={dateSheet}
            instructions={instructions}
            customFields={customFields}
            visibility={visibility}
            sections={sections}
            design={design}
            printSettings={printSettings}
            previewScale={zoomLevel}
            isPrintMode={false}
          />
        )}
      </div>
    </div>
  );
};
