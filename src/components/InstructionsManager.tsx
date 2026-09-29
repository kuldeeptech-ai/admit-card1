import React, { useState } from 'react';
import { InstructionItem } from '../types';
import { FileText, Plus, Edit, Trash2, MoveUp, MoveDown, Eye, EyeOff, X } from 'lucide-react';

interface InstructionsManagerProps {
  instructions: InstructionItem[];
  onSaveInstructions: (instructions: InstructionItem[]) => void;
}

export const InstructionsManager: React.FC<InstructionsManagerProps> = ({
  instructions,
  onSaveInstructions,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InstructionItem | null>(null);

  const sortedInstructions = [...instructions].sort((a, b) => a.order - b.order);

  const handleOpenAdd = () => {
    setEditingItem({
      id: `inst-${Date.now()}`,
      text: '',
      isActive: true,
      order: sortedInstructions.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InstructionItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this examination rule / instruction?')) {
      const updated = instructions.filter((i) => i.id !== id);
      onSaveInstructions(updated);
    }
  };

  const handleToggle = (id: string) => {
    const updated = instructions.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i));
    onSaveInstructions(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...sortedInstructions];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[target];
    newItems[target] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    onSaveInstructions(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.text.trim()) return;

    const existingIdx = instructions.findIndex((i) => i.id === editingItem.id);
    if (existingIdx >= 0) {
      const copy = [...instructions];
      copy[existingIdx] = editingItem;
      onSaveInstructions(copy);
    } else {
      onSaveInstructions([...instructions, editingItem]);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Examination Rules & Candidate Instructions
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory guidelines and instructions printed on candidate admit cards. Add, reorder, or toggle rules.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Rule / Instruction
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sortedInstructions.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                item.isActive ? 'hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {item.text}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(item.id)}
                  className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    item.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title={item.isActive ? 'Hide on Admit Card' : 'Show on Admit Card'}
                >
                  {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.isActive ? 'Active on Card' : 'Disabled'}</span>
                </button>

                <div className="flex items-center border border-slate-200 rounded-lg p-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    title="Move Up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === sortedInstructions.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    title="Move Down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Edit Rule"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingItem.text ? 'Edit Examination Instruction' : 'Add New Examination Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruction Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingItem.text}
                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Candidate must bring this Admit Card daily to the examination hall."
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Display on Admit Card</span>
                <input
                  type="checkbox"
                  checked={editingItem.isActive}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  Save Instruction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
