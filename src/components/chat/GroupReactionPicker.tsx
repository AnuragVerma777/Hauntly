import React from 'react';

interface GroupReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const REACTION_EMOJIS = ['🎃', '👻', '🦇', '🔥', '❤️', '👍', '💀', '🌙'];

export const GroupReactionPicker: React.FC<GroupReactionPickerProps> = ({
  onSelectEmoji,
  onClose,
}) => {
  return (
    <div
      className="flex items-center gap-1 p-1.5 rounded-full bg-[#180a30] border border-purple-600/50 shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(168,85,247,0.35)] backdrop-blur-md animate-scaleIn z-30"
      onMouseLeave={onClose}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-purple-800/60 hover:scale-125 transition-all cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
