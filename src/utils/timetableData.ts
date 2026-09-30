import { DateSheetItem, ClassItem } from '../types';

export const OFFICIAL_CLASSES: ClassItem[] = [
  { id: 'cls-nur', name: 'Nursery', section: 'A', classTeacher: 'Kiran Sharma', roomNo: 'Room 01' },
  { id: 'cls-lkg', name: 'LKG', section: 'A', classTeacher: 'Pooja Verma', roomNo: 'Room 02' },
  { id: 'cls-ukg', name: 'UKG', section: 'A', classTeacher: 'Sneha Pandey', roomNo: 'Room 03' },
  { id: 'cls-1', name: 'Class 1', section: 'A', classTeacher: 'Sunita Mishra', roomNo: 'Room 101' },
  { id: 'cls-2', name: 'Class 2', section: 'A', classTeacher: 'Pooja Tiwari', roomNo: 'Room 102' },
  { id: 'cls-3', name: 'Class 3', section: 'A', classTeacher: 'Rameshwar Singh', roomNo: 'Room 103' },
  { id: 'cls-4', name: 'Class 4', section: 'A', classTeacher: 'Anuradha Pandey', roomNo: 'Room 104' },
  { id: 'cls-5', name: 'Class 5', section: 'A', classTeacher: 'Kavita Verma', roomNo: 'Room 105' },
  { id: 'cls-6', name: 'Class 6', section: 'A', classTeacher: 'Sanjay Kumar', roomNo: 'Room 201' },
  { id: 'cls-7', name: 'Class 7', section: 'A', classTeacher: 'Vikas Dubey', roomNo: 'Room 202' },
  { id: 'cls-8', name: 'Class 8', section: 'A', classTeacher: 'Deepak Sharma', roomNo: 'Room 203' },
];

export const OFFICIAL_FULL_TIMETABLE: DateSheetItem[] = [
  // ==================== CLASS 1 ====================
  { id: 'ds-c1-1', examId: 'exam-annual-2026', className: 'Class 1', date: '05/10/2026', day: 'Monday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c1-2', examId: 'exam-annual-2026', className: 'Class 1', date: '06/10/2026', day: 'Tuesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c1-3', examId: 'exam-annual-2026', className: 'Class 1', date: '07/10/2026', day: 'Wednesday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c1-4', examId: 'exam-annual-2026', className: 'Class 1', date: '08/10/2026', day: 'Thursday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c1-5', examId: 'exam-annual-2026', className: 'Class 1', date: '09/10/2026', day: 'Friday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c1-6', examId: 'exam-annual-2026', className: 'Class 1', date: '12/10/2026', day: 'Monday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c1-7', examId: 'exam-annual-2026', className: 'Class 1', date: '13/10/2026', day: 'Tuesday', subject: 'Urdu', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c1-8', examId: 'exam-annual-2026', className: 'Class 1', date: '14/10/2026', day: 'Wednesday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 8 },

  // ==================== CLASS 2 ====================
  { id: 'ds-c2-1', examId: 'exam-annual-2026', className: 'Class 2', date: '05/10/2026', day: 'Monday', subject: 'English', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c2-2', examId: 'exam-annual-2026', className: 'Class 2', date: '06/10/2026', day: 'Tuesday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c2-3', examId: 'exam-annual-2026', className: 'Class 2', date: '07/10/2026', day: 'Wednesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c2-4', examId: 'exam-annual-2026', className: 'Class 2', date: '08/10/2026', day: 'Thursday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c2-5', examId: 'exam-annual-2026', className: 'Class 2', date: '09/10/2026', day: 'Friday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c2-6', examId: 'exam-annual-2026', className: 'Class 2', date: '10/10/2026', day: 'Saturday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c2-7', examId: 'exam-annual-2026', className: 'Class 2', date: '12/10/2026', day: 'Monday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c2-8', examId: 'exam-annual-2026', className: 'Class 2', date: '13/10/2026', day: 'Tuesday', subject: 'Urdu', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c2-9', examId: 'exam-annual-2026', className: 'Class 2', date: '14/10/2026', day: 'Wednesday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 9 },

  // ==================== CLASS 3 ====================
  { id: 'ds-c3-1', examId: 'exam-annual-2026', className: 'Class 3', date: '05/10/2026', day: 'Monday', subject: 'Hindi', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c3-2', examId: 'exam-annual-2026', className: 'Class 3', date: '06/10/2026', day: 'Tuesday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c3-3', examId: 'exam-annual-2026', className: 'Class 3', date: '07/10/2026', day: 'Wednesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c3-4', examId: 'exam-annual-2026', className: 'Class 3', date: '08/10/2026', day: 'Thursday', subject: 'Computer', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c3-5', examId: 'exam-annual-2026', className: 'Class 3', date: '09/10/2026', day: 'Friday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c3-6', examId: 'exam-annual-2026', className: 'Class 3', date: '10/10/2026', day: 'Saturday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c3-7', examId: 'exam-annual-2026', className: 'Class 3', date: '12/10/2026', day: 'Monday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c3-8', examId: 'exam-annual-2026', className: 'Class 3', date: '13/10/2026', day: 'Tuesday', subject: 'Urdu', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c3-9', examId: 'exam-annual-2026', className: 'Class 3', date: '14/10/2026', day: 'Wednesday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 9 },

  // ==================== CLASS 4 ====================
  { id: 'ds-c4-1', examId: 'exam-annual-2026', className: 'Class 4', date: '05/10/2026', day: 'Monday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c4-2', examId: 'exam-annual-2026', className: 'Class 4', date: '06/10/2026', day: 'Tuesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c4-3', examId: 'exam-annual-2026', className: 'Class 4', date: '07/10/2026', day: 'Wednesday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c4-4', examId: 'exam-annual-2026', className: 'Class 4', date: '08/10/2026', day: 'Thursday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c4-5', examId: 'exam-annual-2026', className: 'Class 4', date: '09/10/2026', day: 'Friday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c4-6', examId: 'exam-annual-2026', className: 'Class 4', date: '10/10/2026', day: 'Saturday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c4-7', examId: 'exam-annual-2026', className: 'Class 4', date: '12/10/2026', day: 'Monday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c4-8', examId: 'exam-annual-2026', className: 'Class 4', date: '13/10/2026', day: 'Tuesday', subject: 'Computer', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c4-9', examId: 'exam-annual-2026', className: 'Class 4', date: '14/10/2026', day: 'Wednesday', subject: 'Urdu', time: '09:00 AM – 12:00 PM', order: 9 },
  { id: 'ds-c4-10', examId: 'exam-annual-2026', className: 'Class 4', date: '15/10/2026', day: 'Thursday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 10 },

  // ==================== CLASS 5 ====================
  { id: 'ds-c5-1', examId: 'exam-annual-2026', className: 'Class 5', date: '05/10/2026', day: 'Monday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c5-2', examId: 'exam-annual-2026', className: 'Class 5', date: '06/10/2026', day: 'Tuesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c5-3', examId: 'exam-annual-2026', className: 'Class 5', date: '07/10/2026', day: 'Wednesday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c5-4', examId: 'exam-annual-2026', className: 'Class 5', date: '08/10/2026', day: 'Thursday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c5-5', examId: 'exam-annual-2026', className: 'Class 5', date: '09/10/2026', day: 'Friday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c5-6', examId: 'exam-annual-2026', className: 'Class 5', date: '10/10/2026', day: 'Saturday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c5-7', examId: 'exam-annual-2026', className: 'Class 5', date: '12/10/2026', day: 'Monday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c5-8', examId: 'exam-annual-2026', className: 'Class 5', date: '13/10/2026', day: 'Tuesday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c5-9', examId: 'exam-annual-2026', className: 'Class 5', date: '14/10/2026', day: 'Wednesday', subject: 'Urdu', time: '09:00 AM – 12:00 PM', order: 9 },
  { id: 'ds-c5-10', examId: 'exam-annual-2026', className: 'Class 5', date: '15/10/2026', day: 'Thursday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 10 },

  // ==================== CLASS 6 ====================
  { id: 'ds-c6-1', examId: 'exam-annual-2026', className: 'Class 6', date: '05/10/2026', day: 'Monday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c6-2', examId: 'exam-annual-2026', className: 'Class 6', date: '06/10/2026', day: 'Tuesday', subject: 'Computer', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c6-3', examId: 'exam-annual-2026', className: 'Class 6', date: '07/10/2026', day: 'Wednesday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c6-4', examId: 'exam-annual-2026', className: 'Class 6', date: '08/10/2026', day: 'Thursday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c6-5', examId: 'exam-annual-2026', className: 'Class 6', date: '09/10/2026', day: 'Friday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c6-6', examId: 'exam-annual-2026', className: 'Class 6', date: '10/10/2026', day: 'Saturday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c6-7', examId: 'exam-annual-2026', className: 'Class 6', date: '12/10/2026', day: 'Monday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c6-8', examId: 'exam-annual-2026', className: 'Class 6', date: '13/10/2026', day: 'Tuesday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c6-9', examId: 'exam-annual-2026', className: 'Class 6', date: '14/10/2026', day: 'Wednesday', subject: 'Urdu / Sanskrit', time: '09:00 AM – 12:00 PM', order: 9 },
  { id: 'ds-c6-10', examId: 'exam-annual-2026', className: 'Class 6', date: '15/10/2026', day: 'Thursday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 10 },

  // ==================== CLASS 7 ====================
  { id: 'ds-c7-1', examId: 'exam-annual-2026', className: 'Class 7', date: '05/10/2026', day: 'Monday', subject: 'Computer', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c7-2', examId: 'exam-annual-2026', className: 'Class 7', date: '06/10/2026', day: 'Tuesday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c7-3', examId: 'exam-annual-2026', className: 'Class 7', date: '07/10/2026', day: 'Wednesday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c7-4', examId: 'exam-annual-2026', className: 'Class 7', date: '08/10/2026', day: 'Thursday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c7-5', examId: 'exam-annual-2026', className: 'Class 7', date: '09/10/2026', day: 'Friday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c7-6', examId: 'exam-annual-2026', className: 'Class 7', date: '10/10/2026', day: 'Saturday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c7-7', examId: 'exam-annual-2026', className: 'Class 7', date: '12/10/2026', day: 'Monday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c7-8', examId: 'exam-annual-2026', className: 'Class 7', date: '13/10/2026', day: 'Tuesday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c7-9', examId: 'exam-annual-2026', className: 'Class 7', date: '14/10/2026', day: 'Wednesday', subject: 'Urdu / Sanskrit', time: '09:00 AM – 12:00 PM', order: 9 },
  { id: 'ds-c7-10', examId: 'exam-annual-2026', className: 'Class 7', date: '15/10/2026', day: 'Thursday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 10 },

  // ==================== CLASS 8 ====================
  { id: 'ds-c8-1', examId: 'exam-annual-2026', className: 'Class 8', date: '05/10/2026', day: 'Monday', subject: 'Math', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-c8-2', examId: 'exam-annual-2026', className: 'Class 8', date: '06/10/2026', day: 'Tuesday', subject: 'English I', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-c8-3', examId: 'exam-annual-2026', className: 'Class 8', date: '07/10/2026', day: 'Wednesday', subject: 'English II', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-c8-4', examId: 'exam-annual-2026', className: 'Class 8', date: '08/10/2026', day: 'Thursday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-c8-5', examId: 'exam-annual-2026', className: 'Class 8', date: '09/10/2026', day: 'Friday', subject: 'Hindi II', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-c8-6', examId: 'exam-annual-2026', className: 'Class 8', date: '10/10/2026', day: 'Saturday', subject: 'Computer', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-c8-7', examId: 'exam-annual-2026', className: 'Class 8', date: '12/10/2026', day: 'Monday', subject: 'Science', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-c8-8', examId: 'exam-annual-2026', className: 'Class 8', date: '13/10/2026', day: 'Tuesday', subject: 'Hindi I', time: '09:00 AM – 12:00 PM', order: 8 },
  { id: 'ds-c8-9', examId: 'exam-annual-2026', className: 'Class 8', date: '14/10/2026', day: 'Wednesday', subject: 'Urdu / Sanskrit', time: '09:00 AM – 12:00 PM', order: 9 },
  { id: 'ds-c8-10', examId: 'exam-annual-2026', className: 'Class 8', date: '15/10/2026', day: 'Thursday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 10 },

  // ==================== NURSERY ====================
  { id: 'ds-nur-1', examId: 'exam-annual-2026', className: 'Nursery', date: '05/10/2026', day: 'Monday', subject: 'Math Writing', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-nur-2', examId: 'exam-annual-2026', className: 'Nursery', date: '06/10/2026', day: 'Tuesday', subject: 'Math oral', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-nur-3', examId: 'exam-annual-2026', className: 'Nursery', date: '07/10/2026', day: 'Wednesday', subject: 'English Writing', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-nur-4', examId: 'exam-annual-2026', className: 'Nursery', date: '08/10/2026', day: 'Thursday', subject: 'English oral', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-nur-5', examId: 'exam-annual-2026', className: 'Nursery', date: '09/10/2026', day: 'Friday', subject: 'Hindi Writing', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-nur-6', examId: 'exam-annual-2026', className: 'Nursery', date: '10/10/2026', day: 'Saturday', subject: 'Hindi oral', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-nur-7', examId: 'exam-annual-2026', className: 'Nursery', date: '12/10/2026', day: 'Monday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 7 },

  // ==================== LKG ====================
  { id: 'ds-lkg-1', examId: 'exam-annual-2026', className: 'LKG', date: '05/10/2026', day: 'Monday', subject: 'Hindi Writing', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-lkg-2', examId: 'exam-annual-2026', className: 'LKG', date: '06/10/2026', day: 'Tuesday', subject: 'Hindi oral', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-lkg-3', examId: 'exam-annual-2026', className: 'LKG', date: '07/10/2026', day: 'Wednesday', subject: 'English Writing', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-lkg-4', examId: 'exam-annual-2026', className: 'LKG', date: '08/10/2026', day: 'Thursday', subject: 'English oral', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-lkg-5', examId: 'exam-annual-2026', className: 'LKG', date: '09/10/2026', day: 'Friday', subject: 'Math Writing', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-lkg-6', examId: 'exam-annual-2026', className: 'LKG', date: '10/10/2026', day: 'Saturday', subject: 'Math oral', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-lkg-7', examId: 'exam-annual-2026', className: 'LKG', date: '12/10/2026', day: 'Monday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 7 },

  // ==================== UKG ====================
  { id: 'ds-ukg-1', examId: 'exam-annual-2026', className: 'UKG', date: '05/10/2026', day: 'Monday', subject: 'English Writing', time: '09:00 AM – 12:00 PM', order: 1 },
  { id: 'ds-ukg-2', examId: 'exam-annual-2026', className: 'UKG', date: '06/10/2026', day: 'Tuesday', subject: 'Math oral', time: '09:00 AM – 12:00 PM', order: 2 },
  { id: 'ds-ukg-3', examId: 'exam-annual-2026', className: 'UKG', date: '07/10/2026', day: 'Wednesday', subject: 'Hindi Writing', time: '09:00 AM – 12:00 PM', order: 3 },
  { id: 'ds-ukg-4', examId: 'exam-annual-2026', className: 'UKG', date: '08/10/2026', day: 'Thursday', subject: 'Hindi oral', time: '09:00 AM – 12:00 PM', order: 4 },
  { id: 'ds-ukg-5', examId: 'exam-annual-2026', className: 'UKG', date: '09/10/2026', day: 'Friday', subject: 'Math Writing', time: '09:00 AM – 12:00 PM', order: 5 },
  { id: 'ds-ukg-6', examId: 'exam-annual-2026', className: 'UKG', date: '10/10/2026', day: 'Saturday', subject: 'Math oral', time: '09:00 AM – 12:00 PM', order: 6 },
  { id: 'ds-ukg-7', examId: 'exam-annual-2026', className: 'UKG', date: '12/10/2026', day: 'Monday', subject: 'S.ST', time: '09:00 AM – 12:00 PM', order: 7 },
  { id: 'ds-ukg-8', examId: 'exam-annual-2026', className: 'UKG', date: '13/10/2026', day: 'Tuesday', subject: 'Drawing', time: '09:00 AM – 12:00 PM', order: 8 },
];
