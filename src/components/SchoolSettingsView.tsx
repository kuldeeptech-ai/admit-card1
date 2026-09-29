import React, { useState } from 'react';
import { SchoolSettings, DesignSettings } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  School,
  Save,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Link as LinkIcon,
  Trash2,
  Sliders,
} from 'lucide-react';
import {
  DEFAULT_SCHOOL_LOGO,
  DEFAULT_PRINCIPAL_SIGNATURE,
  DEFAULT_CLASS_TEACHER_SIGNATURE,
  DEFAULT_SCHOOL_STAMP,
} from '../utils/defaultData';

interface SchoolSettingsViewProps {
  school: SchoolSettings;
  design: DesignSettings;
  onSaveSchool: (settings: SchoolSettings) => void;
  onSaveDesign: (design: DesignSettings) => void;
}

interface AssetControlProps {
  title: string;
  urlValue: string;
  defaultVal: string;
  aspectBox?: 'square' | 'rect';
  sizeLabel?: string;
  sizeValue?: number;
  minSize?: number;
  maxSize?: number;
  onChangeUrl: (val: string) => void;
  onChangeSize?: (size: number) => void;
}

const AssetControlBox: React.FC<AssetControlProps> = ({
  title,
  urlValue,
  defaultVal,
  aspectBox = 'square',
  sizeLabel,
  sizeValue,
  minSize = 30,
  maxSize = 80,
  onChangeUrl,
  onChangeSize,
}) => {
  const [copied, setCopied] = useState(false);
  const [justConverted, setJustConverted] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 300, 300, 0.82);
        onChangeUrl(compressed);
        setJustConverted(true);
        setTimeout(() => setJustConverted(false), 3500);
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }
  };

  const handleCopy = () => {
    if (!urlValue) return;
    navigator.clipboard.writeText(urlValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800">{title}</span>
          {urlValue.startsWith('data:image') && (
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
              Base64 Data
            </span>
          )}
        </div>

        {/* Visual Preview Box */}
        <div
          className={`w-full mx-auto bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 mb-3 relative group overflow-hidden ${
            aspectBox === 'rect' ? 'h-20' : 'h-24'
          }`}
        >
          {urlValue ? (
            <img
              src={urlValue}
              alt={title}
              className="max-h-full max-w-full object-contain filter"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] text-slate-400 font-medium text-center px-2">No image (hidden on card)</span>
          )}

          {urlValue && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onChangeUrl('')}
                className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer"
                title="Remove Image"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {justConverted && (
          <div className="mb-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-bold text-emerald-800 flex items-center gap-1 animate-fadeIn">
            <Check className="w-3 h-3 text-emerald-600" />
            Image successfully converted & uploaded!
          </div>
        )}

        {/* Upload Button */}
        <div className="flex gap-1.5 mb-2">
          <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => onChangeUrl(defaultVal)}
            className="px-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
            title="Reset to Default"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Direct URL / Base64 Box */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Image URL or Base64:
            </span>
            {urlValue && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold cursor-pointer"
                title="Copy Base64 URL"
              >
                {copied ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" /> Copy
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            rows={2}
            value={urlValue}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="Paste Image URL or Base64 data:image/... here"
            className="w-full text-[10px] font-mono p-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none break-all"
          />
        </div>
      </div>

      {/* Adjust Size Slider */}
      {sizeLabel && onChangeSize && sizeValue !== undefined && (
        <div className="w-full pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" /> {sizeLabel}:
            </span>
            <span className="font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
              {sizeValue}px
            </span>
          </div>
          <input
            type="range"
            min={minSize}
            max={maxSize}
            value={sizeValue}
            onChange={(e) => onChangeSize(parseInt(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  school,
  design,
  onSaveSchool,
  onSaveDesign,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...school });
  const [designData, setDesignData] = useState<DesignSettings>({ ...design });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchool(formData);
    onSaveDesign(designData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetAssets = () => {
    if (confirm('Reset logo, signatures, and stamp to official defaults?')) {
      setFormData((prev) => ({
        ...prev,
        logoUrl: DEFAULT_SCHOOL_LOGO,
        principalSignatureUrl: DEFAULT_PRINCIPAL_SIGNATURE,
        classTeacherSignatureUrl: DEFAULT_CLASS_TEACHER_SIGNATURE,
        stampUrl: DEFAULT_SCHOOL_STAMP,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            School Information & Official Assets
          </h2>
          <p className="text-xs text-slate-500">
            Configure school name, address, contact, administrator name, principal signature, teacher signature, and school seal
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Information Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <School className="w-5 h-5 text-blue-700" />
            <h3 className="font-extrabold text-sm text-slate-900">General School Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manager / Director Name (Managed By) *
              </label>
              <input
                type="text"
                required
                value={formData.managedBy}
                onChange={(e) => setFormData({ ...formData, managedBy: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                School Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Contact Mobile *
              </label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={formData.academicSession}
                onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admit Card Number Prefix
              </label>
              <input
                type="text"
                value={formData.admitCardNumberPrefix || 'HDP/2026/'}
                onChange={(e) =>
                  setFormData({ ...formData, admitCardNumberPrefix: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Official Assets Management */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Official Signatures, Seal & School Emblem
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload digital signature or seal images to print them automatically. If left empty, designated signature lines will be printed for manual pen signing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetAssets}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. School Logo */}
            <AssetControlBox
              title="School Emblem / Logo"
              urlValue={formData.logoUrl}
              defaultVal={DEFAULT_SCHOOL_LOGO}
              aspectBox="square"
              sizeLabel="Logo Size"
              sizeValue={designData.logoSize}
              minSize={32}
              maxSize={72}
              onChangeUrl={(val) => setFormData({ ...formData, logoUrl: val })}
              onChangeSize={(size) => setDesignData({ ...designData, logoSize: size })}
            />

            {/* 2. Principal Signature */}
            <AssetControlBox
              title="Principal / Authority Signature"
              urlValue={formData.principalSignatureUrl}
              defaultVal={DEFAULT_PRINCIPAL_SIGNATURE}
              aspectBox="rect"
              onChangeUrl={(val) => setFormData({ ...formData, principalSignatureUrl: val })}
            />

            {/* 3. Class Teacher Signature */}
            <AssetControlBox
              title="Class Teacher Signature"
              urlValue={formData.classTeacherSignatureUrl}
              defaultVal={DEFAULT_CLASS_TEACHER_SIGNATURE}
              aspectBox="rect"
              onChangeUrl={(val) => setFormData({ ...formData, classTeacherSignatureUrl: val })}
            />

            {/* 4. School Stamp / Seal */}
            <AssetControlBox
              title="Official School Stamp / Seal"
              urlValue={formData.stampUrl}
              defaultVal={DEFAULT_SCHOOL_STAMP}
              aspectBox="square"
              sizeLabel="Stamp Size"
              sizeValue={designData.qrSize ? Math.round(designData.qrSize * 0.8) : 40}
              minSize={28}
              maxSize={60}
              onChangeUrl={(val) => setFormData({ ...formData, stampUrl: val })}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save School Settings
          </button>
        </div>
      </form>
    </div>
  );
};
