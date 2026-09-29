import { Student } from '../types';
import { DEFAULT_STUDENT_AVATARS } from './defaultData';

export function exportStudentsToCSV(students: Student[]): string {
  const headers = [
    'Roll Number',
    'Student Name',
    'Father Name',
    'Mother Name',
    'Class',
    'Section',
    'Admission Number',
    'DOB',
    'Gender',
    'Mobile',
    'Address',
    'Admit Card Number',
    'Status',
  ];

  const rows = students.map((s) => [
    `"${s.rollNumber || ''}"`,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.fatherName || '').replace(/"/g, '""')}"`,
    `"${(s.motherName || '').replace(/"/g, '""')}"`,
    `"${s.className || ''}"`,
    `"${s.section || ''}"`,
    `"${s.admissionNumber || ''}"`,
    `"${s.dob || ''}"`,
    `"${s.gender || 'Male'}"`,
    `"${s.parentMobile || ''}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    `"${s.admitCardNumber || ''}"`,
    `"${s.isGenerated ? 'Generated' : 'Pending'}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generateSampleCSV(): string {
  const headers = [
    'Roll Number',
    'Student Name',
    'Father Name',
    'Mother Name',
    'Class',
    'Section',
    'Admission Number',
    'DOB',
    'Gender',
    'Mobile',
    'Address',
  ];

  const sampleRows = [
    ['01', 'Aarav Pandey', 'Rajesh Pandey', 'Sunita Pandey', 'Class 8', 'A', 'HDP-2021-081', '2012-04-14', 'Male', '9838767297', 'Baurbyas, Mehdawal'],
    ['02', 'Priya Sharma', 'Dinesh Sharma', 'Meena Sharma', 'Class 8', 'A', 'HDP-2021-082', '2012-08-20', 'Female', '9838767298', 'Mehdawal Road, SKN'],
    ['03', 'Rohit Verma', 'Satish Verma', 'Kiran Verma', 'Class 8', 'A', 'HDP-2021-083', '2012-01-10', 'Male', '9838767299', 'Baurbyas Village'],
    ['01', 'Shivam Tiwari', 'Mahesh Tiwari', 'Geeta Tiwari', 'Class 7', 'A', 'HDP-2022-071', '2013-05-18', 'Male', '9838767301', 'Baurbyas Bazar'],
    ['01', 'Vivaan Mishra', 'Suresh Mishra', 'Poonam Mishra', 'Class 1', 'A', 'HDP-2026-011', '2019-06-15', 'Male', '9838767307', 'Dubey Tola, Baurbyas'],
  ];

  return [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
}

export function importStudentsFromCSV(csvText: string, targetClass?: string): Student[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Parse header row
  const headerTokens = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Find column indexes
  const colIndex = {
    roll: headerTokens.findIndex((h) => h.includes('roll') || h.includes('अनुक्रमांक') || h.includes('रोल')),
    name: headerTokens.findIndex((h) => h.includes('name') && !h.includes('father') && !h.includes('mother') || h.includes('नाम') && !h.includes('पिता') && !h.includes('माता')),
    father: headerTokens.findIndex((h) => h.includes('father') || h.includes('पिता')),
    mother: headerTokens.findIndex((h) => h.includes('mother') || h.includes('माता')),
    class: headerTokens.findIndex((h) => h.includes('class') || h.includes('कक्षा')),
    section: headerTokens.findIndex((h) => h.includes('sec') || h.includes('वर्ग') || h.includes('सेक्शन')),
    adm: headerTokens.findIndex((h) => h.includes('adm') || h.includes('प्रवेश') || h.includes('sr')),
    dob: headerTokens.findIndex((h) => h.includes('dob') || h.includes('birth') || h.includes('जन्म')),
    gender: headerTokens.findIndex((h) => h.includes('gender') || h.includes('sex') || h.includes('लिंग')),
    mobile: headerTokens.findIndex((h) => h.includes('mob') || h.includes('phone') || h.includes('contact') || h.includes('मोबाइल')),
    address: headerTokens.findIndex((h) => h.includes('addr') || h.includes('पता') || h.includes('ग्राम')),
    cardNo: headerTokens.findIndex((h) => h.includes('card') || h.includes('admit') || h.includes('प्रवेश पत्र')),
  };

  const students: Student[] = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = parseCsvLine(lines[i]);
    if (tokens.length === 0) continue;

    const name = colIndex.name >= 0 ? tokens[colIndex.name] : tokens[1] || '';
    if (!name.trim()) continue;

    const roll = colIndex.roll >= 0 && tokens[colIndex.roll] ? tokens[colIndex.roll] : String(i);
    const father = colIndex.father >= 0 ? tokens[colIndex.father] : '';
    const mother = colIndex.mother >= 0 ? tokens[colIndex.mother] : '';
    const cls = targetClass && targetClass !== 'all' ? targetClass : (colIndex.class >= 0 && tokens[colIndex.class] ? tokens[colIndex.class] : 'Class 1');
    const sec = colIndex.section >= 0 && tokens[colIndex.section] ? tokens[colIndex.section] : 'A';
    const adm = colIndex.adm >= 0 && tokens[colIndex.adm] ? tokens[colIndex.adm] : `HDP-ADM-${100 + i}`;
    const dob = colIndex.dob >= 0 ? tokens[colIndex.dob] : '2014-01-01';
    const rawGender = colIndex.gender >= 0 ? tokens[colIndex.gender]?.toLowerCase() : 'male';
    const gender: 'Male' | 'Female' | 'Other' = rawGender.includes('f') || rawGender.includes('महिला') ? 'Female' : 'Male';
    const mobile = colIndex.mobile >= 0 ? tokens[colIndex.mobile] : '';
    const addr = colIndex.address >= 0 ? tokens[colIndex.address] : 'Baurbyas, SKN';
    const cardNo = colIndex.cardNo >= 0 && tokens[colIndex.cardNo] ? tokens[colIndex.cardNo] : `HDP/2026/${String(i).padStart(4, '0')}`;

    students.push({
      id: `std-imp-${Date.now()}-${i}`,
      name: name.trim(),
      fatherName: father.trim(),
      motherName: mother.trim(),
      className: cls.trim(),
      section: sec.trim() || 'A',
      rollNumber: roll.trim(),
      admissionNumber: adm.trim(),
      dob: dob.trim(),
      gender,
      parentMobile: mobile.trim(),
      studentMobile: mobile.trim(),
      address: addr.trim(),
      photoUrl: DEFAULT_STUDENT_AVATARS[i % DEFAULT_STUDENT_AVATARS.length],
      studentId: `STD-${100 + i}`,
      admitCardNumber: cardNo.trim(),
      isGenerated: true,
    });
  }

  return students;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function downloadCSV(csvContent: string, fileName = 'students.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
