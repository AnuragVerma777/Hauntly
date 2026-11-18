import React, { useState } from 'react';
import { GothicCard } from '../ui/GothicCard';
import { GothicBadge } from '../ui/GothicBadge';
import { ShieldAlert, ExternalLink, Copy, Check } from 'lucide-react';
import { getAuthRedirectUrl } from '../../lib/supabase';

export const OAuthSetupGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'google' | 'apple' | 'redirects'>('google');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const appCallbackUrl = getAuthRedirectUrl();
  const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://<your-project>.supabase.co';
  const supabaseOAuthCallback = `${rawSupabaseUrl.replace(/\/$/, '')}/auth/v1/callback`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <GothicCard className="w-full space-y-5" id="oauth-guide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-4">
        <div>
          <h3 className="font-serif font-bold text-white text-lg">OAuth Provider Orchestration Guide</h3>
          <p className="text-xs text-purple-300/70">
            Instructions to configure Google & Apple OAuth credentials directly inside Supabase.
          </p>
        </div>
        <GothicBadge variant="purple">SUPABASE DASHBOARD SETTINGS</GothicBadge>
      </div>

      {/* Security alert banner */}
      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white">Zero Frontend Secrets Guarantee:</strong>
          <p className="text-purple-300/80">
            Never store Google Client Secret or Apple Private Key in your Vite application or git repository.
            OAuth client secrets must strictly reside in your Supabase Dashboard under <em>Authentication &rarr; Providers</em>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-purple-900/50 pb-2">
        <button
          onClick={() => setActiveTab('google')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'google'
              ? 'bg-purple-900/60 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/30'
          }`}
        >
          Google OAuth
        </button>
        <button
          onClick={() => setActiveTab('apple')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'apple'
              ? 'bg-purple-900/60 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/30'
          }`}
        >
          Apple OAuth
        </button>
        <button
          onClick={() => setActiveTab('redirects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'redirects'
              ? 'bg-purple-900/60 text-white border border-purple-600/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/30'
          }`}
        >
          Redirect & Site URLs
        </button>
      </div>

      {/* Google Instructions */}
      {activeTab === 'google' && (
        <div className="space-y-4 text-xs text-purple-200/90 animate-fadeIn">
          <ol className="list-decimal list-inside space-y-3 leading-relaxed">
            <li>
              Navigate to the{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 underline inline-flex items-center gap-1 hover:text-purple-200"
              >
                Google Cloud Console &rarr; APIs & Services &rarr; Credentials <ExternalLink className="w-3 h-3" />
              </a>
              .
            </li>
            <li>
              Click <strong>Create Credentials &rarr; OAuth client ID</strong> and select Application type: <strong>Web application</strong>.
            </li>
            <li>
              Under <strong>Authorized redirect URIs</strong>, add your Supabase project callback URI:
              <div className="mt-1 flex items-center justify-between bg-[#0a0512] p-2 rounded-lg border border-purple-900/60 font-mono text-purple-300">
                <span>{supabaseOAuthCallback}</span>
                <button
                  onClick={() => copyToClipboard(supabaseOAuthCallback, 'google-cb')}
                  className="text-purple-400 hover:text-purple-200 p-1"
                >
                  {copiedUrl === 'google-cb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </li>
            <li>
              Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong>.
            </li>
            <li>
              Open your{' '}
              <a
                href="https://supabase.com/dashboard/project/_/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 underline inline-flex items-center gap-1 hover:text-purple-200"
              >
                Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Google <ExternalLink className="w-3 h-3" />
              </a>
              .
            </li>
            <li>
              Toggle <strong>Enable Google provider</strong> to ON, paste your <strong>Client ID</strong> and <strong>Client Secret</strong>, and click <strong>Save</strong>.
            </li>
          </ol>
        </div>
      )}

      {/* Apple Instructions */}
      {activeTab === 'apple' && (
        <div className="space-y-4 text-xs text-purple-200/90 animate-fadeIn">
          <ol className="list-decimal list-inside space-y-3 leading-relaxed">
            <li>
              Visit the{' '}
              <a
                href="https://developer.apple.com/account/resources/identifiers/list"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 underline inline-flex items-center gap-1 hover:text-purple-200"
              >
                Apple Developer Portal &rarr; Certificates, Identifiers & Profiles <ExternalLink className="w-3 h-3" />
              </a>
              .
            </li>
            <li>
              Register an <strong>App ID</strong> (or use an existing one), then create a <strong>Services ID</strong> with <em>Sign in with Apple</em> enabled.
            </li>
            <li>
              Configure the Services ID: under <strong>Return URLs</strong>, enter:
              <div className="mt-1 flex items-center justify-between bg-[#0a0512] p-2 rounded-lg border border-purple-900/60 font-mono text-purple-300">
                <span>{supabaseOAuthCallback}</span>
                <button
                  onClick={() => copyToClipboard(supabaseOAuthCallback, 'apple-cb')}
                  className="text-purple-400 hover:text-purple-200 p-1"
                >
                  {copiedUrl === 'apple-cb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </li>
            <li>
              Generate and download a private key (<code>.p8</code> file) with Sign in with Apple enabled, noting your <strong>Key ID</strong> and <strong>Team ID</strong>.
            </li>
            <li>
              In{' '}
              <a
                href="https://supabase.com/dashboard/project/_/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 underline inline-flex items-center gap-1 hover:text-purple-200"
              >
                Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Apple <ExternalLink className="w-3 h-3" />
              </a>
              :
              <div className="pl-4 pt-1 space-y-1 text-purple-300/80">
                <p>• Enable Apple provider</p>
                <p>• Services ID: (e.g., com.hauntly.app.web)</p>
                <p>• Secret Key: (paste entire contents of your downloaded .p8 file)</p>
                <p>• Key ID & Team ID</p>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Redirect & Site URLs */}
      {activeTab === 'redirects' && (
        <div className="space-y-4 text-xs text-purple-200/90 animate-fadeIn">
          <p className="leading-relaxed">
            In your Supabase Dashboard under <strong>Authentication &rarr; URL Configuration</strong>, ensure both local and production URLs are whitelisted:
          </p>

          <div className="space-y-2">
            <div>
              <span className="font-semibold text-purple-300 block mb-1">Site URL:</span>
              <div className="flex items-center justify-between bg-[#0a0512] p-2 rounded-lg border border-purple-900/60 font-mono text-purple-300">
                <span>{window.location.origin}</span>
                <button
                  onClick={() => copyToClipboard(window.location.origin, 'site-url')}
                  className="text-purple-400 hover:text-purple-200 p-1"
                >
                  {copiedUrl === 'site-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="font-semibold text-purple-300 block mb-1">Redirect URLs (add to whitelist):</span>
              <div className="flex items-center justify-between bg-[#0a0512] p-2 rounded-lg border border-purple-900/60 font-mono text-purple-300">
                <span>{appCallbackUrl}</span>
                <button
                  onClick={() => copyToClipboard(appCallbackUrl, 'app-cb')}
                  className="text-purple-400 hover:text-purple-200 p-1"
                >
                  {copiedUrl === 'app-cb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-purple-400/50 mt-1">
                Also add your production domain: <code>https://your-domain.com/auth/callback</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </GothicCard>
  );
};
