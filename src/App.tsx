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
import { StudentManager, findDuplicateStudent, normalizeClassName } from './components/StudentManager';
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
import { testFirestoreConnection } from './firebase';
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
} from './utils/firebaseSync';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Core Application State (loaded from StorageService)
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
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
    testFirestoreConnection();

    // 1. Initial Firestore Sync immediately on mount
    const syncInitialData = async (uid?: string) => {
      setCloudSyncStatus('syncing');
      try {
        // A. Sync Students with Firestore
        const fsStudents = await fetchStudentsFromFirestore(uid);
        if (fsStudents && fsStudents.length > 0) {
          setStudents(fsStudents);
          StorageService.setStudents(fsStudents);
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

        // C. Sync School Settings with Firestore
        const fsSchool = await fetchSchoolSettingsFromFirestore(uid || 'school-admin');
        if (fsSchool) {
          setSchool(fsSchool);
          StorageService.setSchoolSettings(fsSchool);
        } else {
          const localSchool = StorageService.getSchoolSettings();
          await saveSchoolSettingsToFirestore(uid || 'school-admin', localSchool);
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

  // Handlers for Students (Always synced to Firestore database)
  const handleSaveStudent = (student: Student) => {
    const normalizedClass = normalizeClassName(student.className) || student.className;
    const cleanStudent: Student = {
      ...student,
      className: normalizedClass,
    };

    const isNew = !students.some((s) => s.id === cleanStudent.id);
    if (isNew) {
      const duplicate = findDuplicateStudent(cleanStudent, students);
      if (duplicate) {
        alert(
          `Cannot add duplicate student: A student named "${duplicate.name}" with Roll No "${duplicate.rollNumber}" already exists in ${duplicate.className}.`
        );
        return;
      }
    }

    const exists = students.some((s) => s.id === cleanStudent.id);
    const updated = exists
      ? students.map((s) => (s.id === cleanStudent.id ? cleanStudent : s))
      : [cleanStudent, ...students];
    setStudents(updated);
    StorageService.setStudents(updated);

    // Save student to Firestore database
    setCloudSyncStatus('syncing');
    saveStudentToFirestore(currentUser?.uid, cleanStudent)
      .then(() => setCloudSyncStatus('synced'))
      .catch((err) => {
        console.error('Save to Firestore failed:', err);
        setCloudSyncStatus('offline');
      });
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    const cleanStudents = newStudents.map((ns) => ({
      ...ns,
      className: normalizeClassName(ns.className) || ns.className,
    }));

    const uniqueStudents: Student[] = [];
    cleanStudents.forEach((ns) => {
      const isDup = findDuplicateStudent(ns, [...students, ...uniqueStudents]);
      if (!isDup) {
        uniqueStudents.push(ns);
      }
    });

    if (uniqueStudents.length === 0) {
      alert('All provided students already exist in the database. No duplicate students were added.');
      return;
    }

    const updated = [...uniqueStudents, ...students];
    setStudents(updated);
    StorageService.setStudents(updated);

    // Save batch to Firestore database
    setCloudSyncStatus('syncing');
    syncBatchStudentsToFirestore(currentUser?.uid, uniqueStudents)
      .then(() => setCloudSyncStatus('synced'))
      .catch((err) => {
        console.error('Batch save to Firestore failed:', err);
        setCloudSyncStatus('offline');
      });
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
  };

  const handleDeleteExam = (id: string) => {
    const updated = examinations.filter((e) => e.id !== id);
    setExaminations(updated);
    StorageService.setExaminations(updated);
    if (activeExamId === id && updated.length > 0) {
      setActiveExamId(updated[0].id);
      StorageService.setActiveExamId(updated[0].id);
    }
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
  };

  const handleSetActiveExam = (id: string) => {
    setActiveExamId(id);
    StorageService.setActiveExamId(id);
  };

  // Handlers for Designer & Settings
  const handleUpdateDesign = (newDesign: DesignSettings) => {
    setDesign(newDesign);
    StorageService.setDesignSettings(newDesign);
  };

  const handleUpdateVisibility = (newVisibility: FieldVisibility) => {
    setVisibility(newVisibility);
    StorageService.setFieldVisibility(newVisibility);
  };

  const handleUpdateSections = (newSections: SectionConfig[]) => {
    setSections(newSections);
    StorageService.setSections(newSections);
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

    if (currentUser?.uid) {
      setCloudSyncStatus('syncing');
      saveSchoolSettingsToFirestore(currentUser.uid, newSchool)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('offline'));
    }
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
  };

  const handleSaveInstructions = (newInstructions: InstructionItem[]) => {
    setInstructions(newInstructions);
    StorageService.setInstructions(newInstructions);
  };

  const handleUpdatePrintSettings = (newPs: PrintSettings) => {
    setPrintSettings(newPs);
    StorageService.setPrintSettings(newPs);
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
