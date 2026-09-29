import React, { useState } from 'react';
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
} from '../types';
import { AdmitCard } from './AdmitCard';
import { A4PrintSheet } from './A4PrintSheet';
import { DESIGN_PRESETS } from '../utils/defaultData';
import {
  Palette,
  Sliders,
  Eye,
  Type,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Sparkles,
} from 'lucide-react';

interface DesignerProps {
  students: Student[];
  school: SchoolSettings;
  exam: Examination;
  dateSheet: DateSheetItem[];
  instructions: InstructionItem[];
  customFields: CustomField[];
  visibility: FieldVisibility;
  onUpdateVisibility: (vis: FieldVisibility) => void;
  sections: SectionConfig[];
  onUpdateSections: (secs: SectionConfig[]) => void;
  design: DesignSettings;
  onUpdateDesign: (design: DesignSettings) => void;
  savedTemplates: DesignSettings[];
  onSaveTemplate: (design: DesignSettings, isNew?: boolean) => void;
  onResetDesign: () => void;
  printSettings: PrintSettings;
  onUpdatePrintSettings: (ps: PrintSettings) => void;
}

export const Designer: React.FC<DesignerProps> = ({
  students,
  school,
  exam,
  dateSheet,
  instructions,
  customFields,
  visibility,
  onUpdateVisibility,
  sections,
  onUpdateSections,
  design,
  onUpdateDesign,
  savedTemplates,
  onSaveTemplate,
  onResetDesign,
  printSettings,
  onUpdatePrintSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'typography' | 'visibility' | 'sections' | 'qr'>('theme');
  const [previewMode, setPreviewMode] = useState<'single' | 'a4'>('a4');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const sampleStudent = students[selectedStudentIdx] || students[0];

  const handleApplyPreset = (presetKey: string) => {
    const preset = DESIGN_PRESETS[presetKey];
    if (preset) {
      onUpdateDesign({
        ...design,
        ...preset,
      });
      flashMessage(`थीम "${preset.name}" लागू की गई`);
    }
  };

  const flashMessage = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    onUpdateSections(newSections);
  };

  const handleToggleSectionVisibility = (secId: string) => {
    const newSections = sections.map((s) => (s.id === secId ? { ...s, visible: !s.visible } : s));
    onUpdateSections(newSections);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-6.5rem)] min-h-[680px]">
      {/* LEFT PANEL: Controls & Settings */}
      <div className="w-full xl:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden flex-shrink-0">
        {/* Navigation Tabs for Designer */}
        <div className="p-2 bg-slate-50 border-b border-slate-200 grid grid-cols-5 gap-1 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'theme' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'typography'
                ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Fonts
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'visibility'
                ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Fields
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'sections'
                ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'qr' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Cutting
          </button>
        </div>

        {/* Controls Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: THEME & COLOR SETTINGS */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              {/* TIME TABLE DIRECTION */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Timetable Layout Direction
                  </span>
                  <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    {design.timeTableLayout !== 'vertical' ? 'Horizontal (Active)' : 'Vertical'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onUpdateDesign({ ...design, timeTableLayout: 'horizontal' });
                      flashMessage('Timetable set to Horizontal Matrix');
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      design.timeTableLayout !== 'vertical'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-black ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="block text-[11px] font-black">Horizontal Matrix</span>
                    <span className={`block text-[9.5px] mt-0.5 ${design.timeTableLayout !== 'vertical' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Recommended (Wide)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateDesign({ ...design, timeTableLayout: 'vertical' });
                      flashMessage('Timetable set to Vertical 2-Column');
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      design.timeTableLayout === 'vertical'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-black ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="block text-[11px] font-bold">Vertical (2-Column)</span>
                    <span className={`block text-[9.5px] mt-0.5 ${design.timeTableLayout === 'vertical' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Standard Rows
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-2">
                  Official School Themes
                </label>
                <div className="space-y-1.5">
                  {Object.entries(DESIGN_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={`w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between group cursor-pointer ${
                        design.primaryColor === p.primaryColor
                          ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: p.primaryColor }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-[11px] block group-hover:text-blue-700">
                            {p.name}
                          </span>
                        </div>
                      </div>
                      {design.primaryColor === p.primaryColor && (
                        <span className="text-[10px] font-black text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="block text-[11px] font-extrabold uppercase text-slate-400">
                  Colors & Border Style
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-1.5 border rounded-lg p-1">
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) => onUpdateDesign({ ...design, primaryColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="font-mono text-[10px] font-bold">{design.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Border Style
                    </label>
                    <select
                      value={design.borderStyle}
                      onChange={(e) =>
                        onUpdateDesign({ ...design, borderStyle: e.target.value as any })
                      }
                      className="w-full p-1.5 border rounded-lg text-xs"
                    >
                      <option value="double">Double (Classic School)</option>
                      <option value="solid">Solid</option>
                      <option value="groove">Groove</option>
                    </select>
                  </div>
                </div>

                {/* Additional Features */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Background Watermark Logo</span>
                      <span className="text-[10px] text-slate-500">School emblem watermark</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={design.watermark}
                      onChange={(e) => onUpdateDesign({ ...design, watermark: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY & SPACING */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              {/* SARKARI ADMIT CARD FONT SELECTION */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-2">
                  Admit Card Font (Sarkari Board Style)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'roboto', label: 'Roboto (Sarkari)', desc: 'Official Board Font' },
                    { id: 'sans', label: 'Inter Sans', desc: 'Modern Clean Sans' },
                    { id: 'serif', label: 'Classic Serif', desc: 'Traditional Formal' },
                    { id: 'cinzel', label: 'Cinzel Formal', desc: 'Header Decorative' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdateDesign({ ...design, fontFamily: f.id as any })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        design.fontFamily === f.id || (!design.fontFamily && f.id === 'roboto')
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500 shadow-2xs font-extrabold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="block text-xs font-bold">{f.label}</span>
                      <span className="block text-[9px] text-slate-500">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-2">
                  Overall Text Size
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'standard', label: 'Standard' },
                    { id: 'large', label: 'Large (Clear)' },
                    { id: 'extralarge', label: 'Maximum' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onUpdateDesign({ ...design, fontSize: sz.id as any })}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        design.fontSize === sz.id || (!design.fontSize && sz.id === 'large')
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-1 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                      }`}
                    >
                      <span className="block text-xs font-bold">{sz.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>School Heading Size</span>
                  <span>{design.headingSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="22"
                  value={design.headingSize || 17}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, headingSize: parseInt(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>Student Name Size</span>
                  <span>{design.studentNameSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="18"
                  value={design.studentNameSize || 14}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, studentNameSize: parseInt(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FIELD VISIBILITY CONTROLS */}
          {activeTab === 'visibility' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">
                  Toggle Fields On / Off
                </span>
                <span className="text-[10px] text-blue-600 font-bold">Instant Updates</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { key: 'schoolLogo', label: 'School Logo' },
                  { key: 'schoolName', label: 'School Name' },
                  { key: 'schoolAddress', label: 'School Address' },
                  { key: 'schoolManagedBy', label: 'Managed By / Manager' },
                  { key: 'schoolMobile', label: 'School Mobile' },
                  { key: 'examName', label: 'Examination Name' },
                  { key: 'academicSession', label: 'Academic Session' },
                  { key: 'admitCardNumber', label: 'Admit Card Roll No' },
                  { key: 'studentPhoto', label: 'Student Photo' },
                  { key: 'studentName', label: 'Student Name' },
                  { key: 'fatherName', label: "Father's Name" },
                  { key: 'motherName', label: "Mother's Name" },
                  { key: 'className', label: 'Class & Section' },
                  { key: 'rollNumber', label: 'Class Roll No' },
                  { key: 'admissionNumber', label: 'Admission Number' },
                  { key: 'dob', label: 'Date of Birth (DOB)' },
                  { key: 'dateSheet', label: 'Examination Timetable' },
                  { key: 'instructions', label: 'Exam Rules & Instructions' },
                  { key: 'studentSignature', label: "Candidate's Signature" },
                  { key: 'classTeacherSignature', label: "Class Teacher's Signature" },
                  { key: 'principalSignature', label: "Principal's Signature" },
                  { key: 'schoolStamp', label: 'School Stamp / Seal' },
                  { key: 'qrCode', label: 'Verification QR Code' },
                ].map((item) => {
                  const isChecked = (visibility as any)[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onUpdateVisibility({
                            ...visibility,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SECTIONS ORDER & VISIBILITY */}
          {activeTab === 'sections' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                Reorder or toggle sections on the admit card layout:
              </p>

              <div className="space-y-1.5">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sec.visible}
                        onChange={() => handleToggleSectionVisibility(sec.id)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-800">{sec.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveSection(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === sections.length - 1}
                        onClick={() => handleMoveSection(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: QR & CUTTING LINES */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Cutting Guide Lines</span>
                  <span className="text-[10px] text-slate-500">Print border lines for cutter alignment</span>
                </div>
                <input
                  type="checkbox"
                  checked={printSettings.showCuttingLine}
                  onChange={(e) =>
                    onUpdatePrintSettings({ ...printSettings, showCuttingLine: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>QR Code Size</span>
                  <span>{design.qrSize}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  value={design.qrSize}
                  onChange={(e) => onUpdateDesign({ ...design, qrSize: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Save & Reset */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={onResetDesign}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Default
          </button>

          <button
            onClick={() => {
              onSaveTemplate(design, false);
              flashMessage('Design settings saved');
            }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save Design
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Live Canvas Preview */}
      <div className="flex-1 bg-slate-100/90 rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-inner relative">
        {/* Canvas Toolbar */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPreviewMode('a4')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                previewMode === 'a4'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Sheet (2 Horizontal Cards)
            </button>
            <button
              onClick={() => setPreviewMode('single')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                previewMode === 'single'
                  ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Card
            </button>
          </div>

          {/* Student Selector for preview */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold">Preview Student:</span>
            <select
              value={selectedStudentIdx}
              onChange={(e) => setSelectedStudentIdx(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {students.map((s, idx) => (
                <option key={s.id} value={idx}>
                  #{s.rollNumber} {s.name} ({s.className})
                </option>
              ))}
            </select>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-600 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {statusMessage}
          </div>
        )}

        {/* Interactive Canvas Stage */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
          {previewMode === 'a4' ? (
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
              <A4PrintSheet
                students={students.slice(0, 4)}
                school={school}
                exam={exam}
                dateSheet={dateSheet}
                instructions={instructions}
                customFields={customFields}
                visibility={visibility}
                sections={sections}
                design={design}
                printSettings={printSettings}
                isPrintMode={false}
              />
            </div>
          ) : (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="shadow-2xl rounded-sm"
            >
              <AdmitCard
                student={sampleStudent}
                school={school}
                exam={exam}
                dateSheet={dateSheet}
                instructions={instructions}
                customFields={customFields}
                visibility={visibility}
                sections={sections}
                design={design}
                showCuttingLine={false}
                isPrintMode={false}
                cardWidthMm={198}
                cardHeightMm={138}
                isLandscape2={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
