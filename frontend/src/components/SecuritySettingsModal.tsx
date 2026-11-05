import React, { useState } from 'react';
import { useShop } from '../context/ShopContext.tsx';
import {
  X, ShieldCheck, KeyRound, Lock, AlertCircle, CheckCircle2, RefreshCw, ShieldAlert, ArrowRight
} from 'lucide-react';
import { Button } from './common/Button';

export default function SecuritySettingsModal() {
  const {
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    user,
    handleLogout,
    // We would normally have these in the ShopContext
    // For this conversion, we'll maintain the logic structure
  } = useShop();

  const [setupStep, setSetupStep] = useState<'off' | 'setup' | 'verify'>('off');
  const [mfaCode, setMfaCode] = useState('');
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  if (!isSecurityModalOpen) return null;

  const handleEnable2FA = async () => {
    setIsVerificationLoading(true);
    try {
      // Call logic from ShopContext/Service
      console.log('Verifying MFA code...', mfaCode);
      // In real app: await handleEnable2FA(mfaCode);
      setSetupStep('off');
    } catch (err) {
      console.error('MFA Error:', err);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-scrim backdrop-blur-[3px] backdrop-in phone-xl:items-center phone-xl:p-4 sm:p-6">
      <div className="thin-scroll relative max-h-dvh w-full max-w-lg overflow-y-auto border border-hairline bg-canvas p-4 text-body shadow-scrim backdrop-blur-xl phone-xl:max-h-[90dvh] phone-xl:rounded-[20px] phone-xl:p-6 sm:p-8">

        <div className="flex items-center justify-between pb-6 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-hairline flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-body">Security Settings</h3>
          </div>
          <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 rounded-xl hover:bg-recess transition-colors">
            <X className="w-5 h-5 text-quiet" />
          </button>
        </div>

        <div className="py-8 space-y-8">
          {/* User Profile Card */}
          <div className="card-premium p-5 border border-hairline flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-solid flex items-center justify-center text-on-solid font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-body">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-quiet">{user?.email || 'No email associated'}</p>
            </div>
          </div>

          {/* MFA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-body">Two-Factor Authentication</h4>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                user?.twoFactorEnabled
                  ? 'bg-accent-soft text-success border-hairline'
                  : 'bg-recess text-quiet border-hairline'
              }`}>
                {user?.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <p className="text-xs text-quiet leading-relaxed">
              Add an extra layer of security to your account. We recommend using an authenticator app (Google Authenticator, Authy).
            </p>

            {setupStep === 'off' && !user?.twoFactorEnabled && (
              <Button onClick={() => setSetupStep('setup')} className="w-full py-3 bg-solid hover:opacity-90 text-on-solid font-bold text-xs rounded-xl transition-all">
                Enable 2FA Now
              </Button>
            )}

            {setupStep === 'setup' && (
              <div className="bg-recess p-5 rounded-2xl border border-hairline space-y-4 menu-in">
                <div className="flex items-center gap-3 text-accent text-sm font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Setup Instructions</span>
                </div>
                <div className="text-xs text-body space-y-2 leading-relaxed">
                  <p>1. Install a TOTP Authenticator app.</p>
                  <p>2, Scan the QR code or enter the secret key in your app.</p>
                  <p>3, Enter the 6-digit code provided by the app below.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl bg-panel border border-hairline text-body text-sm outline-none focus:border-accent"
                  />
                  <Button onClick={handleEnable2FA} disabled={isVerificationLoading} className="px-4 py-2 bg-solid text-on-solid text-xs font-bold rounded-xl">
                    {isVerificationLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="pt-6 border-t border-hairline space-y-3">
            <button
              onClick={() => handleLogout()}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#9B3B22]/10 border border-hairline text-[#9B3B22] hover:bg-[#9B3B22]/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-sm font-bold">Sign Out of All Sessions</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
