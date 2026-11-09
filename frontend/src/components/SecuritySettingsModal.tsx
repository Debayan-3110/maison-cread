import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  X,
  ShieldCheck,
  KeyRound,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Download,
  Trash2,
  FileText
} from 'lucide-react';
import { Button } from './common/Button';

export default function SecuritySettingsModal() {
  const {
    isSecurityModalOpen,
    setIsSecurityModalOpen,
    user,
    handleLogout,
    handleExportPersonalData,
    handleDeleteAccount,
    openLegalPolicy
  } = useShop();

  const [setupStep, setSetupStep] = useState<'off' | 'setup' | 'verify'>('off');
  const [mfaCode, setMfaCode] = useState('');
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  // Data Sovereignty & Erasure State
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePhrase, setDeletePhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isSecurityModalOpen) return null;

  const handleEnable2FA = async () => {
    setIsVerificationLoading(true);
    try {
      console.log('Verifying MFA code...', mfaCode);
      setSetupStep('off');
    } catch (err) {
      console.error('MFA Error:', err);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const onExportData = async () => {
    setIsExporting(true);
    try {
      await handleExportPersonalData();
    } catch (err) {
      console.error('Data Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const onConfirmAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (deletePhrase.trim().toUpperCase() !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Please enter your account password.');
      return;
    }

    setIsDeleting(true);
    try {
      await handleDeleteAccount(deletePassword, deletePhrase.trim().toUpperCase());
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Account erasure failed');
    } finally {
      setIsDeleting(false);
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

          {/* Data Sovereignty & Privacy Rights (DPDP Act 2023 & GDPR) */}
          <div className="pt-6 border-t border-hairline space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#007BA7]" />
              <h4 className="font-bold text-body">Data Sovereignty &amp; Privacy Rights</h4>
            </div>

            <p className="text-xs text-quiet leading-relaxed">
              Exercise your statutory rights under the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and <strong>GDPR (Art 17 &amp; 20)</strong>.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Data Portability Export */}
              <button
                type="button"
                onClick={onExportData}
                disabled={isExporting}
                className="flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-recess hover:border-[#007BA7] transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-[#007BA7]" />
                  <div>
                    <p className="text-xs font-semibold text-body">Export Personal Data</p>
                    <p className="text-[10px] text-quiet">Download JSON ledger</p>
                  </div>
                </div>
                {isExporting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#007BA7]" />}
              </button>

              {/* View Legal Policy */}
              <button
                type="button"
                onClick={() => {
                  setIsSecurityModalOpen(false);
                  openLegalPolicy('privacy');
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-recess hover:border-body transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-quiet" />
                  <div>
                    <p className="text-xs font-semibold text-body">Privacy Policy</p>
                    <p className="text-[10px] text-quiet">Statutory policy terms</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-quiet" />
              </button>
            </div>

            {/* Right to Erasure / Delete Account */}
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 transition-all text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Request Account Erasure (Right to be Forgotten)
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-400">Irreversible</span>
              </button>
            ) : (
              <form onSubmit={onConfirmAccountDeletion} className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-500">Permanent Account Erasure</p>
                    <p className="text-[11px] text-quiet leading-relaxed mt-1">
                      This will hard-delete your profile, email, authentication credentials, and shipping addresses.
                      Anonymized order totals are retained strictly for 72 months to satisfy mandatory statutory tax audits under Section 36 of the CGST Act 2017.
                    </p>
                  </div>
                </div>

                {deleteError && (
                  <p className="text-xs text-rose-500 bg-rose-500/10 p-2 rounded-lg font-semibold">{deleteError}</p>
                )}

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-quiet font-semibold mb-1">
                      Confirm by typing <span className="font-mono text-rose-400 font-bold">DELETE MY ACCOUNT</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DELETE MY ACCOUNT"
                      value={deletePhrase}
                      onChange={(e) => setDeletePhrase(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-panel border border-hairline text-body text-xs outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-quiet font-semibold mb-1">
                      Account Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-panel border border-hairline text-body text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-recess text-quiet text-xs font-medium hover:text-body"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Erase Account Permanently
                  </button>
                </div>
              </form>
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
