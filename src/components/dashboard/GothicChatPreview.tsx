import React, { useState } from 'react';
import { GothicCard } from '../ui/GothicCard';
import { GothicButton } from '../ui/GothicButton';
import { Hash, Send, Ghost, Moon, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  sender: string;
  avatarSeed: number;
  time: string;
  text: string;
  isSelf?: boolean;
}

export const GothicChatPreview: React.FC = () => {
  const { user } = useAuth();
  const userName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'You';

  const [activeChannel, setActiveChannel] = useState<'crypt' | 'seance' | 'whispers'>('crypt');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'LadyRaven',
      avatarSeed: 12,
      time: 'Midnight + 4m',
      text: 'Has anyone attuned to the spectral frequency in the catacombs tonight?',
    },
    {
      id: '2',
      sender: 'GrimHerald',
      avatarSeed: 88,
      time: 'Midnight + 7m',
      text: 'The veil is remarkably thin tonight. Supabase authentication rituals hold firm against rogue entities.',
    },
    {
      id: '3',
      sender: 'PhantomScribe',
      avatarSeed: 44,
      time: 'Midnight + 11m',
      text: 'OAuth conduits established. The coven awaits the next soul.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: userName,
      avatarSeed: 999,
      time: 'Just now',
      text: inputVal.trim(),
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');
  };

  return (
    <GothicCard className="w-full p-0 overflow-hidden border border-purple-900/50 flex flex-col md:flex-row min-h-[500px]">
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 bg-[#08040f] border-b md:border-b-0 md:border-r border-purple-900/40 p-4 flex flex-col">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-purple-900/30">
          <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-700/40 flex items-center justify-center text-purple-400">
            <Radio className="w-4 h-4 animate-pulse text-purple-400" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-white tracking-wider uppercase">Coven Frequencies</h4>
            <p className="text-[10px] text-purple-400/50">Spectral Channels</p>
          </div>
        </div>

        <div className="space-y-1.5 flex-1">
          <button
            onClick={() => setActiveChannel('crypt')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeChannel === 'crypt'
                ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-purple-400" /> the-crypt
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            onClick={() => setActiveChannel('seance')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeChannel === 'seance'
                ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-purple-400" /> midnight-seance
            </span>
            <span className="text-[10px] text-purple-400/40">3 online</span>
          </button>

          <button
            onClick={() => setActiveChannel('whispers')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeChannel === 'whispers'
                ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-purple-400/70 hover:text-purple-200 hover:bg-purple-950/30'
            }`}
          >
            <span className="flex items-center gap-2">
              <Ghost className="w-3.5 h-3.5 text-purple-400" /> eerie-whispers
            </span>
            <span className="text-[10px] text-purple-400/40">Encrypted</span>
          </button>
        </div>

        <div className="pt-4 border-t border-purple-900/30 text-[11px] text-purple-400/50 flex items-center gap-2">
          <Ghost className="w-3.5 h-3.5 text-purple-400" />
          <span>Hauntly Core Messaging v1.0</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b0614]/90 justify-between">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-purple-900/40 bg-[#090510]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-400" />
            <span className="font-serif font-bold text-white text-sm">the-crypt</span>
            <span className="text-xs text-purple-400/50 ml-2">Where spirits exchange dark enchantments</span>
          </div>
          <span className="text-[11px] font-mono text-purple-400/60 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-900/50">
            Encrypted with Supabase JWT
          </span>
        </div>

        {/* Message Feed */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[350px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 items-start ${m.isSelf ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-serif font-bold shrink-0 shadow-md ${
                  m.isSelf
                    ? 'bg-purple-700 text-white border border-purple-400/40'
                    : 'bg-[#180d29] text-purple-300 border border-purple-900/60'
                }`}
              >
                {m.sender.charAt(0).toUpperCase()}
              </div>

              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.isSelf
                    ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-purple-100 rounded-tr-none border border-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-[#130921]/90 text-purple-200 rounded-tl-none border border-purple-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-purple-400/60">
                  <span className="font-semibold text-purple-300">{m.sender}</span>
                  <span>{m.time}</span>
                </div>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#08040e] border-t border-purple-900/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Whisper a haunting message into the crypt..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#10071c] border border-purple-900/60 hover:border-purple-700/60 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-purple-100 placeholder-purple-400/30 outline-none transition-all"
          />
          <GothicButton type="submit" variant="primary" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
            Transmit
          </GothicButton>
        </form>
      </div>
    </GothicCard>
  );
};
