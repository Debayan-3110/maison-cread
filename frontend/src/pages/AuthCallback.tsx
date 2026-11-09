import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { verifyNeonAuthSessionAPI } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { ShieldCheck, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const { setUser, showToast } = useShop();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function processOAuthCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

        const token = urlParams.get('token') || hashParams.get('token') || urlParams.get('access_token');
        const sessionToken = urlParams.get('session') || urlParams.get('sessionToken') || hashParams.get('session');

        const result = await verifyNeonAuthSessionAPI({
          token: token || undefined,
          sessionToken: sessionToken || undefined,
          rememberMe: true
        });

        if (!isMounted) return;

        if (result && result.user) {
          setUser(result.user);
          setStatus('success');
          showToast(`Welcome to Maison Cread, ${result.user.fullName || result.user.email}!`, 'success');

          // Smooth navigation back to boutique storefront
          setTimeout(() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }, 1200);
        } else {
          throw new Error('Invalid user profile claims returned from Neon Auth.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('OAuth Callback Error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Neon Auth authentication could not be completed.');
        showToast(err.message || 'Authentication error', 'error');
      }
    }

    processOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [setUser, showToast]);

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Top Bar with Theme Toggle & Return */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="text-xs font-semibold text-quiet hover:text-body transition-colors"
        >
          ← Return to Boutique
        </button>
        <ThemeToggle />
      </div>

      {/* Background Cyber-Luxury Glow Streaks */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-r from-[#007BA7]/15 via-[#FF007F]/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-panel border border-hairline rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#007BA7]/40 animate-ping opacity-30" />
              <div className="w-14 h-14 rounded-full border-2 border-t-[#007BA7] border-r-[#FF007F] border-b-transparent border-l-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#007BA7]" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-wider uppercase font-serif text-body">
                Maison Identity Vault
              </h2>
              <p className="text-xs text-quiet mt-2 font-mono">
                Verifying cryptographic claims via Neon Auth JWKS...
              </p>
            </div>

            <div className="w-full bg-zinc-900/80 rounded-full h-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#007BA7] to-[#FF007F] animate-pulse w-full" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-[#007BA7]/20 border border-[#007BA7] text-[#007BA7] mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,123,167,0.4)]">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-wider uppercase font-serif text-body">
                Sovereign Access Granted
              </h2>
              <p className="text-xs text-quiet mt-1">
                Your personal Google account has been authenticated. Redirecting to storefront...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-wider uppercase font-serif text-body">
                Authentication Incomplete
              </h2>
              <p className="text-xs text-red-500 dark:text-red-300/80 mt-2 font-mono">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#007BA7] hover:bg-[#007BA7]/80 text-white font-medium text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,123,167,0.3)]"
            >
              <span>Return to Storefront</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

