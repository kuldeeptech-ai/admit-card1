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
import { StudentManager } from './components/StudentManager';
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

    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('school_admin_authenticated', 'true');
        setIsLoginModalOpen(false);
        setCloudSyncStatus('syncing');

        try {
          // 1. Fetch Students from Firestore
          const fsStudents = await fetchStudentsFromFirestore(user.uid);
          if (fsStudents && fsStudents.length > 0) {
            setStudents(fsStudents);
            StorageService.setStudents(fsStudents);
          } else {
            // First time login for this user: sync default/existing students to Firestore
            const localStudents = StorageService.getStudents();
            if (localStudents.length > 0) {
              await syncBatchStudentsToFirestore(user.uid, localStudents);
            }
          }

          // 2. Fetch School Settings from Firestore
          const fsSchool = await fetchSchoolSettingsFromFirestore(user.uid);
          if (fsSchool) {
            setSchool(fsSchool);
            StorageService.setSchoolSettings(fsSchool);
          } else {
            const localSchool = StorageService.getSchoolSettings();
            await saveSchoolSettingsToFirestore(user.uid, localSchool);
          }

          setCloudSyncStatus('synced');
        } catch (err) {
          console.error('Initial Firestore Sync Error:', err);
          setCloudSyncStatus('offline');
        }
      } else {
        setCurrentUser(null);
        const isDemo =
          localStorage.getItem('school_admin_authenticated') === 'true' &&
          localStorage.getItem('school_admin_demo') === 'true';
        if (!isDemo) {
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

  // Handlers for Students
  const handleSaveStudent = (student: Student) => {
    const exists = students.some((s) => s.id === student.id);
    const updated = exists
      ? students.map((s) => (s.id === student.id ? student : s))
      : [student, ...students];
    setStudents(updated);
    StorageService.setStudents(updated);

    if (currentUser?.uid) {
      setCloudSyncStatus('syncing');
      saveStudentToFirestore(currentUser.uid, student)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('offline'));
    }
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
    const updated = [...newStudents, ...students];
    setStudents(updated);
    StorageService.setStudents(updated);

    if (currentUser?.uid) {
      setCloudSyncStatus('syncing');
      syncBatchStudentsToFirestore(currentUser.uid, newStudents)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('offline'));
    }
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    StorageService.setStudents(updated);

    if (currentUser?.uid) {
      deleteStudentFromFirestore(currentUser.uid, id).catch(() => setCloudSyncStatus('offline'));
    }
  };

  const handleDeleteMultipleStudents = (ids: string[]) => {
    const updated = students.filter((s) => !ids.includes(s.id));
    setStudents(updated);
    StorageService.setStudents(updated);

    if (currentUser?.uid) {
      ids.forEach((id) => deleteStudentFromFirestore(currentUser.uid, id).catch(() => {}));
    }
  };

  const handleGenerateAdmitCards = (ids: string[]) => {
    const prefix = school.admitCardNumberPrefix || 'HDP/2026/';
    let counter = students.filter((s) => s.isGenerated).length;

    const updated = students.map((s) => {
      if (ids.includes(s.id)) {
        counter++;
        const classNum = s.className.replace(/[^0-9]/g, '') || '1';
        const formattedRoll = String(s.rollNumber || counter).padStart(2, '0');
        return {
          ...s,
          isGenerated: true,
          admitCardNumber:
            s.admitCardNumber && s.admitCardNumber.trim() !== ''
              ? s.admitCardNumber
              : `${prefix}${classNum.padStart(2, '0')}${formattedRoll}`,
        };
      }
      return s;
    });

    setStudents(updated);
    StorageService.setStudents(updated);
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
    const exists = classes.some((c) => c.id === cls.id);
    const updated = exists
      ? classes.map((c) => (c.id === cls.id ? cls : c))
      : [...classes, cls];
    setClasses(updated);
    StorageService.setClasses(updated);
  };

  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    StorageService.setClasses(updated);
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
    localStorage.removeItem('school_admin_demo');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (_email: string, _displayName?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem('school_admin_authenticated', 'true');
    if (!currentUser) {
      localStorage.setItem('school_admin_demo', 'true');
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
        currentUserEmail={currentUser?.email || (isAuthenticated ? 'admin@pandeypublicschool.edu' : null)}
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
        allowBypassDemo={true}
      />
    </div>
  );
}
