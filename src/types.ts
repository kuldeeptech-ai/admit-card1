export interface Student {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  rollNumber: string;
  admissionNumber: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  studentMobile?: string;
  parentMobile?: string;
  address?: string;
  photoUrl: string;
  studentId?: string;
  admitCardNumber: string;
  isGenerated: boolean;
  generatedDate?: string;
  customFieldValues?: Record<string, string>;
}

export interface ClassItem {
  id: string;
  name: string;
  section: string;
  classTeacher?: string;
  roomNo?: string;
}

export interface Examination {
  id: string;
  name: string;
  academicSession: string;
  startDate: string;
  endDate: string;
  reportingTime: string;
  examStartTime: string;
  examEndTime: string;
  examinationCentre: string;
  instructionsTitle: string;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Draft';
}

export interface DateSheetItem {
  id: string;
  examId?: string;
  className?: string; // Optional: can be common to all or class-specific
  date: string;
  day: string;
  subject: string;
  time?: string;
  room?: string;
  code?: string;
  order: number;
}

export interface InstructionItem {
  id: string;
  text: string;
  isActive: boolean;
  order: number;
}

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  defaultValue?: string;
  showOnCard: boolean;
  position: 'student_info' | 'footer';
}

export interface SchoolSettings {
  name: string;
  address: string;
  managedBy: string;
  affiliationNo?: string;
  mobile: string;
  email?: string;
  website?: string;
  logoUrl: string;
  principalName: string;
  principalSignatureUrl: string;
  classTeacherSignatureUrl: string;
  stampUrl: string;
  admitCardNumberPrefix: string;
  academicSession: string;
}

export interface DesignSettings {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderStyle: 'double' | 'solid' | 'groove';
  borderWidth: number;
  headerBgColor: string;
  headerTextColor: string;
  watermark: boolean;
  watermarkOpacity: number;
  fontFamily: 'sans' | 'serif' | 'cinzel' | 'mono' | 'roboto';
  fontSize: 'compact' | 'standard' | 'large' | 'extralarge';
  headingSize: number;
  studentNameSize: number;
  padding: number;
  sectionSpacing: number;
  qrSize: number;
  logoSize: number;
  photoWidth: number;
  photoHeight: number;
  cornerDecorations?: boolean;
  showSecurityBarcode?: boolean;
  showInvigilatorSignBox?: boolean;
  timeTableLayout?: 'horizontal' | 'vertical';
}

export interface FieldVisibility {
  schoolLogo: boolean;
  schoolName: boolean;
  schoolAddress: boolean;
  schoolManagedBy: boolean;
  schoolMobile: boolean;
  examTitle: boolean;
  examName: boolean;
  academicSession: boolean;
  admitCardNumber: boolean;
  studentPhoto: boolean;
  studentName: boolean;
  fatherName: boolean;
  motherName: boolean;
  className: boolean;
  section: boolean;
  rollNumber: boolean;
  admissionNumber: boolean;
  dob: boolean;
  gender: boolean;
  dateSheet: boolean;
  instructions: boolean;
  studentSignature: boolean;
  classTeacherSignature: boolean;
  principalSignature: boolean;
  schoolStamp: boolean;
  qrCode: boolean;
}

export interface SectionConfig {
  id: string;
  name: string;
  order: number;
  visible: boolean;
}

export interface PrintSettings {
  layout: 'landscape_2' | 'portrait_4' | 'single';
  orientation: 'portrait' | 'landscape';
  cardsPerPage: number;
  showCuttingLine: boolean;
  cuttingLineStyle: 'dashed' | 'dotted' | 'solid';
  cuttingLineColor: string;
  cardWidthMm: number;
  cardHeightMm: number;
}

export interface UserSession {
  username: string;
  role: string;
}
