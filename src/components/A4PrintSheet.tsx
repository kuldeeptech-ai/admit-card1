import React from 'react';
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
import { Scissors } from 'lucide-react';

interface A4PrintSheetProps {
  students: Student[];
  school: SchoolSettings;
  exam: Examination;
  dateSheet?: DateSheetItem[];
  instructions?: InstructionItem[];
  customFields?: CustomField[];
  visibility: FieldVisibility;
  sections: SectionConfig[];
  design: DesignSettings;
  printSettings: PrintSettings;
  previewScale?: number;
  isPrintMode?: boolean;
}

export const A4PrintSheet: React.FC<A4PrintSheetProps> = ({
  students,
  school,
  exam,
  dateSheet = [],
  instructions = [],
  customFields = [],
  visibility,
  sections,
  design,
  printSettings,
  previewScale = 1,
  isPrintMode = false,
}) => {
  const isLandscape = printSettings.layout === 'landscape_2' || printSettings.orientation === 'landscape';
  const cardsPerPage = isLandscape ? 2 : 4;

  // Chunk students into groups of exactly 2 (horizontal cards) or 4 (portrait cards)
  const pages: Student[][] = [];
  if (students.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
        No students selected or found for admit card generation.
      </div>
    );
  }

  for (let i = 0; i < students.length; i += cardsPerPage) {
    pages.push(students.slice(i, i + cardsPerPage));
  }

  return (
    <div className="a4-sheets-wrapper flex flex-col items-center gap-8 print:gap-0 print:p-0 print:m-0">
      {pages.map((pageStudents, pageIdx) => (
        <div key={`a4-page-wrapper-${pageIdx}`} className="flex flex-col items-center print:m-0 print:p-0">
          {/* On-screen visual badge */}
          {!isPrintMode && (
            <div className="w-full max-w-[210mm] flex items-center justify-between text-xs font-semibold text-slate-500 mb-2 px-1 no-print">
              <span>
                A4 Sheet {pageIdx + 1} of {pages.length} • (Students {pageIdx * cardsPerPage + 1} –{' '}
                {Math.min((pageIdx + 1) * cardsPerPage, students.length)})
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Scissors className="w-3.5 h-3.5" />
                {isLandscape
                  ? 'Horizontal Admit Cards (2 Cards / A4 Sheet) • 198mm × 138mm each'
                  : 'Vertical Admit Cards (4 Cards / A4 Sheet) • 90mm × 140mm each'}
              </span>
            </div>
          )}

          {/* Strict A4 Printable Container (210mm x 297mm) */}
          {isLandscape ? (
            /* ======================================================== */
            /* 2 HORIZONTAL ADMIT CARDS ON A4 SHEET (198mm x 138mm)     */
            /* Top Card + Bottom Card with Equal Balanced Margins        */
            /* ======================================================== */
            <div
              className="a4-page a4-page-horizontal bg-white relative box-border shadow-xl print:shadow-none"
              style={{
                width: '210mm',
                height: isPrintMode ? '296.5mm' : '297mm',
                minWidth: '210mm',
                minHeight: isPrintMode ? '296.5mm' : '297mm',
                maxWidth: '210mm',
                maxHeight: isPrintMode ? '296.5mm' : '297mm',
                padding: '6mm 6mm',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                transform: !isPrintMode && previewScale !== 1 ? `scale(${previewScale})` : undefined,
                transformOrigin: 'top center',
                border: !isPrintMode ? '1px solid #cbd5e1' : 'none',
                pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'avoid',
                breakAfter: pageIdx < pages.length - 1 ? 'page' : 'avoid',
              }}
            >
              {/* Center Horizontal Cutting Guide at 148.5mm */}
              {printSettings.showCuttingLine && (
                <>
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '148.5mm',
                      left: 0,
                      right: 0,
                      height: 0,
                      borderTop: `1px ${printSettings.cuttingLineStyle || 'dashed'} ${printSettings.cuttingLineColor || '#94a3b8'}`,
                      zIndex: 25,
                    }}
                  />
                  {/* Center Scissors Marker */}
                  <div
                    className="absolute pointer-events-none z-30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{ left: '105mm', top: '148.5mm' }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white border border-slate-400 flex items-center justify-center text-slate-500 shadow-2xs">
                      <Scissors className="w-3 h-3" />
                    </div>
                  </div>
                </>
              )}

              {/* Slot 0: Top Horizontal Card (198mm x 138mm) */}
              <div
                className="relative w-[198mm] h-[138mm] box-border overflow-hidden flex items-center justify-center"
                style={{
                  width: '198mm',
                  height: '138mm',
                  maxWidth: '198mm',
                  maxHeight: '138mm',
                }}
              >
                {pageStudents[0] ? (
                  <AdmitCard
                    student={pageStudents[0]}
                    school={school}
                    exam={exam}
                    dateSheet={dateSheet}
                    instructions={instructions}
                    customFields={customFields}
                    visibility={visibility}
                    sections={sections}
                    design={design}
                    showCuttingLine={false}
                    isPrintMode={isPrintMode}
                    cardWidthMm={198}
                    cardHeightMm={138}
                    isLandscape2={true}
                  />
                ) : (
                  <div className="w-[198mm] h-[138mm] border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      BLANK ADMIT CARD SLOT
                    </span>
                  </div>
                )}
              </div>

              {/* Slot 1: Bottom Horizontal Card (198mm x 138mm) */}
              <div
                className="relative w-[198mm] h-[138mm] box-border overflow-hidden flex items-center justify-center"
                style={{
                  width: '198mm',
                  height: '138mm',
                  maxWidth: '198mm',
                  maxHeight: '138mm',
                }}
              >
                {pageStudents[1] ? (
                  <AdmitCard
                    student={pageStudents[1]}
                    school={school}
                    exam={exam}
                    dateSheet={dateSheet}
                    instructions={instructions}
                    customFields={customFields}
                    visibility={visibility}
                    sections={sections}
                    design={design}
                    showCuttingLine={false}
                    isPrintMode={isPrintMode}
                    cardWidthMm={198}
                    cardHeightMm={138}
                    isLandscape2={true}
                  />
                ) : (
                  <div className="w-[198mm] h-[138mm] border border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      BLANK ADMIT CARD POSITION 2
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1">
                      Exact 198mm × 138mm Slot for Single Student Print (Non-stretched)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* 4 VERTICAL ADMIT CARDS 2x2 GRID (90mm x 140mm)           */
            /* ======================================================== */
            <div
              className="a4-page a4-page-portrait bg-white relative box-border shadow-xl print:shadow-none"
              style={{
                width: '210mm',
                height: '297mm',
                minWidth: '210mm',
                minHeight: '297mm',
                maxWidth: '210mm',
                maxHeight: '297mm',
                padding: '6mm 10mm',
                display: 'grid',
                gridTemplateColumns: '90mm 90mm',
                gridTemplateRows: '140mm 140mm',
                columnGap: '10mm',
                rowGap: '5mm',
                justifyContent: 'center',
                alignContent: 'center',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                transform: !isPrintMode && previewScale !== 1 ? `scale(${previewScale})` : undefined,
                transformOrigin: 'top center',
                border: !isPrintMode ? '1px solid #cbd5e1' : 'none',
                pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'avoid',
                breakAfter: pageIdx < pages.length - 1 ? 'page' : 'avoid',
              }}
            >
              {printSettings.showCuttingLine && (
                <>
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '105mm',
                      top: 0,
                      bottom: 0,
                      width: 0,
                      borderLeft: `1px ${printSettings.cuttingLineStyle || 'dashed'} ${printSettings.cuttingLineColor || '#94a3b8'}`,
                      zIndex: 25,
                    }}
                  />
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '148.5mm',
                      left: 0,
                      right: 0,
                      height: 0,
                      borderTop: `1px ${printSettings.cuttingLineStyle || 'dashed'} ${printSettings.cuttingLineColor || '#94a3b8'}`,
                      zIndex: 25,
                    }}
                  />
                  <div
                    className="absolute pointer-events-none z-30 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{ left: '105mm', top: '148.5mm' }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white border border-slate-400 flex items-center justify-center text-slate-500 shadow-2xs">
                      <Scissors className="w-3 h-3 rotate-90" />
                    </div>
                  </div>
                </>
              )}

              {[0, 1, 2, 3].map((slotIndex) => {
                const student = pageStudents[slotIndex];
                return (
                  <div
                    key={`slot-port-${slotIndex}`}
                    className="relative w-[90mm] h-[140mm] box-border overflow-hidden flex items-center justify-center"
                    style={{
                      width: '90mm',
                      height: '140mm',
                      maxWidth: '90mm',
                      maxHeight: '140mm',
                    }}
                  >
                    {student ? (
                      <AdmitCard
                        student={student}
                        school={school}
                        exam={exam}
                        dateSheet={dateSheet}
                        instructions={instructions}
                        customFields={customFields}
                        visibility={visibility}
                        sections={sections}
                        design={design}
                        showCuttingLine={false}
                        isPrintMode={isPrintMode}
                        cardWidthMm={90}
                        cardHeightMm={140}
                        isLandscape2={false}
                      />
                    ) : (
                      <div
                        className="w-[90mm] h-[140mm] box-border border border-dashed border-slate-300 rounded flex flex-col items-center justify-center p-4 text-center bg-transparent"
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          BLANK SLOT {slotIndex + 1}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
