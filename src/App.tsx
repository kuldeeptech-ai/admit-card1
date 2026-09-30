import React, { useState, useEffect } from 'react';
import {
  Student,
  SchoolSettings,
  DesignSettings,
  FieldVisibility,
  SectionConfig,
  CustomField,
  ClassItem,
  Examination,
  DateSheetItem,
  InstructionItem,
  PrintSettings,
  UserSession,
} from './types';
import { StorageService } from './utils/storage';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentManager, findDuplicateStudent, normalizeClassName, sortStudentsByRollNumber } from './components/StudentManager';
import { ClassManager } from './components/ClassManager';
import { ExamManager } from './components/ExamManager';
import { Designer } from './components/Designer';
import { DateSheetManager } from './components/DateSheetManager';
import { InstructionsManager } from './components/InstructionsManager';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { PrintPreviewView } from './components/PrintPreviewView';
import { ImportExportView } from './components/ImportExportView';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { INITIAL_DATE_SHEET } from './utils/defaultData';
import {
  subscribeToAuth,
  logoutUser,
  fetchStudentsFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  syncBatchStudentsToFirestore,
  fetchSchoolSettingsFromFirestore,
  saveSchoolSettingsToFirestore,
  fetchClassesFromFirestore,
  saveClassToFirestore,
  deleteClassFromFirestore,
  fetchAppSettingsFromFirestore,
  saveAppSettingsToFirestore,
  fetchExamsFromFirestore,
  saveExamToFirestore,
  deleteExamFromFirestore,
  fetchDateSheetsFromFirestore,
  saveDateSheetsToFirestore,
  fetchInstructionsFromFirestore,
  saveInstructionsToFirestore,
} from './utils/firebaseSync';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Core Application State (strictly sorted serially by Roll Number 1, 2, 3...)
  const [students, setStudents] = useState<Student[]>(() =>
    sortStudentsByRollNumber(StorageService.getStudents())
  );
  const [classes, setClasses] = useState<ClassItem[]>(() => StorageService.getClasses());
  const [examinations, setExaminations] = useState<Examination[]>(() =>
    StorageService.getExaminations()
  );
  const [activeExamId, setActiveExamId] = useState<string>(() => StorageService.getActiveExamId());
  const [dateSheet, setDateSheet] = useState<DateSheetItem[]>(() => StorageService.getDateSheet());
  const [instructions, setInstructions] = useState<InstructionItem[]>(() =>
    StorageService.getInstructions()
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(() =>
    StorageService.getCustomFields()
  );
  const [school, setSchool] = useState<SchoolSettings>(() => StorageService.getSchoolSettings());
  const [design, setDesign] = useState<DesignSettings>(() => StorageService.getDesignSettings());
  const [savedTemplates, setSavedTemplates] = useState<DesignSettings[]>(() =>
    StorageService.getSavedTemplates()
  );
  const [visibility, setVisibility] = useState<FieldVisibility>(() =>
    StorageService.getFieldVisibility()
  );
  const [sections, setSections] = useState<SectionConfig[]>(() => StorageService.getSections());
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() =>
    StorageService.getPrintSettings()
  );
  const [userSession, setUserSession] = useState<UserSession>(() =>
    StorageService.getUserSession()
  );
  const [selectedForPrintIds, setSelectedForPrintIds] = useState<string[] | null>(null);

  // Firebase Authentication & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('school_admin_authenticated') === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    return localStorage.getItem('school_admin_authenticated') !== 'true';
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Firebase Auth & Firestore Sync Lifecycle
  useEffect(() => {
    // 1. Initial Firestore Sync immediately on mount
    const syncInitialData = async (uid?: string) => {
      setCloudSyncStatus('syncing');
      try {
        // A. Sync Students with Firestore
        const fsStudents = await fetchStudentsFromFirestore(uid);
        if (fsStudents && fsStudents.length > 0) {
          const sorted = sortStudentsByRollNumber(fsStudents);
          setStudents(sorted);
          StorageService.setStudents(sorted);
        } else {
          const localStudents = StorageService.getStudents();
          if (localStudents.length > 0) {
            await syncBatchStudentsToFirestore(uid, localStudents);
          }
        }

        // B. Sync Classes with Firestore
        const fsClasses = await fetchClassesFromFirestore();
        if (fsClasses && fsClasses.length > 0) {
          const uniqueClasses: ClassItem[] = [];
          const seenNames = new Set<string>();
          fsClasses.forEach((c) => {
            const norm = normalizeClassName(c.name);
            if (!seenNames.has(norm)) {
              seenNames.add(norm);
              uniqueClasses.push({ ...c, name: norm });
            }
          });
          setClasses(uniqueClasses);
          StorageService.setClasses(uniqueClasses);
        } else {
          const localClasses = StorageService.getClasses();
          for (const cls of localClasses) {
            await saveClassToFirestore(cls);
          }
        }

        // C. Sync School Settings with Firestore (Logo, Stamp, Signs, School Name)
        const fsSchool = await fetchSchoolSettingsFromFirestore(uid || 'school-admin');
        if (fsSchool) {
          setSchool(fsSchool);
          StorageService.setSchoolSettings(fsSchool);
        } else {
          const localSchool = StorageService.getSchoolSettings();
          await saveSchoolSettingsToFirestore(uid || 'school-admin', localSchool);
        }

        // D. Sync Global App & Design Settings (Colors, Fonts, Visibilities, Sections, Print Settings)
        const fsAppSettings = await fetchAppSettingsFromFirestore();
        if (fsAppSettings) {
          if (fsAppSettings.design) {
            setDesign(fsAppSettings.design);
            StorageService.setDesignSettings(fsAppSettings.design);
          }
          if (fsAppSettings.visibility) {
            setVisibility(fsAppSettings.visibility);
            StorageService.setFieldVisibility(fsAppSettings.visibility);
          }
          if (fsAppSettings.sections) {
            setSections(fsAppSettings.sections);
            StorageService.setSections(fsAppSettings.sections);
          }
          if (fsAppSettings.printSettings) {
            setPrintSettings(fsAppSettings.printSettings);
            StorageService.setPrintSettings(fsAppSettings.printSettings);
          }
          if (fsAppSettings.customFields) {
            setCustomFields(fsAppSettings.customFields);
            StorageService.setCustomFields(fsAppSettings.customFields);
          }
          if (fsAppSettings.activeExamId) {
            setActiveExamId(fsAppSettings.activeExamId);
            StorageService.setActiveExamId(fsAppSettings.activeExamId);
          }
        } else {
          await saveAppSettingsToFirestore({
            design: StorageService.getDesignSettings(),
            visibility: StorageService.getFieldVisibility(),
            sections: StorageService.getSections(),
            printSettings: StorageService.getPrintSettings(),
            customFields: StorageService.getCustomFields(),
            activeExamId: StorageService.getActiveExamId(),
          });
        }

        // E. Sync Examinations with Firestore
        const fsExams = await fetchExamsFromFirestore();
        if (fsExams && fsExams.length > 0) {
          setExaminations(fsExams);
          StorageService.setExaminations(fsExams);
        } else {
          const localExams = StorageService.getExaminations();
          for (const exam of localExams) {
            await saveExamToFirestore(exam);
          }
        }

        // F. Sync DateSheets (Timetable) with Firestore
        const fsDateSheets = await fetchDateSheetsFromFirestore();
        if (fsDateSheets && fsDateSheets.length >= 20) {
          setDateSheet(fsDateSheets);
          StorageService.setDateSheet(fsDateSheets);
        } else {
          // Initialize with official full class-wise timetable (76 entries from uploaded date sheet)
          const localDs = StorageService.getDateSheet();
          const itemsToSave = localDs.length >= 20 ? localDs : INITIAL_DATE_SHEET;
          setDateSheet(itemsToSave);
          StorageService.setDateSheet(itemsToSave);
          await saveDateSheetsToFirestore(itemsToSave);
        }

        // G. Sync Instructions with Firestore
        const fsInstructions = await fetchInstructionsFromFirestore();
        if (fsInstructions && fsInstructions.length > 0) {
          setInstructions(fsInstructions);
          StorageService.setInstructions(fsInstructions);
        } else {
          const localInst = StorageService.getInstructions();
          if (localInst.length > 0) {
            await saveInstructionsToFirestore(localInst);
          }
        }

        setCloudSyncStatus('synced');
      } catch (err) {
        console.error('Initial Firestore Sync Error:', err);
        setCloudSyncStatus('offline');
      }
    };

    // Run startup sync
    syncInitialData();

    // Listen to Firebase Auth state
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('school_admin_authenticated', 'true');
        setIsLoginModalOpen(false);
        syncInitialData(user.uid);
      } else {
        setCurrentUser(null);
        const isAuth = localStorage.getItem('school_admin_authenticated') === 'true';
        if (!isAuth) {
          setIsAuthenticated(false);
          setIsLoginModalOpen(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync active exam
  const currentExam =
    examinations.find((e) => e.id === activeExamId) || examinations[0];

  // Handlers for Students (Always synced to Firestore database & sorted serially 1, 2, 3...)
  const handleSaveStudent = (student: Student) => {
    const normalizedClass = normalizeClassName(student.className) || student.className;
    const cleanStudent: Student = {
      ...student,
      className: normalizedClass,
    };

    const isNew = !students.some((s) => s.id === cleanStudent.id);
    let targetId = cleanStudent.id;
    if (isNew) {
      const duplicate = findDuplicateStudent(cleanStudent, students);
      if (duplicate) {
        // Replace existing duplicate student's record with the new one
        targetId = duplicate.id;
      }
    }

    const finalStudent: Student = {
      ...cleanStudent,
      id: targetId,
    };

    const exists = students.some((s) => s.id === targetId);
    const updated = exists
      ? students.map((s) => (s.id === targetId ? finalStudent : s))
      : [finalStudent, ...students];

    const sortedUpdated = sortStudentsByRollNumber(updated);
    setStudents(sortedUpdated);
    StorageService.setStudents(sortedUpdated);

    // Save student to Firestore database
    setCloudSyncStatus('syncing');
    saveStudentToFirestore(currentUser?.uid, finalStudent)
      .then(() => setCloudSyncStatus('synced'))
      .catch((err) => {
        console.error('Save to Firestore failed:', err);
        setCloudSyncStatus('offline');
      });
  };

  const handleBulkAddStudents = (
    newStudents: Student[],
    importMode: 'update' | 'skip' | 'replace_class' = 'update',
    targetClassName?: string
  ) => {
    const cleanStudents = newStudents.map((ns) => ({
      ...ns,
      className: normalizeClassName(ns.className) || ns.className,
    }));

    let updatedList: Student[] = [];
    const studentsToSaveToFirestore: Student[] = [];

    if (importMode === 'replace_class') {
      const affectedClassSet = new Set<string>();
      cleanStudents.forEach((ns) => affectedClassSet.add(normalizeClassName(ns.className)));
      if (targetClassName) affectedClassSet.add(normalizeClassName(targetClassName));

      // Remove previous students from the affected classes
      const removedStudents = students.filter((s) => affectedClassSet.has(normalizeClassName(s.className)));
      const retainedStudents = students.filter((s) => !affectedClassSet.has(normalizeClassName(s.className)));

      // Delete removed students from Firestore
      removedStudents.forEach((s) => {
        deleteStudentFromFirestore(currentUser?.uid, s.id).catch(() => {});
      });

      updatedList = [...cleanStudents, ...retainedStudents];
      studentsToSaveToFirestore.push(...cleanStudents);
    } else if (importMode === 'update') {
      // Update/Replace existing matching students, or insert if new
      const currentMap = new Map<string, Student>();
      students.forEach((s) => currentMap.set(s.id, s));

      cleanStudents.forEach((incoming) => {
        const dup = findDuplicateStudent(incoming, Array.from(currentMap.values()));
        if (dup) {
          // Update & replace existing student record
          const merged: Student = {
            ...incoming,
            id: dup.id, // keep original ID
            photoUrl: incoming.photoUrl || dup.photoUrl,
            admitCardNumber: incoming.admitCardNumber || dup.admitCardNumber,
          };
          currentMap.set(dup.id, merged);
          studentsToSaveToFirestore.push(merged);
        } else {
          // Add as new student
          currentMap.set(incoming.id, incoming);
          studentsToSaveToFirestore.push(incoming);
        }
      });

      updatedList = Array.from(currentMap.values());
    } else {
      // Skip Mode: Only add non-duplicates
      const nonDuplicates: Student[] = [];
      cleanStudents.forEach((ns) => {
        const isDup = findDuplicateStudent(ns, [...students, ...nonDuplicates]);
        if (!isDup) {
          nonDuplicates.push(ns);
        }
      });
      updatedList = [...nonDuplicates, ...students];
      studentsToSaveToFirestore.push(...nonDuplicates);
    }

    const sortedList = sortStudentsByRollNumber(updatedList);
    setStudents(sortedList);
    StorageService.setStudents(sortedList);

    // Save batch to Firestore database
    if (studentsToSaveToFirestore.length > 0) {
      setCloudSyncStatus('syncing');
      syncBatchStudentsToFirestore(currentUser?.uid, studentsToSaveToFirestore)
        .then(() => setCloudSyncStatus('synced'))
        .catch((err) => {
          console.error('Batch save to Firestore failed:', err);
          setCloudSyncStatus('offline');
        });
    }
  };

  // Re-sequence and assign clean Serial Roll Numbers (1, 2, 3...)
  const handleResequenceRollNumbers = (targetClassName: string) => {
    const prefix = school.admitCardNumberPrefix || 'HDP/2026/';
    const affectedClasses =
      targetClassName === 'all'
        ? Array.from(new Set(students.map((s) => normalizeClassName(s.className))))
        : [normalizeClassName(targetClassName)];

    const updatedStudents = [...students];
    const modifiedList: Student[] = [];

    affectedClasses.forEach((cls) => {
      const classStudents = updatedStudents
        .filter((s) => normalizeClassName(s.className) === cls)
        .sort((a, b) => {
          const numA = parseInt(a.rollNumber.replace(/[^0-9]/g, '') || '0', 10);
          const numB = parseInt(b.rollNumber.replace(/[^0-9]/g, '') || '0', 10);
          if (numA > 0 && numB > 0 && numA !== numB) return numA - numB;
          return a.name.localeCompare(b.name);
        });

      classStudents.forEach((st, idx) => {
        const newRoll = String(idx + 1);
        const classNum = cls.replace(/[^0-9]/g, '') || '1';
        const formattedRoll = String(idx + 1).padStart(2, '0');
        const newCardNo = st.admitCardNumber
          ? `${prefix}${classNum.padStart(2, '0')}${formattedRoll}`
          : st.admitCardNumber;

        const updatedSt: Student = {
          ...st,
          rollNumber: newRoll,
          admitCardNumber: newCardNo,
        };

        const globalIdx = updatedStudents.findIndex((s) => s.id === st.id);
        if (globalIdx !== -1) {
          updatedStudents[globalIdx] = updatedSt;
        }
        modifiedList.push(updatedSt);
      });
    });

    const sorted = sortStudentsByRollNumber(updatedStudents);
    setStudents(sorted);
    StorageService.setStudents(sorted);

    if (modifiedList.length > 0) {
      setCloudSyncStatus('syncing');
      syncBatchStudentsToFirestore(currentUser?.uid, modifiedList)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('offline'));
    }
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    StorageService.setStudents(updated);

    deleteStudentFromFirestore(currentUser?.uid, id).catch(() => setCloudSyncStatus('offline'));
  };

  const handleDeleteMultipleStudents = (ids: string[]) => {
    const updated = students.filter((s) => !ids.includes(s.id));
    setStudents(updated);
    StorageService.setStudents(updated);

    ids.forEach((id) => deleteStudentFromFirestore(currentUser?.uid, id).catch(() => {}));
  };

  const handleGenerateAdmitCards = (ids: string[]) => {
    const prefix = school.admitCardNumberPrefix || 'HDP/2026/';
    let counter = students.filter((s) => s.isGenerated).length;

    const modifiedStudents: Student[] = [];
    const updated = students.map((s) => {
      if (ids.includes(s.id)) {
        counter++;
        const classNum = s.className.replace(/[^0-9]/g, '') || '1';
        const formattedRoll = String(s.rollNumber || counter).padStart(2, '0');
        const stUpdated: Student = {
          ...s,
          isGenerated: true,
          admitCardNumber:
            s.admitCardNumber && s.admitCardNumber.trim() !== ''
              ? s.admitCardNumber
              : `${prefix}${classNum.padStart(2, '0')}${formattedRoll}`,
        };
        modifiedStudents.push(stUpdated);
        return stUpdated;
      }
      return s;
    });

    setStudents(updated);
    StorageService.setStudents(updated);

    if (modifiedStudents.length > 0) {
      syncBatchStudentsToFirestore(currentUser?.uid, modifiedStudents).catch(() => {});
    }
  };

  const handleBulkGenerateAll = () => {
    const allIds = students.map((s) => s.id);
    handleGenerateAdmitCards(allIds);
  };

  const handlePrintSelected = (selectedStudents: Student[]) => {
    setSelectedForPrintIds(selectedStudents.map((s) => s.id));
    setActiveTab('print_pdf');
  };

  const handlePrintClass = (className: string) => {
    setSelectedClassFilter(className);
    setSelectedForPrintIds(null);
    setActiveTab('print_pdf');
  };

  // Handlers for Classes
  const handleSaveClass = (cls: ClassItem) => {
    const normalizedName = normalizeClassName(cls.name);
    const cleanCls = { ...cls, name: normalizedName };
    const exists = classes.some((c) => c.id === cleanCls.id);
    const updated = exists
      ? classes.map((c) => (c.id === cleanCls.id ? cleanCls : c))
      : [...classes, cleanCls];

    // Deduplicate by normalized name
    const uniqueClasses: ClassItem[] = [];
    const seenNames = new Set<string>();
    updated.forEach((c) => {
      const norm = normalizeClassName(c.name);
      if (!seenNames.has(norm)) {
        seenNames.add(norm);
        uniqueClasses.push({ ...c, name: norm });
      }
    });

    setClasses(uniqueClasses);
    StorageService.setClasses(uniqueClasses);
    saveClassToFirestore(cleanCls).catch((err) => console.error('Save class to Firestore failed:', err));
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    StorageService.setClasses(updated);
    deleteClassFromFirestore(id).catch((err) => console.error('Delete class from Firestore failed:', err));
  };

  // Handlers for Examinations
  const handleSaveExam = (exam: Examination) => {
    const exists = examinations.some((e) => e.id === exam.id);
    const updated = exists
      ? examinations.map((e) => (e.id === exam.id ? exam : e))
      : [...examinations, exam];
    setExaminations(updated);
    StorageService.setExaminations(updated);
    saveExamToFirestore(exam).catch(() => {});
  };

  const handleDeleteExam = (id: string) => {
    const updated = examinations.filter((e) => e.id !== id);
    setExaminations(updated);
    StorageService.setExaminations(updated);
    if (activeExamId === id && updated.length > 0) {
      setActiveExamId(updated[0].id);
      StorageService.setActiveExamId(updated[0].id);
      saveAppSettingsToFirestore({ activeExamId: updated[0].id }).catch(() => {});
    }
    deleteExamFromFirestore(id).catch(() => {});
  };

  const handleDuplicateExam = (exam: Examination) => {
    const duplicated: Examination = {
      ...exam,
      id: `exam-${Date.now()}`,
      name: `${exam.name} (Copy)`,
      status: 'Upcoming',
    };
    const updated = [...examinations, duplicated];
    setExaminations(updated);
    StorageService.setExaminations(updated);
    saveExamToFirestore(duplicated).catch(() => {});
  };

  const handleSetActiveExam = (id: string) => {
    setActiveExamId(id);
    StorageService.setActiveExamId(id);
    saveAppSettingsToFirestore({ activeExamId: id }).catch(() => {});
  };

  // Handlers for Designer & Settings (Synced to Cloud Firestore)
  const handleUpdateDesign = (newDesign: DesignSettings) => {
    setDesign(newDesign);
    StorageService.setDesignSettings(newDesign);
    saveAppSettingsToFirestore({ design: newDesign }).catch(() => {});
  };

  const handleUpdateVisibility = (newVisibility: FieldVisibility) => {
    setVisibility(newVisibility);
    StorageService.setFieldVisibility(newVisibility);
    saveAppSettingsToFirestore({ visibility: newVisibility }).catch(() => {});
  };

  const handleUpdateSections = (newSections: SectionConfig[]) => {
    setSections(newSections);
    StorageService.setSections(newSections);
    saveAppSettingsToFirestore({ sections: newSections }).catch(() => {});
  };

  const handleSaveTemplate = (currentDesign: DesignSettings, isNew?: boolean) => {
    if (isNew) {
      const name = prompt('Enter template name:', 'Custom Template');
      if (!name) return;
      const newTmpl: DesignSettings = {
        ...currentDesign,
        id: `tmpl-${Date.now()}`,
        name,
      };
      const updated = [...savedTemplates, newTmpl];
      setSavedTemplates(updated);
      StorageService.setSavedTemplates(updated);
    } else {
      StorageService.setDesignSettings(currentDesign);
    }
  };

  const handleResetDesign = () => {
    if (confirm('Reset design settings and theme to default?')) {
      const def = StorageService.getDesignSettings();
      setDesign(def);
      StorageService.setDesignSettings(def);
    }
  };

  const handleSaveSchool = (newSchool: SchoolSettings) => {
    setSchool(newSchool);
    StorageService.setSchoolSettings(newSchool);

    setCloudSyncStatus('syncing');
    saveSchoolSettingsToFirestore(currentUser?.uid, newSchool)
      .then(() => setCloudSyncStatus('synced'))
      .catch(() => setCloudSyncStatus('offline'));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('school_admin_authenticated');
    localStorage.removeItem('school_admin_email');
    localStorage.removeItem('school_admin_name');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (email: string, displayName?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('school_admin_authenticated', 'true');
    localStorage.setItem('school_admin_email', email);
    if (displayName) {
      localStorage.setItem('school_admin_name', displayName);
    }
    setIsLoginModalOpen(false);
  };

  const handleSaveDateSheet = (newDateSheet: DateSheetItem[]) => {
    setDateSheet(newDateSheet);
    StorageService.setDateSheet(newDateSheet);
    setCloudSyncStatus('syncing');
    saveDateSheetsToFirestore(newDateSheet)
      .then(() => setCloudSyncStatus('synced'))
      .catch((err) => {
        console.error('Failed to sync timetable:', err);
        setCloudSyncStatus('offline');
      });
  };

  const handleSaveInstructions = (newInstructions: InstructionItem[]) => {
    setInstructions(newInstructions);
    StorageService.setInstructions(newInstructions);
    saveInstructionsToFirestore(newInstructions).catch(() => {});
  };

  const handleUpdatePrintSettings = (newPs: PrintSettings) => {
    setPrintSettings(newPs);
    StorageService.setPrintSettings(newPs);
    saveAppSettingsToFirestore({ printSettings: newPs }).catch(() => {});
  };

  const handleSaveSession = (session: UserSession) => {
    setUserSession(session);
    StorageService.setUserSession(session);
  };

  // Import / Export
  const handleImportStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    StorageService.setStudents(newStudents);

    if (currentUser?.uid) {
      setCloudSyncStatus('syncing');
      syncBatchStudentsToFirestore(currentUser.uid, newStudents)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('offline'));
    }
  };

  const handleExportFullBackup = () => {
    const json = StorageService.exportAllBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `School_Admit_Card_System_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFullBackup = (jsonString: string) => {
    const success = StorageService.importBackupJSON(jsonString);
    if (success) {
      setStudents(StorageService.getStudents());
      setClasses(StorageService.getClasses());
      setExaminations(StorageService.getExaminations());
      setActiveExamId(StorageService.getActiveExamId());
      setDateSheet(StorageService.getDateSheet());
      setInstructions(StorageService.getInstructions());
      setCustomFields(StorageService.getCustomFields());
      setSchool(StorageService.getSchoolSettings());
      setDesign(StorageService.getDesignSettings());
      setSavedTemplates(StorageService.getSavedTemplates());
      setVisibility(StorageService.getFieldVisibility());
      setSections(StorageService.getSections());
      setPrintSettings(StorageService.getPrintSettings());
    }
  };

  const handleResetToDefaults = () => {
    StorageService.resetAllData();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Top Navigation Bar */}
      <Navbar
        school={school}
        examinations={examinations}
        activeExamId={activeExamId}
        onSelectActiveExam={handleSetActiveExam}
        onOpenPrint={() => setActiveTab('print_pdf')}
        onOpenPreview={() => setActiveTab('preview')}
        userSession={userSession}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        cloudSyncStatus={cloudSyncStatus}
        currentUserEmail={currentUser?.email || localStorage.getItem('school_admin_email') || (isAuthenticated ? 'kuldeeprai75220@gmail.com' : null)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'system_settings') {
              setIsSystemModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedClass={selectedClassFilter}
          onSelectClassQuick={(cls) => {
            setSelectedClassFilter(cls);
          }}
          classList={classes.map((c) => c.name)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <Dashboard
              students={students}
              classes={classes}
              examinations={examinations}
              activeExamId={activeExamId}
              school={school}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectClassAndNavigate={(cls, tab) => {
                setSelectedClassFilter(cls);
                setActiveTab(tab);
              }}
              onPrintAll={() => {
                setSelectedClassFilter('all');
                setSelectedForPrintIds(null);
                setActiveTab('print_pdf');
              }}
              onPrintClass={handlePrintClass}
              onBulkGenerate={handleBulkGenerateAll}
            />
          )}

          {/* TAB 2: CLASS-WISE STUDENTS */}
          {activeTab === 'students' && (
            <StudentManager
              students={students}
              classes={classes}
              customFields={customFields}
              school={school}
              selectedClassFilter={selectedClassFilter}
              onSaveStudent={handleSaveStudent}
              onBulkAddStudents={handleBulkAddStudents}
              onResequenceRollNumbers={handleResequenceRollNumbers}
              onDeleteStudent={handleDeleteStudent}
              onDeleteMultiple={handleDeleteMultipleStudents}
              onGenerateAdmitCards={handleGenerateAdmitCards}
              onPrintSelected={handlePrintSelected}
            />
          )}

          {/* TAB 3: CLASSES MANAGEMENT */}
          {activeTab === 'classes' && (
            <ClassManager
              classes={classes}
              students={students}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onPrintClass={handlePrintClass}
              onViewClassStudents={(cls) => {
                setSelectedClassFilter(cls);
                setActiveTab('students');
              }}
              onGenerateClassCards={(cls) => {
                const classStudentIds = students.filter((s) => s.className === cls).map((s) => s.id);
                handleGenerateAdmitCards(classStudentIds);
              }}
            />
          )}

          {/* TAB 4: EXAMINATIONS */}
          {activeTab === 'examinations' && (
            <ExamManager
              examinations={examinations}
              activeExamId={activeExamId}
              onSetActiveExam={handleSetActiveExam}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onDuplicateExam={handleDuplicateExam}
            />
          )}

          {/* TAB 5: ADMIT CARD DESIGNER */}
          {activeTab === 'designer' && (
            <Designer
              students={students}
              school={school}
              exam={currentExam}
              dateSheet={dateSheet}
              instructions={instructions}
              customFields={customFields}
              visibility={visibility}
              onUpdateVisibility={handleUpdateVisibility}
              sections={sections}
              onUpdateSections={handleUpdateSections}
              design={design}
              onUpdateDesign={handleUpdateDesign}
              savedTemplates={savedTemplates}
              onSaveTemplate={handleSaveTemplate}
              onResetDesign={handleResetDesign}
              printSettings={printSettings}
              onUpdatePrintSettings={handleUpdatePrintSettings}
            />
          )}

          {/* TAB 6 & 14: LIVE PREVIEW / PRINT PDF */}
          {(activeTab === 'preview' || activeTab === 'print_pdf') && (
            <PrintPreviewView
              students={students}
              classes={classes}
              school={school}
              exam={currentExam}
              dateSheet={dateSheet}
              instructions={instructions}
              customFields={customFields}
              visibility={visibility}
              sections={sections}
              design={design}
              printSettings={printSettings}
              onUpdatePrintSettings={handleUpdatePrintSettings}
              onUpdateDesign={handleUpdateDesign}
              onUpdateDateSheet={handleSaveDateSheet}
              initialSelectedStudentIds={selectedForPrintIds}
              initialClassFilter={selectedClassFilter}
              onClearSelectedIds={() => setSelectedForPrintIds(null)}
            />
          )}

          {/* TAB 7: SCHOOL SETTINGS / SIGNATURES & ASSETS */}
          {activeTab === 'school_settings' && (
            <SchoolSettingsView
              school={school}
              design={design}
              onSaveSchool={handleSaveSchool}
              onSaveDesign={handleUpdateDesign}
            />
          )}

          {/* TAB 8: INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <InstructionsManager
              instructions={instructions}
              onSaveInstructions={handleSaveInstructions}
            />
          )}

          {/* TAB 9: DATE SHEET */}
          {activeTab === 'date_sheet' && (
            <DateSheetManager
              dateSheet={dateSheet}
              examinations={examinations}
              classes={classes}
              activeExamId={activeExamId}
              onSaveDateSheet={handleSaveDateSheet}
            />
          )}

          {/* TAB 10: IMPORT / EXPORT (EXCEL COPY-PASTE & CSV) */}
          {activeTab === 'import_export' && (
            <ImportExportView
              students={students}
              classes={classes}
              school={school}
              examinations={examinations}
              onImportStudents={handleImportStudents}
              onExportFullBackup={handleExportFullBackup}
              onImportFullBackup={handleImportFullBackup}
              onResetToDefaults={handleResetToDefaults}
            />
          )}
        </main>
      </div>

      {/* Admin Security / System Profile Modal */}
      <SystemSettingsModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        userSession={userSession}
        school={school}
        onSaveSession={handleSaveSession}
      />

      {/* Password & Firebase Auth Gateway for Admin Access */}
      <AdminLoginModal
        isOpen={isLoginModalOpen || !isAuthenticated}
        onSuccess={handleLoginSuccess}
        onClose={() => {
          if (isAuthenticated) setIsLoginModalOpen(false);
        }}
        schoolName={school.name}
        logoUrl={school.logoUrl}
        allowBypassDemo={false}
      />
    </div>
  );
}
