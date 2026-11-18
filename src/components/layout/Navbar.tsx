import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GothicButton } from '../ui/GothicButton';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#07040c]/80 border-b border-purple-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] group-hover:border-purple-400 transition-all duration-300">
            <img
              src="/hauntly-icon.png"
              alt="Hauntly Icon"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black tracking-widest text-lg bg-gradient-to-r from-purple-100 via-purple-300 to-violet-400 bg-clip-text text-transparent">
              HAUNTLY
            </span>
            <span className="text-[9px] tracking-widest uppercase text-purple-400/50 -mt-1 font-mono">
              Spooky Social Realm
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-purple-300/80">
            <Link to="/" className="hover:text-purple-200 transition-colors">
              The Sanctuary
            </Link>
            <a href="#features" className="hover:text-purple-200 transition-colors">
              Ethereal Powers
            </a>
            <a href="#lore" className="hover:text-purple-200 transition-colors">
              The Lore
            </a>
            <a href="#oauth-guide" className="hover:text-purple-200 transition-colors flex items-center gap-1 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
              OAuth Portal
            </a>
          </nav>
        )}

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <GothicButton variant="secondary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                  Dashboard
                </GothicButton>
              </Link>
              <GothicButton
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="text-purple-300 hover:text-rose-300"
              >
                Depart
              </GothicButton>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/login">
                <GothicButton variant="ghost" size="sm">
                  Enter Crypt
                </GothicButton>
              </Link>
              <Link to="/signup">
                <GothicButton variant="primary" size="sm">
                  Join Coven
                </GothicButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
