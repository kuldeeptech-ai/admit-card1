import React, { useEffect, useState } from 'react';
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
} from '../types';
import { generateQrDataUrl } from '../utils/qr';

interface AdmitCardProps {
  student: Student;
  school: SchoolSettings;
  exam: Examination;
  dateSheet?: DateSheetItem[];
  instructions?: InstructionItem[];
  customFields?: CustomField[];
  visibility: FieldVisibility;
  sections: SectionConfig[];
  design: DesignSettings;
  showCuttingLine?: boolean;
  scale?: number;
  isPrintMode?: boolean;
  cardWidthMm?: number;
  cardHeightMm?: number;
  isLandscape2?: boolean;
}

export const AdmitCard: React.FC<AdmitCardProps> = ({
  student,
  school,
  exam,
  dateSheet = [],
  instructions = [],
  customFields = [],
  visibility,
  sections,
  design,
  showCuttingLine = false,
  scale = 1,
  isPrintMode = false,
  cardWidthMm,
  cardHeightMm,
  isLandscape2 = false,
}) => {
  // Horizontal Admit Card is 198mm x 138mm for 2 cards per A4 page
  const isLandscape = isLandscape2 || (cardWidthMm ? cardWidthMm > 140 : true);
  const cardWidth = cardWidthMm || (isLandscape ? 198 : 90);
  const cardHeight = cardHeightMm || (isLandscape ? 138 : 140);
  const baseScale = isLandscape ? 0.98 : 1.0;

  // Sanitization helper: remove any excessive parenthesized text in subject name
  const cleanSubject = (subj: string): string => {
    if (!subj) return '';
    return subj.trim();
  };

  // Helper to render exam time clearly without being cut off
  const renderFullExamTime = (timeStr?: string) => {
    const raw = timeStr && timeStr.trim() !== '' ? timeStr.trim() : `${exam.examStartTime || '09:00 AM'} - ${exam.examEndTime || '12:00 PM'}`;
    const parts = raw.split(/\s*(?:–|-|to|TO)\s*/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (
        <div className="flex flex-col items-center justify-center leading-none py-0.5">
          <span className="font-extrabold text-blue-950 text-[7.5px] tracking-tight">{parts[0]}</span>
          <span className="text-[6.5px] font-semibold text-slate-500 tracking-tighter">to {parts[1]}</span>
        </div>
      );
    }
    return (
      <span className="font-extrabold text-blue-950 text-[7.5px] block text-center leading-tight">
        {raw}
      </span>
    );
  };

  // Upload presence checks for signatures and seal - do not show anything unless uploaded
  const hasUploadedTeacherSign = Boolean(school.classTeacherSignatureUrl && school.classTeacherSignatureUrl.trim() !== '');
  const hasUploadedPrincipalSign = Boolean(school.principalSignatureUrl && school.principalSignatureUrl.trim() !== '');
  const hasUploadedStamp = Boolean(school.stampUrl && school.stampUrl.trim() !== '');
  const showCandidateSign = Boolean(visibility.studentSignature);
  const showTeacherSign = Boolean(visibility.classTeacherSignature && hasUploadedTeacherSign);
  const showPrincipalSignOrStamp = Boolean((visibility.principalSignature && hasUploadedPrincipalSign) || (visibility.schoolStamp && hasUploadedStamp));
  const showSignaturesSection = showCandidateSign || showTeacherSign || showPrincipalSignOrStamp;

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate QR code dynamically only if enabled
  useEffect(() => {
    let isMounted = true;
    if (visibility.qrCode) {
      const qrPayload = JSON.stringify({
        school: school.name,
        exam: exam.name,
        session: school.academicSession,
        rollNo: student.rollNumber,
        name: student.name,
        class: `${student.className}-${student.section}`,
        admNo: student.admissionNumber,
        admitCardNo: student.admitCardNumber,
      });

      generateQrDataUrl(qrPayload, Math.round(design.qrSize * 2)).then((url) => {
        if (isMounted) setQrCodeUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [visibility.qrCode, student, school, exam, design.qrSize]);

  // Active instructions and date sheet (support class-specific or common)
  const activeInstructions = instructions.filter((i) => i.isActive).sort((a, b) => a.order - b.order);
  const examDateSheet = dateSheet
    .filter((d) => (!d.examId || d.examId === exam.id) && (!d.className || d.className === student.className))
    .sort((a, b) => a.order - b.order);

  // If no class-specific datesheet found, fallback to common datesheet for this exam
  const finalDateSheet =
    examDateSheet.length > 0
      ? examDateSheet
      : dateSheet.filter((d) => !d.examId || d.examId === exam.id).sort((a, b) => a.order - b.order);

  const fontClass =
    design.fontFamily === 'roboto'
      ? "font-['Roboto',sans-serif]"
      : design.fontFamily === 'cinzel'
      ? 'font-cinzel'
      : design.fontFamily === 'serif'
      ? 'font-serif'
      : design.fontFamily === 'mono'
      ? 'font-mono'
      : "font-['Roboto',sans-serif]";

  // Scaling factor based on user selection in toolbar
  const fontSizeFactor =
    (design.fontSize === 'compact'
      ? 0.92
      : design.fontSize === 'extralarge'
      ? 1.15
      : design.fontSize === 'large'
      ? 1.05
      : 1.0) * baseScale;

  const primaryCol = design.primaryColor || '#0f2942';
  const secondaryCol = design.secondaryColor || '#d4af37';
  const borderCol = design.borderColor || primaryCol;

  return (
    <div
      className={`admit-card ${isLandscape ? 'admit-card-horizontal' : 'admit-card-portrait'} relative flex flex-col justify-between select-none ${fontClass} ${
        showCuttingLine ? 'border-r border-b border-dashed border-slate-300' : ''
      }`}
      style={{
        width: `${cardWidth}mm`,
        height: `${cardHeight}mm`,
        minWidth: `${cardWidth}mm`,
        minHeight: `${cardHeight}mm`,
        maxWidth: `${cardWidth}mm`,
        maxHeight: `${cardHeight}mm`,
        backgroundColor: design.backgroundColor || '#ffffff',
        color: design.textColor || '#0f172a',
        padding: isLandscape ? '3.5mm 5mm' : `${Math.min(design.padding || 6, 6)}px`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        transform: !isPrintMode && scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      {/* Outer Border Frame */}
      <div
        className="absolute inset-1 pointer-events-none rounded-[inherit]"
        style={{
          border: `${design.borderWidth || 2}px ${design.borderStyle || 'double'} ${borderCol}`,
          zIndex: 1,
        }}
      />

      {/* Subtle Inset Accent Hairline */}
      <div
        className="absolute inset-2 pointer-events-none rounded-[inherit]"
        style={{
          border: `0.5px solid ${secondaryCol}50`,
          zIndex: 1,
        }}
      />

      {/* Watermark Logo Background (Subtle) */}
      {design.watermark && school.logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{
            zIndex: 0,
            opacity: design.watermarkOpacity || 0.04,
          }}
        >
          <img
            src={school.logoUrl}
            alt=""
            className="w-56 h-56 object-contain filter grayscale"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HORIZONTAL ADMIT CARD LAYOUT (198mm x 138mm)         */}
      {/* ======================================================== */}
      {isLandscape ? (
        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          {/* TOP SECTION: Clean School Header */}
          <div>
            <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: `${borderCol}35` }}>
              {/* School Emblem / Logo */}
              {visibility.schoolLogo && school.logoUrl && (
                <div className="flex-shrink-0 mr-2.5">
                  <div
                    className="p-0.5 rounded-full bg-white shadow-2xs"
                    style={{ border: `1.5px solid ${secondaryCol}` }}
                  >
                    <img
                      src={school.logoUrl}
                      alt="School Logo"
                      className="object-contain rounded-full"
                      style={{
                        width: `${Math.min(design.logoSize || 42, 44)}px`,
                        height: `${Math.min(design.logoSize || 42, 44)}px`,
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* School Main Title, Address & Managed By */}
              <div className="flex-1 text-center leading-tight px-1">
                {visibility.schoolName && (
                  <h1
                    className="font-black tracking-tight uppercase"
                    style={{
                      color: primaryCol,
                      fontSize: `${Math.round(Math.max(14.5, design.headingSize || 16.5) * fontSizeFactor)}px`,
                      lineHeight: 1.15,
                    }}
                  >
                    {school.name || 'H.D. PANDEY PUBLIC SCHOOL'}
                  </h1>
                )}

                {/* School Address */}
                {visibility.schoolAddress && (
                  <div
                    className="font-bold text-slate-800 flex items-center justify-center flex-wrap gap-1 mt-0.5"
                    style={{ fontSize: `${Math.round(9.2 * fontSizeFactor)}px` }}
                  >
                    <span>{school.address || 'Baurbyas, Mehdawal, Sant Kabir Nagar (U.P.)'}</span>
                  </div>
                )}

                {/* Managed By & Official Contact */}
                <div
                  className="flex items-center justify-center gap-1.5 mt-0.5 text-slate-700 font-bold"
                  style={{ fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}
                >
                  {visibility.schoolManagedBy && <span>Managed by: {school.managedBy || 'Manoj Pandey'}</span>}
                  {visibility.schoolManagedBy && visibility.schoolMobile && <span>•</span>}
                  {visibility.schoolMobile && <span>Mob: +91 {school.mobile || '9838767297'}</span>}
                </div>
              </div>

              {/* Right: Roll Number & Admit Card Badge */}
              <div className="flex-shrink-0 pl-2 text-right flex flex-col items-end justify-center">
                <div
                  className="px-2 py-0.5 rounded font-mono font-black border shadow-2xs text-center"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: primaryCol,
                  }}
                >
                  <span className="block text-[7.5px] font-black uppercase tracking-wider text-slate-600">ROLL NO.</span>
                  <span className="text-red-700 text-sm font-black block leading-none">
                    {student.rollNumber || '01'}
                  </span>
                </div>
                {visibility.admitCardNumber && (
                  <span className="text-[7.5px] font-bold text-slate-600 font-mono mt-0.5">
                    {student.admitCardNumber || `HDP/26/${student.rollNumber || '01'}`}
                  </span>
                )}
              </div>
            </div>

            {/* Exam Banner Ribbon with Gold Trim */}
            <div
              className="text-center px-2 py-0.5 rounded flex items-center justify-between font-bold my-1 shadow-2xs"
              style={{
                backgroundColor: primaryCol,
                color: '#ffffff',
                borderTop: `1px solid ${secondaryCol}`,
                borderBottom: `1px solid ${secondaryCol}`,
              }}
            >
              <div className="text-left font-bold" style={{ fontSize: `${Math.round(8.8 * fontSizeFactor)}px` }}>
                {visibility.academicSession && (
                  <span>
                    SESSION: <strong>{exam.academicSession || school.academicSession || '2026–27'}</strong>
                  </span>
                )}
              </div>

              <div className="text-center leading-tight">
                <span
                  className="tracking-wider uppercase font-black text-amber-200"
                  style={{ fontSize: `${Math.round(11 * fontSizeFactor)}px` }}
                >
                  EXAMINATION ADMIT CARD / HALL TICKET
                </span>
                {visibility.examName && (
                  <span
                    className="block font-bold text-white text-[9.5px]"
                    style={{ fontSize: `${Math.round(9.2 * fontSizeFactor)}px` }}
                  >
                    {exam.name}
                  </span>
                )}
              </div>

              <div
                className="text-right font-bold text-white"
                style={{ fontSize: `${Math.round(8.8 * fontSizeFactor)}px` }}
              >
                <span>
                  CLASS: <strong>{student.className}{student.section ? ` - ${student.section}` : ''}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION 1: Student Details Table (Left) + Candidate Photo (Right) */}
          <div className="flex gap-2 items-stretch my-0.5 overflow-hidden">
            {/* Student Details Structured Table */}
            <div className="flex-1 min-w-0">
              <table
                className="w-full border-collapse border border-slate-400 bg-white rounded overflow-hidden shadow-2xs"
                style={{ fontSize: `${Math.round(9.2 * fontSizeFactor)}px` }}
              >
                <tbody>
                  {/* Row 1: Candidate Name & Roll */}
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-r border-slate-300 w-[24%]">
                      Candidate Name:
                    </td>
                    <td
                      className="font-black px-2 py-0.5 uppercase truncate"
                      style={{
                        color: primaryCol,
                        fontSize: `${Math.round(Math.max(11.5, design.studentNameSize || 12.5) * fontSizeFactor)}px`,
                      }}
                    >
                      {student.name}
                    </td>
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-l border-r border-slate-300 w-[18%]">
                      Roll No:
                    </td>
                    <td className="px-2 py-0.5 font-black text-red-700 w-[26%]">
                      <span className="bg-red-50 text-red-700 px-1.5 py-0.2 rounded border border-red-300 inline-block font-mono">
                        {student.rollNumber}
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Parents Details */}
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-r border-slate-300">
                      Father's Name:
                    </td>
                    <td className="px-2 py-0.5 font-bold text-slate-900 truncate">
                      {student.fatherName || 'N/A'}
                    </td>
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-l border-r border-slate-300">
                      Mother's Name:
                    </td>
                    <td className="px-2 py-0.5 font-bold text-slate-900 truncate">
                      {student.motherName || 'N/A'}
                    </td>
                  </tr>

                  {/* Row 3: Admission No, DOB & Class */}
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-r border-slate-300">
                      Adm. No / D.O.B:
                    </td>
                    <td className="px-2 py-0.5 font-bold text-slate-900">
                      <span className="font-extrabold">{student.admissionNumber}</span>
                      {student.dob && <span className="mx-1 text-slate-400">|</span>}
                      {student.dob && <span>{student.dob}</span>}
                    </td>
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-l border-r border-slate-300">
                      Class / Section:
                    </td>
                    <td className="px-2 py-0.5 font-extrabold text-slate-900">
                      {student.className} {student.section ? `('${student.section}')` : ''}
                    </td>
                  </tr>

                  {/* Row 4: Exam Centre & Timings */}
                  <tr>
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-r border-slate-300">
                      Exam Centre:
                    </td>
                    <td className="px-2 py-0.5 font-bold text-slate-900 truncate">
                      {exam.examinationCentre || school.name}
                    </td>
                    <td className="bg-slate-100 font-extrabold text-slate-800 px-2 py-0.5 border-l border-r border-slate-300">
                      Exam Timing:
                    </td>
                    <td className="px-2 py-0.5 font-extrabold text-blue-900 leading-tight">
                      <span>{exam.examStartTime}–{exam.examEndTime}</span>
                      {exam.reportingTime && (
                        <span className="text-[7.5px] text-red-600 block font-semibold">
                          (Report: {exam.reportingTime})
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Candidate Photo Box */}
            {visibility.studentPhoto && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center">
                <div
                  className="border-2 border-slate-400 bg-slate-50 overflow-hidden relative flex items-center justify-center rounded shadow-2xs"
                  style={{
                    width: '23mm',
                    height: '26mm',
                    borderColor: `${borderCol}99`,
                  }}
                >
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-1 text-center">
                      <span className="text-[7.5px] text-slate-400 font-black uppercase leading-tight">
                        STUDENT<br />PHOTO
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE SECTION 2: DATE SHEET / TIME TABLE (ACCOMMODATES UP TO 11 SUBJECTS) */}
          {/* ========================================================================= */}
          {visibility.dateSheet && finalDateSheet.length > 0 && (() => {
            const numSubjects = finalDateSheet.length;

            // When subjects are > 6:
            // Use 2-Column Side-by-Side Table for MAXIMUM readability and zero crowding
            if (numSubjects > 6 && design.timeTableLayout !== 'vertical') {
              const halfCount = Math.ceil(numSubjects / 2);
              const leftHalf = finalDateSheet.slice(0, halfCount);
              const rightHalf = finalDateSheet.slice(halfCount);

              const tableFontSize = Math.round(9.2 * fontSizeFactor);
              const subjectFontSize = Math.round(10 * fontSizeFactor);

              return (
                <div className="my-0.5 border border-slate-400 rounded overflow-hidden bg-white shadow-2xs">
                  {/* Table Header Bar */}
                  <div
                    className="px-2 py-0.5 font-bold uppercase text-white flex items-center justify-between tracking-wide"
                    style={{
                      backgroundColor: primaryCol,
                      fontSize: `${Math.round(9 * fontSizeFactor)}px`,
                      borderBottom: `1px solid ${secondaryCol}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>EXAMINATION TIME TABLE & SCHEDULE</span>
                    </div>
                    <div className="text-[8px] font-mono text-amber-200 font-bold">
                      TOTAL SUBJECTS: {numSubjects}
                    </div>
                  </div>

                  {/* 2-Column Side-by-Side Table */}
                  <div className="flex divide-x divide-slate-400 bg-white">
                    {/* LEFT HALF TABLE */}
                    <div className="w-1/2">
                      <table className="w-full text-center border-collapse table-fixed" style={{ fontSize: `${tableFontSize}px` }}>
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 border-b border-slate-300 font-bold text-[8px]">
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[7%]">#</th>
                            <th className="py-0.2 px-1 border-r border-slate-300 w-[36%] text-left">Subject</th>
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[20%]">Date</th>
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[11%]">Day</th>
                            <th className="py-0.2 px-0.5 w-[26%] text-center">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leftHalf.map((ds, idx) => (
                            <tr key={`left-${ds.id}`} className="border-b border-slate-200 bg-white hover:bg-slate-50">
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-bold text-slate-600 bg-slate-50 text-[7.5px]">
                                {idx + 1}
                              </td>
                              <td className="py-0.2 px-1 border-r border-slate-300 font-black text-left uppercase truncate" style={{ color: primaryCol, fontSize: `${subjectFontSize}px` }}>
                                {cleanSubject(ds.subject)}
                              </td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-extrabold text-slate-900 text-[8px] whitespace-nowrap">
                                {ds.date}
                              </td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-semibold text-slate-700 text-[7.5px] uppercase">
                                {ds.day.slice(0, 3)}
                              </td>
                              <td className="py-0.2 px-0.5 border-slate-200">
                                {renderFullExamTime(ds.time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* RIGHT HALF TABLE */}
                    <div className="w-1/2">
                      <table className="w-full text-center border-collapse table-fixed" style={{ fontSize: `${tableFontSize}px` }}>
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 border-b border-slate-300 font-bold text-[8px]">
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[7%]">#</th>
                            <th className="py-0.2 px-1 border-r border-slate-300 w-[36%] text-left">Subject</th>
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[20%]">Date</th>
                            <th className="py-0.2 px-0.5 border-r border-slate-300 w-[11%]">Day</th>
                            <th className="py-0.2 px-0.5 w-[26%] text-center">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rightHalf.map((ds, idx) => (
                            <tr key={`right-${ds.id}`} className="border-b border-slate-200 bg-white hover:bg-slate-50">
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-bold text-slate-600 bg-slate-50 text-[7.5px]">
                                {halfCount + idx + 1}
                              </td>
                              <td className="py-0.2 px-1 border-r border-slate-300 font-black text-left uppercase truncate" style={{ color: primaryCol, fontSize: `${subjectFontSize}px` }}>
                                {cleanSubject(ds.subject)}
                              </td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-extrabold text-slate-900 text-[8px] whitespace-nowrap">
                                {ds.date}
                              </td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 font-semibold text-slate-700 text-[7.5px] uppercase">
                                {ds.day.slice(0, 3)}
                              </td>
                              <td className="py-0.2 px-0.5 border-slate-200">
                                {renderFullExamTime(ds.time)}
                              </td>
                            </tr>
                          ))}
                          {rightHalf.length < leftHalf.length && (
                            <tr className="border-b border-slate-200 bg-slate-50/50">
                              <td className="py-0.2 px-0.5 border-r border-slate-300 text-slate-300 text-[7.5px]">-</td>
                              <td className="py-0.2 px-1 border-r border-slate-300 text-slate-300 text-[8px] italic">---</td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 text-slate-300 text-[7.5px]">---</td>
                              <td className="py-0.2 px-0.5 border-r border-slate-300 text-slate-300 text-[7.5px]">---</td>
                              <td className="py-0.2 px-0.5 text-slate-300 text-[7px]">---</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }

            // Fallback: 1 to 6 subjects in standard Horizontal Left-to-Right Matrix
            const labelColWidth = 'w-[14%]';
            const labelFontSize = Math.round(9.2 * fontSizeFactor);
            const subjectFontSize = Math.round(10.5 * fontSizeFactor);
            const dateFontSize = Math.round(10 * fontSizeFactor);
            const dayFontSize = Math.round(8 * fontSizeFactor);
            const timeFontSize = Math.round(8 * fontSizeFactor);

            return (
              <div className="my-0.5 border border-slate-400 rounded overflow-hidden bg-white shadow-2xs">
                {/* Header Title Bar */}
                <div
                  className="px-2 py-0.5 font-bold uppercase text-white flex items-center justify-between tracking-wide"
                  style={{
                    backgroundColor: primaryCol,
                    fontSize: `${Math.round(9 * fontSizeFactor)}px`,
                    borderBottom: `1px solid ${secondaryCol}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>EXAMINATION TIME TABLE & SCHEDULE</span>
                  </div>
                  <div className="text-[8px] font-mono text-amber-200 font-bold">
                    TOTAL SUBJECTS: {numSubjects}
                  </div>
                </div>

                {/* Horizontal Matrix Table: Row 1 = Date, Row 2 = Subject, Row 3 = Time */}
                <table className="w-full text-center border-collapse table-fixed" style={{ fontSize: `${labelFontSize}px` }}>
                  <tbody>
                    {/* ROW 1: DATE & DAY */}
                    <tr className="border-b border-slate-300 bg-slate-100">
                      <td className={`py-0.5 px-1 font-extrabold text-slate-800 border-r border-slate-300 ${labelColWidth} text-left bg-slate-200/90 leading-tight`}>
                        Date:
                      </td>
                      {finalDateSheet.map((ds) => (
                        <td key={`date-${ds.id}`} className="py-0.5 px-1 font-extrabold text-slate-800 border-r border-slate-300">
                          <span className="block font-black text-slate-900 tracking-tight" style={{ fontSize: `${dateFontSize}px` }}>
                            {ds.date}
                          </span>
                          <span className="text-slate-600 font-bold block uppercase" style={{ fontSize: `${dayFontSize}px` }}>
                            {ds.day.slice(0, 3)}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* ROW 2: SUBJECT */}
                    <tr className="border-b border-slate-300 bg-white">
                      <td className={`py-0.5 px-1 font-extrabold text-slate-800 border-r border-slate-300 text-left bg-slate-200/90 leading-tight`}>
                        Subject:
                      </td>
                      {finalDateSheet.map((ds) => (
                        <td key={`subj-${ds.id}`} className="py-0.5 px-1 font-black uppercase border-r border-slate-300">
                          <div className="leading-[1.15] break-words line-clamp-2 px-0.5" style={{ color: primaryCol, fontSize: `${subjectFontSize}px` }}>
                            {cleanSubject(ds.subject)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* ROW 3: TIME */}
                    <tr className="bg-slate-50/70">
                      <td className={`py-0.5 px-1 font-extrabold text-slate-700 border-r border-slate-300 text-left bg-slate-200/90 leading-tight`}>
                        Time:
                      </td>
                      {finalDateSheet.map((ds) => (
                        <td key={`time-${ds.id}`} className="py-0.5 px-0.5 text-slate-800 font-bold border-r border-slate-300">
                          {renderFullExamTime(ds.time)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* INSTRUCTIONS BOX (2 Columns, Never Cut Off) */}
          {visibility.instructions && activeInstructions.length > 0 && (
            <div
              className="border rounded px-2 py-0.5 bg-slate-50 border-slate-300 text-slate-800 my-0.5"
              style={{ fontSize: `${Math.round(8.2 * fontSizeFactor)}px` }}
            >
              <div className="flex items-center gap-1 font-bold text-slate-900 leading-none mb-0.5">
                <span className="uppercase tracking-wider text-[7.5px] font-black text-amber-900 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
                  EXAMINATION RULES & REGULATIONS:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 leading-tight font-medium text-[7.5px] text-slate-700">
                {activeInstructions.slice(0, 4).map((inst, idx) => (
                  <div key={inst.id} className="flex items-start gap-1">
                    <span className="font-bold text-slate-900">{idx + 1}.</span>
                    <span className="leading-tight">{inst.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: 3 Authentic Signature Stations (Only shown when uploaded) */}
          {showSignaturesSection && (
            <div
              className="pt-1 border-t flex items-end justify-between text-center mt-auto"
              style={{ borderColor: `${borderCol}40` }}
            >
              {/* Station 1: Candidate Sign */}
              {showCandidateSign && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="h-4 w-24 border-b border-slate-400 mb-0.5 flex items-center justify-center" />
                  <span
                    className="font-bold text-slate-800 uppercase leading-tight"
                    style={{ fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}
                  >
                    Candidate Sign
                  </span>
                </div>
              )}

              {/* Station 2: Class Teacher Signature (Shown only if uploaded) */}
              {showTeacherSign && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="h-4 w-24 flex items-center justify-center border-b border-slate-400 mb-0.5">
                    <img
                      src={school.classTeacherSignatureUrl}
                      alt="Teacher Sign"
                      className="h-3.5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className="font-bold text-slate-800 uppercase leading-tight"
                    style={{ fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}
                  >
                    Class Teacher
                  </span>
                </div>
              )}

              {/* Station 3: Principal / Manager Signature & Seal (Shown only if uploaded) */}
              {showPrincipalSignOrStamp && (
                <div className="flex-1 flex flex-col items-center relative">
                  <div className="h-4 w-28 flex items-center justify-center border-b border-slate-400 mb-0.5 relative">
                    {visibility.schoolStamp && hasUploadedStamp && (
                      <img
                        src={school.stampUrl}
                        alt="School Seal"
                        className="h-9 w-9 object-contain absolute -top-4 right-0 mix-blend-multiply opacity-80 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {hasUploadedPrincipalSign && (
                      <img
                        src={school.principalSignatureUrl}
                        alt="Principal Sign"
                        className="h-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <span
                    className="font-black uppercase leading-tight"
                    style={{ color: primaryCol, fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}
                  >
                    Principal / Manager
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* 2. PORTRAIT ADMIT CARD LAYOUT (90mm x 140mm)             */
        /* ======================================================== */
        <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            {visibility.schoolName && (
              <div
                className="flex items-center justify-between pb-1 border-b"
                style={{ borderColor: `${borderCol}40`, marginBottom: '3px' }}
              >
                {visibility.schoolLogo && school.logoUrl && (
                  <div className="flex-shrink-0 mr-1.5">
                    <img
                      src={school.logoUrl}
                      alt="Logo"
                      className="object-contain"
                      style={{
                        width: `${Math.min(design.logoSize || 36, 36)}px`,
                        height: `${Math.min(design.logoSize || 36, 36)}px`,
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 text-center leading-tight">
                  <h1
                    className="font-extrabold tracking-tight uppercase"
                    style={{ color: primaryCol, fontSize: `${Math.round(13 * fontSizeFactor)}px` }}
                  >
                    {school.name || 'H.D. PANDEY PUBLIC SCHOOL'}
                  </h1>
                  {visibility.schoolAddress && (
                    <p className="text-slate-600 font-bold" style={{ fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}>
                      {school.address || 'Baurbyas, Mehdawal, Sant Kabir Nagar (U.P.)'}
                    </p>
                  )}
                  <span className="text-slate-700 text-[8px] block font-bold">
                    Managed by: {school.managedBy || 'Manoj Pandey'} • Mob: {school.mobile || '9838767297'}
                  </span>
                </div>
              </div>
            )}

            {/* Exam Title */}
            <div
              className="text-center px-1.5 py-0.5 rounded flex items-center justify-between font-bold"
              style={{
                backgroundColor: primaryCol,
                color: '#ffffff',
                marginBottom: '3px',
              }}
            >
              <span style={{ fontSize: `${Math.round(8.5 * fontSizeFactor)}px` }}>SESSION: {exam.academicSession}</span>
              <span className="tracking-wider uppercase font-black text-[9.5px]">EXAM ADMIT CARD</span>
              <span className="font-mono text-[8px] bg-white/20 px-1 rounded font-bold">{student.admitCardNumber || 'N/A'}</span>
            </div>

            {/* Bordered Student Details Table (Portrait Mode) */}
            <div className="flex gap-1.5 items-start mb-1">
              <div className="flex-1 min-w-0">
                <table
                  className="w-full border-collapse border border-slate-300"
                  style={{ fontSize: `${Math.round(8.8 * fontSizeFactor)}px` }}
                >
                  <tbody>
                    {visibility.studentName && (
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-50 font-bold text-slate-700 px-1 py-0.5 border-r border-slate-200 w-[38%]">
                          Candidate:
                        </td>
                        <td className="font-black text-blue-900 px-1 py-0.5 uppercase truncate" style={{ fontSize: `${Math.round(10.5 * fontSizeFactor)}px` }}>
                          {student.name}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200">
                      <td className="bg-slate-50 font-bold text-slate-700 px-1 py-0.5 border-r border-slate-200">
                        Roll / Class:
                      </td>
                      <td className="px-1 py-0.5 font-extrabold text-slate-900">
                        <span className="text-red-700 bg-red-50 px-1 rounded font-black mr-0.5 text-[10px]">
                          {student.rollNumber}
                        </span>{' '}
                        {student.className}-{student.section}
                      </td>
                    </tr>
                    {visibility.fatherName && (
                      <tr className="border-b border-slate-200">
                        <td className="bg-slate-50 font-bold text-slate-700 px-1 py-0.5 border-r border-slate-200">
                          Father Name:
                        </td>
                        <td className="px-1 py-0.5 font-bold text-slate-800 truncate">{student.fatherName}</td>
                      </tr>
                    )}
                    {visibility.admissionNumber && (
                      <tr>
                        <td className="bg-slate-50 font-bold text-slate-700 px-1 py-0.5 border-r border-slate-200">
                          Adm. / DOB:
                        </td>
                        <td className="px-1 py-0.5 font-bold text-slate-800">
                          {student.admissionNumber} | {student.dob || 'N/A'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {visibility.studentPhoto && (
                <div
                  className="border border-slate-400 bg-slate-100 flex items-center justify-center rounded overflow-hidden flex-shrink-0"
                  style={{ width: '20mm', height: '24mm' }}
                >
                  {student.photoUrl ? (
                    <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[7px] text-slate-400 font-bold uppercase p-0.5 text-center">
                      PHOTO
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Date Sheet Table (Portrait) */}
            {visibility.dateSheet && finalDateSheet.length > 0 && (
              <div
                className="border border-slate-300 rounded overflow-hidden mb-1"
                style={{ fontSize: `${Math.round(8 * fontSizeFactor)}px` }}
              >
                <div className="bg-blue-900 text-white font-bold text-center py-0.2 text-[8px] uppercase">
                  EXAM SCHEDULE ({finalDateSheet.length} Subjects)
                </div>
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[8px]">
                      <th className="py-0.2 border-r border-slate-200 w-[8%]">#</th>
                      <th className="py-0.2 border-r border-slate-200 text-left px-1 w-[38%]">Subject</th>
                      <th className="py-0.2 border-r border-slate-200 w-[24%]">Date</th>
                      <th className="py-0.2 w-[30%]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalDateSheet.map((ds, idx) => (
                      <tr key={ds.id} className="border-b border-slate-100">
                        <td className="py-0.2 text-slate-500 font-bold border-r border-slate-200">{idx + 1}</td>
                        <td className="py-0.2 font-bold text-slate-900 border-r border-slate-200 text-left px-1 truncate">{cleanSubject(ds.subject)}</td>
                        <td className="py-0.2 font-semibold border-r border-slate-200">{ds.date}</td>
                        <td className="py-0.2 text-slate-700">{renderFullExamTime(ds.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signatures Row (Shown only if uploaded) */}
          {showSignaturesSection && (
            <div
              className="pt-1 border-t flex items-end justify-between text-center mt-auto"
              style={{ borderColor: `${borderCol}40` }}
            >
              {showCandidateSign && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="h-4 w-14 border-b border-slate-400 mb-0.5" />
                  <span className="font-bold text-slate-700 uppercase text-[8px]">Candidate Sign</span>
                </div>
              )}

              {showTeacherSign && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="h-4 w-14 flex items-center justify-center border-b border-slate-400 mb-0.5">
                    <img src={school.classTeacherSignatureUrl} alt="" className="h-3.5 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-bold text-slate-700 uppercase text-[8px]">Class Teacher</span>
                </div>
              )}

              {showPrincipalSignOrStamp && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="h-4 w-16 flex items-center justify-center border-b border-slate-400 mb-0.5">
                    {hasUploadedPrincipalSign && (
                      <img src={school.principalSignatureUrl} alt="" className="h-3.5 object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <span className="font-bold text-slate-900 uppercase text-[8px]">Principal / Manager</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
