import { Student } from '../types';
import { DEFAULT_STUDENT_AVATARS } from './defaultData';

export interface ExcelParseResult {
  students: Student[];
  headersFound: string[];
  errors: string[];
}

// Normalize various class representations (e.g., "5", "5th", "Class 5", "V", "class 8th")
export function normalizeClassName(rawClass: string): string {
  if (!rawClass) return 'Class 1';
  const trimmed = rawClass.trim();
  const lower = trimmed.toLowerCase();

  // Roman numeral mappings
  const romanMap: Record<string, string> = {
    'i': 'Class 1',
    'ii': 'Class 2',
    'iii': 'Class 3',
    'iv': 'Class 4',
    'v': 'Class 5',
    'vi': 'Class 6',
    'vii': 'Class 7',
    'viii': 'Class 8',
    'ix': 'Class 9',
    'x': 'Class 10',
    'xi': 'Class 11',
    'xii': 'Class 12',
  };
  if (romanMap[lower]) return romanMap[lower];

  // Check kindergarten
  if (lower === 'nursery' || lower === 'nur') return 'Nursery';
  if (lower === 'lkg') return 'LKG';
  if (lower === 'ukg') return 'UKG';
  if (lower === 'prep') return 'Prep';

  // Extract number from "Class 5th", "5th", "8", "class-8", etc.
  const match = trimmed.match(/\b([1-9]|1[0-2])(?:\s*(?:st|nd|rd|th))?\b/i);
  if (match) {
    return `Class ${match[1]}`;
  }

  // If already properly capitalized e.g. "Class 8"
  if (/^class\s+/i.test(trimmed)) {
    const after = trimmed.replace(/^class\s+/i, '').trim();
    return `Class ${after}`;
  }

  return trimmed;
}

export function parseExcelPastedText(
  pastedText: string,
  fallbackClass = 'Class 1',
  fallbackSection = 'A',
  admitCardPrefix = 'HDP/2026/'
): ExcelParseResult {
  const result: ExcelParseResult = {
    students: [],
    headersFound: [],
    errors: [],
  };

  const rawLines = pastedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    result.errors.push('No text provided to parse.');
    return result;
  }

  // Detect delimiter: tab (\t), comma (,), semicolon (;), or pipe (|)
  const firstLine = rawLines[0];
  let delimiter = '\t';
  if (!firstLine.includes('\t')) {
    if (firstLine.includes(',')) delimiter = ',';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes('|')) delimiter = '|';
  }

  const splitRow = (row: string) => {
    if (delimiter === '\t') {
      return row.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    }
    return row.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  };

  const firstRowCells = splitRow(firstLine);

  // Check if first row looks like a header row
  const isHeaderRow = firstRowCells.some((c) => {
    const lower = c.toLowerCase();
    return (
      lower.includes('name') ||
      lower.includes('roll') ||
      lower.includes('class') ||
      lower.includes('std') ||
      lower.includes('grade') ||
      lower.includes('adm') ||
      lower.includes('पिता') ||
      lower.includes('नाम') ||
      lower.includes('कक्षा')
    );
  });

  let colMap = {
    roll: -1,
    name: -1,
    father: -1,
    mother: -1,
    class: -1,
    section: -1,
    adm: -1,
    dob: -1,
    gender: -1,
    mobile: -1,
    address: -1,
    cardNo: -1,
  };

  let startIndex = 0;

  if (isHeaderRow) {
    startIndex = 1;
    result.headersFound = firstRowCells;
    firstRowCells.forEach((cell, idx) => {
      const h = cell.toLowerCase().trim();
      if (h.includes('roll') || h.includes('अनुक्रमांक') || h.includes('रोल') || h.includes('sr no') || h.includes('s.n.') || h === 'sr' || h === 'sno') {
        if (colMap.roll === -1) colMap.roll = idx;
      } else if (
        (h.includes('name') && !h.includes('father') && !h.includes('mother')) ||
        (h.includes('नाम') && !h.includes('पिता') && !h.includes('माता')) ||
        h.includes('student') ||
        h.includes('candidate')
      ) {
        if (colMap.name === -1) colMap.name = idx;
      } else if (h.includes('father') || h.includes('पिता')) {
        colMap.father = idx;
      } else if (h.includes('mother') || h.includes('माता')) {
        colMap.mother = idx;
      } else if (h.includes('class') || h.includes('कक्षा') || h.includes('standard') || h === 'std' || h === 'grade') {
        colMap.class = idx;
      } else if (h.includes('sec') || h.includes('वर्ग') || h.includes('सेक्शन')) {
        colMap.section = idx;
      } else if (h.includes('adm') || h.includes('प्रवेश') || h.includes('s.r.') || h.includes('reg')) {
        colMap.adm = idx;
      } else if (h.includes('dob') || h.includes('birth') || h.includes('जन्म')) {
        colMap.dob = idx;
      } else if (h.includes('gender') || h.includes('sex') || h.includes('लिंग')) {
        colMap.gender = idx;
      } else if (h.includes('mobile') || h.includes('phone') || h.includes('contact') || h.includes('मोबाइल')) {
        colMap.mobile = idx;
      } else if (h.includes('addr') || h.includes('पता') || h.includes('ग्राम')) {
        colMap.address = idx;
      } else if (h.includes('admit') || h.includes('card') || h.includes('प्रवेश पत्र')) {
        colMap.cardNo = idx;
      }
    });
  } else {
    // Positional assumption if no header row
    const looksNumeric = /^\d+$/.test(firstRowCells[0]);
    if (looksNumeric) {
      colMap.roll = 0;
      colMap.name = 1;
      colMap.father = 2;
      colMap.mother = 3;
      colMap.class = 4;
      colMap.adm = 5;
    } else {
      colMap.name = 0;
      colMap.father = 1;
      colMap.mother = 2;
      colMap.class = 3;
      colMap.roll = 4;
    }
  }

  // Parse student records row by row
  for (let i = startIndex; i < rawLines.length; i++) {
    const cells = splitRow(rawLines[i]);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    const studentName = colMap.name >= 0 && cells[colMap.name] ? cells[colMap.name] : cells[0] || '';
    if (!studentName.trim()) continue;

    // Detect class for this specific student row
    let rawRowClass = '';
    if (colMap.class >= 0 && cells[colMap.class]) {
      rawRowClass = cells[colMap.class].trim();
    } else {
      // Try to scan cells in this row for class keywords like "Class 5", "5th", "Class 8", etc.
      for (const c of cells) {
        if (/^(class\s+[0-9a-zA-Z]+|[1-9](st|nd|rd|th)?|1[0-2](th)?|lkg|ukg|nursery)$/i.test(c.trim())) {
          rawRowClass = c.trim();
          break;
        }
      }
    }

    const assignedClass = rawRowClass ? normalizeClassName(rawRowClass) : (fallbackClass === 'auto' ? 'Class 1' : fallbackClass);

    const rollNo = colMap.roll >= 0 && cells[colMap.roll] ? cells[colMap.roll] : String(i - startIndex + 1);
    const father = colMap.father >= 0 && cells[colMap.father] ? cells[colMap.father] : '';
    const mother = colMap.mother >= 0 && cells[colMap.mother] ? cells[colMap.mother] : '';
    const section = colMap.section >= 0 && cells[colMap.section] ? cells[colMap.section] : fallbackSection;
    const classNum = assignedClass.replace(/[^0-9]/g, '') || '1';
    const adm = colMap.adm >= 0 && cells[colMap.adm] ? cells[colMap.adm] : `HDP-2026-${classNum}${String(rollNo).padStart(2, '0')}`;
    const dob = colMap.dob >= 0 && cells[colMap.dob] ? cells[colMap.dob] : '2014-01-01';
    const rawGender = colMap.gender >= 0 && cells[colMap.gender] ? cells[colMap.gender].toLowerCase() : 'male';
    const gender: 'Male' | 'Female' | 'Other' = rawGender.includes('f') || rawGender.includes('female') || rawGender.includes('महिला') ? 'Female' : 'Male';
    const mobile = colMap.mobile >= 0 && cells[colMap.mobile] ? cells[colMap.mobile] : '';
    const address = colMap.address >= 0 && cells[colMap.address] ? cells[colMap.address] : 'Baurbyas, Mehdawal, SKN';
    const cardNo = colMap.cardNo >= 0 && cells[colMap.cardNo] ? cells[colMap.cardNo] : `${admitCardPrefix}${classNum.padStart(2, '0')}${String(rollNo).padStart(2, '0')}`;

    result.students.push({
      id: `std-excel-${Date.now()}-${i}`,
      name: studentName.trim(),
      fatherName: father.trim(),
      motherName: mother.trim(),
      className: assignedClass,
      section: section.trim() || 'A',
      rollNumber: rollNo.trim(),
      admissionNumber: adm.trim(),
      dob: dob.trim(),
      gender,
      parentMobile: mobile.trim(),
      studentMobile: mobile.trim(),
      address: address.trim(),
      photoUrl: DEFAULT_STUDENT_AVATARS[(i - startIndex) % DEFAULT_STUDENT_AVATARS.length],
      studentId: `STD-${100 + i}`,
      admitCardNumber: cardNo.trim(),
      isGenerated: true,
    });
  }

  return result;
}

export function generateSampleExcelText(): string {
  return [
    ['Roll No', 'Student Name', "Father's Name", "Mother's Name", 'Class', 'Section', 'Admission No', 'DOB', 'Mobile'],
    ['01', 'Aarav Pandey', 'Rajesh Pandey', 'Sunita Pandey', 'Class 8', 'A', 'HDP-2021-081', '2012-04-14', '9838767297'],
    ['02', 'Priya Sharma', 'Dinesh Sharma', 'Meena Sharma', 'Class 8', 'A', 'HDP-2021-082', '2012-08-20', '9838767298'],
    ['01', 'Shivam Tiwari', 'Mahesh Tiwari', 'Geeta Tiwari', 'Class 7', 'A', 'HDP-2022-071', '2013-05-18', '9838767301'],
    ['01', 'Aditya Yadav', 'Ramakant Yadav', 'Shanti Devi', 'Class 6', 'A', 'HDP-2023-061', '2014-02-11', '9838767303'],
    ['01', 'Mohit Chaurasia', 'Santosh Chaurasia', 'Usha Chaurasia', 'Class 5', 'A', 'HDP-2024-051', '2015-03-25', '9838767305'],
  ]
    .map((r) => r.join('\t'))
    .join('\n');
}
