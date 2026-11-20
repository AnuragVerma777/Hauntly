import React from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  messageText: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  messageText,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-3xl bg-[#140a24] border border-rose-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(225,29,72,0.25)] p-6 text-white space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white tracking-wide">
                Delete Message?
              </h3>
              <p className="text-xs text-rose-300/70">Confirm spectral banishment</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-7 h-7 rounded-full bg-purple-950/60 text-purple-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3.5 rounded-2xl bg-[#090312] border border-purple-900/50 text-xs text-purple-200/90 italic break-words max-h-24 overflow-y-auto">
          &ldquo;{messageText}&rdquo;
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            This message will be banished from the coven forever. Group members will no longer see it.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 border border-rose-500/60 shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isDeleting ? 'Banishing...' : 'Delete Message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
