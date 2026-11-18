import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07040c] flex flex-col items-center justify-center text-center p-4">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border border-purple-500/50 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.45)]">
            <img src="/hauntly-icon.png" alt="Hauntly Mascot" className="w-full h-full object-cover animate-ghostly-float" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-purple-500/30 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <h3 className="text-lg font-serif font-bold text-white mb-2">Piercing the Veil</h3>
        <p className="text-sm text-purple-300/60 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Attuning to your spectral frequency...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
