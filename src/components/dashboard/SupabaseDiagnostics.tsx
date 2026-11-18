import React, { useState } from 'react';
import { GothicCard } from '../ui/GothicCard';
import { GothicBadge } from '../ui/GothicBadge';
import { GothicButton } from '../ui/GothicButton';
import { isSupabaseConfigured, getAuthRedirectUrl, supabase } from '../../lib/supabase';
import { Database, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw, Lock } from 'lucide-react';

export const SupabaseDiagnostics: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [pingMessage, setPingMessage] = useState<string>('');

  const redirectUrl = getAuthRedirectUrl();
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'Not specified';
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  const copyRedirectUrl = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    setPingStatus('testing');
    setPingMessage('');
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        setPingStatus('failed');
        setPingMessage(error.message);
      } else {
        setPingStatus('success');
        setPingMessage('Supabase auth subsystem connected successfully!');
      }
    } catch (err: unknown) {
      setPingStatus('failed');
      setPingMessage(err instanceof Error ? err.message : 'Connection test failed');
    }
  };

  return (
    <GothicCard className="w-full space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-300">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-white text-base">Supabase Conduit Status</h3>
            <p className="text-xs text-purple-400/60">Official Supabase client & environment integrity</p>
          </div>
        </div>

        <GothicBadge
          variant={isSupabaseConfigured ? 'emerald' : 'amber'}
          icon={isSupabaseConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        >
          {isSupabaseConfigured ? 'PRODUCTION CONDUIT ACTIVE' : 'PLACEHOLDER CREDENTIALS'}
        </GothicBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-[#090510] border border-purple-900/40 space-y-1.5">
          <span className="text-purple-400/60 font-mono uppercase tracking-wider block text-[10px]">
            Supabase Project Endpoint
          </span>
          <div className="font-mono text-purple-200 truncate">
            {rawUrl}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#090510] border border-purple-900/40 space-y-1.5">
          <span className="text-purple-400/60 font-mono uppercase tracking-wider block text-[10px] flex items-center justify-between">
            <span>Anon / Publishable Key</span>
            <span className="text-emerald-400 flex items-center gap-1 font-sans">
              <Lock className="w-3 h-3" /> Safe for frontend
            </span>
          </span>
          <div className="font-mono text-purple-300">
            {hasAnonKey ? '••••••••••••••••••••••••••••• [Configured]' : 'Missing'}
          </div>
        </div>
      </div>

      {/* Redirect URL Box */}
      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
            <span>Supabase Authorized Redirect URL</span>
          </span>
          <button
            onClick={copyRedirectUrl}
            className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>
        <div className="font-mono text-xs bg-[#07030c] p-2.5 rounded-lg border border-purple-950 text-purple-300 break-all select-all">
          {redirectUrl}
        </div>
        <p className="text-[11px] text-purple-400/60">
          Add this to your Supabase Dashboard under <strong>Authentication &rarr; URL Configuration &rarr; Redirect URLs</strong>.
        </p>
      </div>

      {/* Connection Test Action */}
      <div className="flex items-center justify-between pt-1">
        <GothicButton
          variant="secondary"
          size="sm"
          onClick={testConnection}
          isLoading={pingStatus === 'testing'}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Verify Auth Conduit
        </GothicButton>

        {pingStatus === 'success' && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {pingMessage}
          </span>
        )}
        {pingStatus === 'failed' && (
          <span className="text-xs text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {pingMessage}
          </span>
        )}
      </div>
    </GothicCard>
  );
};
