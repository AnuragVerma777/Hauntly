import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FriendsHub } from '../components/friends/FriendsHub';
import { GothicChatPreview } from '../components/dashboard/GothicChatPreview';
import {
  Ghost,
  MessageSquare,
  Users,
  Compass,
  Settings,
  Moon,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

// ── Sidebar Nav Item ───────────────────────────────────────────────────────────
const SideNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200 cursor-pointer border-0 bg-transparent ${
      active
        ? 'bg-purple-700/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
        : 'text-purple-400/60 hover:text-purple-200 hover:bg-purple-900/30'
    }`}
    title={label}
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-[9px] font-semibold tracking-wide uppercase leading-tight">{label}</span>
  </button>
);

export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div
      className="fixed inset-0 z-[50] flex overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top right, #1e0a3c 0%, #110320 50%, #07030f 100%)',
      }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-800/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-800/6 rounded-full blur-3xl" />
        {/* Top right moon */}
        <div
          className="absolute top-4 right-12 w-24 h-24 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, #c084fc 0%, #9333ea 50%, transparent 100%)',
            filter: 'blur(4px)',
            boxShadow: '0 0 50px 15px rgba(168,85,247,0.3)',
          }}
        />
        {['8%,65%', '5%,78%'].map((pos, i) => {
          const [top, left] = pos.split(',');
          return <span key={i} className="absolute text-purple-800 opacity-30" style={{ top, left, fontSize: '14px' }}>🦇</span>;
        })}
      </div>

      {/* ── Left Sidebar ── */}
      <aside
        className="relative z-10 w-20 flex-shrink-0 flex flex-col items-center py-5 gap-1 border-r border-purple-900/50"
        style={{ background: 'rgba(8,3,18,0.95)' }}
      >
        {/* Logo */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <img src="/hauntly-icon.png" alt="Hauntly" className="w-full h-full object-cover" />
          </div>
        </div>

        <SideNavItem icon={<Ghost className="w-5 h-5" />} label="Home" onClick={() => navigate('/')} />
        <SideNavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active />
        <SideNavItem icon={<MessageSquare className="w-5 h-5" />} label="Chats" />
        <SideNavItem icon={<Users className="w-5 h-5" />} label="Friends" />
        <SideNavItem icon={<Compass className="w-5 h-5" />} label="Explore" />
        <SideNavItem icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => navigate('/profile')} />

        <div className="mt-auto flex flex-col gap-1 w-full">
          <SideNavItem icon={<Moon className="w-5 h-5" />} label="Theme" />
          <SideNavItem icon={<LogOut className="w-5 h-5" />} label="Sign Out" onClick={handleSignOut} />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div
        className="relative z-10 flex-1 flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(14,5,28,0.97) 0%, rgba(9,3,18,0.97) 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h1 className="text-2xl font-serif font-black text-white tracking-wide">The Coven Chamber</h1>
            </div>
            <p className="text-xs text-purple-300/60">
              Bond with companions, transmit spectral whispers, and manage your circle.
            </p>
          </div>

          {/* Profile button */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/40 text-purple-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <UserCircle className="w-3.5 h-3.5 text-purple-400" />
            My Profile
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-800/40 to-transparent mx-8 flex-shrink-0 mb-1" />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-6">
          {/* Friends Hub */}
          {user && <FriendsHub currentUserId={user.id} />}

          {/* Chat Preview */}
          <section id="chat" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Ghostly Transmissions
              </h2>
              <span className="text-xs text-purple-400/60 font-mono">Real-time spectral feed</span>
            </div>
            <GothicChatPreview />
          </section>
        </div>
      </div>
    </div>
  );
};
