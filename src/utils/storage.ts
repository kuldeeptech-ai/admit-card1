import {
  Student,
  SchoolSettings,
  DesignSettings,
  FieldVisibility,
  SectionConfig,
  ClassItem,
  Examination,
  DateSheetItem,
  InstructionItem,
  CustomField,
  PrintSettings,
  UserSession,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_SCHOOL_SETTINGS,
  INITIAL_DESIGN_SETTINGS,
  INITIAL_FIELD_VISIBILITY,
  INITIAL_SECTIONS,
  INITIAL_CLASSES,
  INITIAL_EXAMINATIONS,
  INITIAL_DATE_SHEET,
  INITIAL_INSTRUCTIONS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_PRINT_SETTINGS,
} from './defaultData';

const KEYS = {
  STUDENTS: 'hdp_admit_students_v2',
  SCHOOL: 'hdp_admit_school_v2',
  DESIGN: 'hdp_admit_design_v2',
  TEMPLATES: 'hdp_admit_saved_templates_v2',
  VISIBILITY: 'hdp_admit_visibility_v2',
  SECTIONS: 'hdp_admit_sections_v2',
  CLASSES: 'hdp_admit_classes_v2',
  EXAMINATIONS: 'hdp_admit_examinations_v2',
  ACTIVE_EXAM_ID: 'hdp_admit_active_exam_id_v2',
  DATE_SHEET: 'hdp_admit_date_sheet_v2',
  INSTRUCTIONS: 'hdp_admit_instructions_v2',
  CUSTOM_FIELDS: 'hdp_admit_custom_fields_v2',
  PRINT_SETTINGS: 'hdp_admit_print_settings_v2',
  USER_SESSION: 'hdp_admit_user_session_v2',
};

export const StorageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  setStudents(students: Student[]): void {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getClasses(): ClassItem[] {
    try {
      const data = localStorage.getItem(KEYS.CLASSES);
      return data ? JSON.parse(data) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  },

  setClasses(classes: ClassItem[]): void {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  },

  getExaminations(): Examination[] {
    try {
      const data = localStorage.getItem(KEYS.EXAMINATIONS);
      return data ? JSON.parse(data) : INITIAL_EXAMINATIONS;
    } catch {
      return INITIAL_EXAMINATIONS;
    }
  },

  setExaminations(examinations: Examination[]): void {
    localStorage.setItem(KEYS.EXAMINATIONS, JSON.stringify(examinations));
  },

  getActiveExamId(): string {
    return localStorage.getItem(KEYS.ACTIVE_EXAM_ID) || INITIAL_EXAMINATIONS[0]?.id || '';
  },

  setActiveExamId(id: string): void {
    localStorage.setItem(KEYS.ACTIVE_EXAM_ID, id);
  },

  getDateSheet(): DateSheetItem[] {
    try {
      const data = localStorage.getItem(KEYS.DATE_SHEET);
      return data ? JSON.parse(data) : INITIAL_DATE_SHEET;
    } catch {
      return INITIAL_DATE_SHEET;
    }
  },

  setDateSheet(dateSheet: DateSheetItem[]): void {
    localStorage.setItem(KEYS.DATE_SHEET, JSON.stringify(dateSheet));
  },

  getInstructions(): InstructionItem[] {
    try {
      const data = localStorage.getItem(KEYS.INSTRUCTIONS);
      return data ? JSON.parse(data) : INITIAL_INSTRUCTIONS;
    } catch {
      return INITIAL_INSTRUCTIONS;
    }
  },

  setInstructions(instructions: InstructionItem[]): void {
    localStorage.setItem(KEYS.INSTRUCTIONS, JSON.stringify(instructions));
  },

  getCustomFields(): CustomField[] {
    try {
      const data = localStorage.getItem(KEYS.CUSTOM_FIELDS);
      return data ? JSON.parse(data) : INITIAL_CUSTOM_FIELDS;
    } catch {
      return INITIAL_CUSTOM_FIELDS;
    }
  },

  setCustomFields(fields: CustomField[]): void {
    localStorage.setItem(KEYS.CUSTOM_FIELDS, JSON.stringify(fields));
  },

  getSchoolSettings(): SchoolSettings {
    try {
      const data = localStorage.getItem(KEYS.SCHOOL);
      return data ? JSON.parse(data) : INITIAL_SCHOOL_SETTINGS;
    } catch {
      return INITIAL_SCHOOL_SETTINGS;
    }
  },

  setSchoolSettings(settings: SchoolSettings): void {
    localStorage.setItem(KEYS.SCHOOL, JSON.stringify(settings));
  },

  getDesignSettings(): DesignSettings {
    try {
      const data = localStorage.getItem(KEYS.DESIGN);
      return data ? JSON.parse(data) : INITIAL_DESIGN_SETTINGS;
    } catch {
      return INITIAL_DESIGN_SETTINGS;
    }
  },

  setDesignSettings(design: DesignSettings): void {
    localStorage.setItem(KEYS.DESIGN, JSON.stringify(design));
  },

  getSavedTemplates(): DesignSettings[] {
    try {
      const data = localStorage.getItem(KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [INITIAL_DESIGN_SETTINGS];
    } catch {
      return [INITIAL_DESIGN_SETTINGS];
    }
  },

  setSavedTemplates(templates: DesignSettings[]): void {
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  },

  getFieldVisibility(): FieldVisibility {
    try {
      const data = localStorage.getItem(KEYS.VISIBILITY);
      return data ? JSON.parse(data) : INITIAL_FIELD_VISIBILITY;
    } catch {
      return INITIAL_FIELD_VISIBILITY;
    }
  },

  setFieldVisibility(visibility: FieldVisibility): void {
    localStorage.setItem(KEYS.VISIBILITY, JSON.stringify(visibility));
  },

  getSections(): SectionConfig[] {
    try {
      const data = localStorage.getItem(KEYS.SECTIONS);
      return data ? JSON.parse(data) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  },

  setSections(sections: SectionConfig[]): void {
    localStorage.setItem(KEYS.SECTIONS, JSON.stringify(sections));
  },

  getPrintSettings(): PrintSettings {
    try {
      const data = localStorage.getItem(KEYS.PRINT_SETTINGS);
      return data ? JSON.parse(data) : INITIAL_PRINT_SETTINGS;
    } catch {
      return INITIAL_PRINT_SETTINGS;
    }
  },

  setPrintSettings(settings: PrintSettings): void {
    localStorage.setItem(KEYS.PRINT_SETTINGS, JSON.stringify(settings));
  },

  getUserSession(): UserSession {
    try {
      const data = localStorage.getItem(KEYS.USER_SESSION);
      return data ? JSON.parse(data) : { username: 'Manoj Pandey', role: 'School Administrator' };
    } catch {
      return { username: 'Manoj Pandey', role: 'School Administrator' };
    }
  },

  setUserSession(session: UserSession): void {
    localStorage.setItem(KEYS.USER_SESSION, JSON.stringify(session));
  },

  exportAllBackupJSON(): string {
    const fullBackup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      school: this.getSchoolSettings(),
      students: this.getStudents(),
      classes: this.getClasses(),
      examinations: this.getExaminations(),
      activeExamId: this.getActiveExamId(),
      dateSheet: this.getDateSheet(),
      instructions: this.getInstructions(),
      customFields: this.getCustomFields(),
      design: this.getDesignSettings(),
      savedTemplates: this.getSavedTemplates(),
      visibility: this.getFieldVisibility(),
      sections: this.getSections(),
      printSettings: this.getPrintSettings(),
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.students) this.setStudents(data.students);
      if (data.school) this.setSchoolSettings(data.school);
      if (data.classes) this.setClasses(data.classes);
      if (data.examinations) this.setExaminations(data.examinations);
      if (data.activeExamId) this.setActiveExamId(data.activeExamId);
      if (data.dateSheet) this.setDateSheet(data.dateSheet);
      if (data.instructions) this.setInstructions(data.instructions);
      if (data.customFields) this.setCustomFields(data.customFields);
      if (data.design) this.setDesignSettings(data.design);
      if (data.savedTemplates) this.setSavedTemplates(data.savedTemplates);
      if (data.visibility) this.setFieldVisibility(data.visibility);
      if (data.sections) this.setSections(data.sections);
      if (data.printSettings) this.setPrintSettings(data.printSettings);
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  },

  resetAllData(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
