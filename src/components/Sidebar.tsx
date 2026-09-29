import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck2,
  Palette,
  Eye,
  School,
  FileText,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  Settings,
  X,
  Upload,
  Layers,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'examinations'
  | 'designer'
  | 'preview'
  | 'school_settings'
  | 'instructions'
  | 'date_sheet'
  | 'import_export'
  | 'print_pdf'
  | 'system_settings';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedClass?: string;
  onSelectClassQuick?: (clsName: string) => void;
  classList?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  selectedClass,
  onSelectClassQuick,
  classList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
}) => {
  const mainNavItems: { key: TabKey; label: string; subLabel: string; icon: any; badge?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', subLabel: 'Overview & Statistics', icon: LayoutDashboard },
    { key: 'students', label: 'Class-Wise Students', subLabel: 'Students Roster by Class', icon: Users, badge: 'Classes' },
    { key: 'classes', label: 'Class Management', subLabel: 'Manage Classes & Sections', icon: GraduationCap },
    { key: 'import_export', label: 'Bulk Import & Backup', subLabel: 'Excel / CSV Import', icon: Upload, badge: 'Bulk' },
    { key: 'print_pdf', label: 'Print / Export PDF', subLabel: 'A4 Sheets (2-Up / 4-Up)', icon: Printer, badge: 'Print' },
    { key: 'preview', label: 'Admit Card Preview', subLabel: 'Live Card & Sheet Viewer', icon: Eye },
  ];

  const configNavItems: { key: TabKey; label: string; subLabel: string; icon: any; badge?: string }[] = [
    { key: 'examinations', label: 'Examinations', subLabel: 'Exam Sessions & Dates', icon: CalendarCheck2 },
    { key: 'date_sheet', label: 'Exam Timetable', subLabel: '11 Subjects Schedule', icon: CalendarDays },
    { key: 'designer', label: 'Admit Card Designer', subLabel: 'Themes, Fonts & Borders', icon: Palette, badge: 'Design' },
    { key: 'instructions', label: 'Exam Instructions', subLabel: 'Rules for Candidates', icon: FileText },
    { key: 'school_settings', label: 'School & Signatures', subLabel: 'Logo, Signatures & Stamp', icon: School },
    { key: 'system_settings', label: 'System Backup', subLabel: 'Backup & Restore Data', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 top-16 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`no-print fixed lg:sticky top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] transition-transform duration-200 ease-in-out shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <div className="font-extrabold text-sm text-slate-800 tracking-tight">Admit Card System</div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <span className="block text-xs truncate leading-tight">{item.label}</span>
                    <span className={`block text-[9.5px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.subLabel}
                    </span>
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Class Shortcut Bar */}
          {onSelectClassQuick && (
            <div className="pt-2 pb-1 px-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center justify-between">
                <span>Quick Class Selector:</span>
              </div>
              <div className="grid grid-cols-4 gap-1 px-1">
                {classList.slice(0, 8).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      onSelectClassQuick(cls);
                      onSelectTab('students');
                      onClose();
                    }}
                    className={`py-1 px-0.5 text-center text-[10px] font-bold rounded-lg border transition-all cursor-pointer truncate ${
                      selectedClass === cls && activeTab === 'students'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                    }`}
                    title={`View ${cls}`}
                  >
                    {cls.replace('Class ', 'C-')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Timetable & School Settings
          </div>

          {configNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <span className="block text-xs truncate leading-tight">{item.label}</span>
                    <span className={`block text-[9.5px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.subLabel}
                    </span>
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="text-[11px] font-bold text-slate-800 truncate">H.D. PANDEY PUBLIC SCHOOL</div>
          <div className="text-[10px] text-slate-500 font-medium">Baurbyas, Mehdawal, SKN</div>
          <div className="text-[9.5px] text-blue-700 font-bold mt-0.5">Mob: 9838767297</div>
        </div>
      </aside>
    </>
  );
};
