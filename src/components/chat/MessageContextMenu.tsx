import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  Sparkles,
  Copy,
  ChevronRight,
  Languages,
  FileText,
  Lock,
  Ghost,
  MessageSquare,
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface MessageContextMenuProps {
  position: ContextMenuPosition;
  messageId: string;
  messageText: string;
  isSelf: boolean;
  onClose: () => void;
  onDeleteRequest: (messageId: string, messageText: string) => void;
  onCopyRequest: (text: string) => void;
  onAiTranslateRequest: (text: string) => void;
  onAiSummariseRequest: (text: string) => void;
  onAiRewriteRequest?: (text: string) => void;
  onAiRepliesRequest?: (text: string) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  position,
  messageId,
  messageText,
  isSelf,
  onClose,
  onDeleteRequest,
  onCopyRequest,
  onAiTranslateRequest,
  onAiSummariseRequest,
  onAiRewriteRequest,
  onAiRepliesRequest,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isAiSubmenuOpen, setIsAiSubmenuOpen] = useState(true); // Default open as shown in concept
  const [adjustedPos, setAdjustedPos] = useState({ top: position.y, left: position.x });

  // Boundary check to prevent menu from overflowing viewport
  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const rect = menuEl.getBoundingClientRect();
    const menuWidth = rect.width || 240;
    const menuHeight = rect.height || 300;

    const padding = 12;
    let left = position.x;
    let top = position.y;

    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    if (top + menuHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    setAdjustedPos({ top, left });
  }, [position, isAiSubmenuOpen]);

  // Click outside & Escape key listeners
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${adjustedPos.top}px`,
        left: `${adjustedPos.left}px`,
        zIndex: 9999,
      }}
      className="w-56 sm:w-60 rounded-2xl bg-[#1b122e] border border-purple-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(147,51,234,0.25)] p-2 text-white animate-fadeIn select-none backdrop-blur-xl"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Label: Right-click menu */}
      <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-semibold text-purple-300/80 tracking-wide">
        Right-click menu
      </div>

      {/* ── 1. DELETE OPTION ── */}
      <div className="mb-1">
        {isSelf ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteRequest(messageId, messageText);
            }}
            className="w-full text-left p-2 rounded-xl hover:bg-rose-950/40 active:bg-rose-900/60 transition-colors group cursor-pointer"
          >
            <div className="text-rose-400 group-hover:text-rose-300 transition-colors mb-0.5">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-rose-200 group-hover:text-white">
              Delete
            </span>
          </button>
        ) : (
          <div
            className="w-full text-left p-2 rounded-xl opacity-40 cursor-not-allowed"
            title="Only your own messages can be banished"
          >
            <div className="text-rose-400 mb-0.5 flex items-center justify-between">
              <Trash2 className="w-4 h-4" />
              <Lock className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              Delete (Own only)
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-purple-900/50 my-1" />

      {/* ── 2. AI FEATURES ── */}
      <div className="my-1">
        <button
          type="button"
          onClick={() => setIsAiSubmenuOpen((prev) => !prev)}
          className="w-full text-left p-2 rounded-xl hover:bg-purple-900/40 active:bg-purple-800/60 transition-colors group flex items-start justify-between cursor-pointer"
        >
          <div>
            <div className="text-purple-400 group-hover:text-purple-300 transition-colors mb-0.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#d4ff32]" />
              <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                Gemini
              </span>
            </div>
            <span className="text-xs font-semibold text-white">AI Features</span>
          </div>
          <ChevronRight
            className={`w-3.5 h-3.5 text-purple-400/80 transition-transform duration-200 mt-1 ${
              isAiSubmenuOpen ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* AI Features Submenu */}
        {isAiSubmenuOpen && (
          <div className="mt-1 mx-1 p-1 rounded-xl bg-[#110822] border border-purple-900/40 space-y-0.5 animate-fadeIn">
            {/* Translate Option */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onAiTranslateRequest(messageText);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-purple-900/50 active:bg-purple-800/70 transition-colors group cursor-pointer"
            >
              <div className="text-purple-300 group-hover:text-purple-200 mb-0.5">
                <Languages className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                Translate
              </span>
            </button>

            {/* Summarise Option */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onAiSummariseRequest(messageText);
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-purple-900/50 active:bg-purple-800/70 transition-colors group cursor-pointer"
            >
              <div className="text-purple-300 group-hover:text-purple-200 mb-0.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                Summarise
              </span>
            </button>

            {/* Ghost Rewrite Option */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAiRewriteRequest) {
                  onAiRewriteRequest(messageText);
                } else {
                  onAiTranslateRequest(messageText);
                }
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-purple-900/50 active:bg-purple-800/70 transition-colors group cursor-pointer"
            >
              <div className="text-purple-300 group-hover:text-purple-200 mb-0.5">
                <Ghost className="w-3.5 h-3.5 text-[#d4ff32]" />
              </div>
              <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                Ghost Rewrite
              </span>
            </button>

            {/* Smart Replies Option */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAiRepliesRequest) {
                  onAiRepliesRequest(messageText);
                } else {
                  onAiSummariseRequest(messageText);
                }
              }}
              className="w-full text-left p-2 rounded-lg hover:bg-purple-900/50 active:bg-purple-800/70 transition-colors group cursor-pointer"
            >
              <div className="text-purple-300 group-hover:text-purple-200 mb-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                Smart Replies
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-purple-900/50 my-1" />

      {/* ── 3. COPY OPTION ── */}
      <div className="mt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onCopyRequest(messageText);
          }}
          className="w-full text-left p-2 rounded-xl hover:bg-purple-900/40 active:bg-purple-800/60 transition-colors group cursor-pointer"
        >
          <div className="text-purple-400 group-hover:text-purple-300 transition-colors mb-0.5">
            <Copy className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">Copy</span>
        </button>
      </div>
    </div>
  );
};
