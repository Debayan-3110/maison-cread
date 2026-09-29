import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext.tsx';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalView,
    setAuthModalView,
    authInitialEmail,
    authResetToken,
    handleLogin,
    handleLogin2FA,
    handleRegister,
    handleVerifyEmail,
    handleResendVerification,
    handleForgotPassword,
    handleResetPassword,
    setIsDevMailboxOpen
  } = useShop();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [resetToken, setResetToken] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync initial props
  useEffect(() => {
    if (authInitialEmail) setEmail(authInitialEmail);
    if (authResetToken) setResetToken(authResetToken);
    setErrorMsg('');
    setSuccessMsg('');
  }, [authInitialEmail, authResetToken, authModalView, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Password strength evaluation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;
    return score;
  };

  const pwStrength = getPasswordStrength(password);
  const pwLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const pwColors = ['bg-[#9B3B22]', 'bg-accent', 'bg-accent', 'bg-success', 'bg-accent'];

  // Handle Login Submit
  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleLogin({ email, password, rememberMe });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle 2FA Submit
  const on2FASubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleLogin2FA({ code: totpCode, rememberMe });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid 2FA code');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Register Submit
  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (pwStrength < 4) {
      setErrorMsg('Please choose a stronger password meeting all security requirements.');
      return;
    }

    setSubmitting(true);
    try {
      await handleRegister({ email, password, fullName });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Forgot Password Submit
  const onForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleForgotPassword(email);
      setSuccessMsg('Reset instructions dispatched! Check the Developer Mailbox to reset.');
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset link');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reset Password Submit
  const onResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await handleResetPassword({ token: resetToken, newPassword: password });
    } catch (err) {
      setErrorMsg(err.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Direct Verify Email Submit
  const onVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleVerifyEmail(verifyToken);
    } catch (err) {
      setErrorMsg(err.message || 'Verification token invalid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-[3px] backdrop-in">
      <div className="relative w-full max-w-md bg-canvas border border-hairline rounded-[20px] p-6 sm:p-8 shadow-scrim backdrop-blur-xl text-body overflow-hidden">
        
        <div className="texture-grain pointer-events-none absolute inset-0 opacity-40" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          className="btn-ghost absolute right-4 top-4 h-9 w-9 rounded-full p-0"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Header Branding */}
        <div className="relative mb-8">
          <p className="eyebrow">Client access</p>
          <h3 className="title-editorial mt-3 text-[26px] leading-tight">
            {authModalView === 'login' && 'Welcome back'}
            {authModalView === 'register' && 'Open an account'}
            {authModalView === '2fa' && 'Two-factor challenge'}
            {authModalView === 'forgot-password' && 'Reset your password'}
            {authModalView === 'reset-password' && 'Choose a new password'}
            {authModalView === 'verify-email' && 'Verify your email'}
          </h3>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-quiet">
            {authModalView === 'login' && 'Encrypted session, revocable at any time'}
            {authModalView === 'register' && 'Open a private account with the maison'}
            {authModalView === '2fa' && 'Enter the six-digit code from your authenticator'}
            {authModalView === 'forgot-password' && 'We will send a one-time reset token to your inbox'}
            {authModalView === 'reset-password' && 'Choose a passphrase you do not use elsewhere'}
            {authModalView === 'verify-email' && 'Confirm the code we sent to activate your account'}
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#9B3B22]/15 border border-hairline text-[#9B3B22] text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#9B3B22] mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-success/15 border border-hairline text-success text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. SIGN IN VIEW */}
        {/* ========================================================================= */}
        {authModalView === 'login' && (
          <form onSubmit={onLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-body mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-body">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthModalView('forgot-password'); setErrorMsg(''); }}
                  className="text-xs text-accent hover:text-accent transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-quiet hover:text-body"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-accent bg-recess border-hairline focus:ring-accent focus:ring-offset-0"
                />
                <span className="text-xs text-body">Remember me for 30 days</span>
              </label>

              <button
                type="button"
                onClick={() => setIsDevMailboxOpen(true)}
                className="text-xs text-accent/80 hover:text-accent flex items-center gap-1"
                title="Open simulated testing emails"
              >
                <Inbox className="w-3.5 h-3.5" /> Dev Mailbox
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-solid text-on-solid font-semibold text-sm shadow-quiet transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Register */}
            <div className="pt-3 text-center text-xs text-quiet border-t border-hairline">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthModalView('register'); setErrorMsg(''); }}
                className="font-bold text-accent hover:text-accent ml-1"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 2. SIGN UP VIEW */}
        {/* ========================================================================= */}
        {authModalView === 'register' && (
          <form onSubmit={onRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-body mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-quiet hover:text-body"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-quiet">Strength:</span>
                    <span className="font-semibold text-accent">{pwLabels[Math.max(0, pwStrength - 1)] || 'Weak'}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full transition-all duration-300 ${
                          lvl <= pwStrength ? pwColors[pwStrength - 1] : 'bg-recess'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[10px] text-quiet pt-1">
                    <span className={password.length >= 8 ? 'text-success' : ''}>• 8+ characters</span>
                    <span className={/[A-Z]/.test(password) ? 'text-success' : ''}>• Uppercase letter</span>
                    <span className={/\d/.test(password) ? 'text-success' : ''}>• Number</span>
                    <span className={/[!@#$%^&*]/.test(password) ? 'text-success' : ''}>• Special character</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-solid text-on-solid font-semibold text-sm shadow-quiet transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-quiet border-t border-hairline">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthModalView('login'); setErrorMsg(''); }}
                className="font-bold text-accent hover:text-accent ml-1"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 3. TWO-FACTOR AUTHENTICATION CHALLENGE */}
        {/* ========================================================================= */}
        {authModalView === '2fa' && (
          <form onSubmit={on2FASubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-accent-soft border border-hairline text-accent text-xs flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-accent shrink-0" />
              <span>
                {isBackupCodeMode
                  ? 'Enter one of your 8-character backup recovery codes.'
                  : 'Open your Authenticator app (Google Authenticator, Authy) and enter the current 6-digit code.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1.5">
                {isBackupCodeMode ? 'Backup Code (e.g. A1B2-C3D4)' : '6-Digit TOTP Code'}
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={isBackupCodeMode ? 12 : 6}
                placeholder={isBackupCodeMode ? 'XXXX-XXXX' : '000000'}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.toUpperCase())}
                className="w-full text-center tracking-[0.25em] text-2xl font-mono py-3 rounded-xl bg-recess/90 border border-hairline focus:border-accent focus:ring-2 focus:ring-accent/20 text-body outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCodeMode(!isBackupCodeMode);
                  setTotpCode('');
                  setErrorMsg('');
                }}
                className="text-accent hover:text-accent"
              >
                {isBackupCodeMode ? 'Use Authenticator Code instead' : 'Lost your phone? Use Backup Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || !totpCode.trim()}
              className="w-full py-3 rounded-xl bg-solid text-on-solid font-semibold text-sm shadow-quiet transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setAuthModalView('login')}
              className="w-full py-2 text-xs text-quiet hover:text-body"
            >
              Cancel and back to login
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 4. FORGOT PASSWORD VIEW */}
        {/* ========================================================================= */}
        {authModalView === 'forgot-password' && (
          <form onSubmit={onForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-body mb-1.5">Enter Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-quiet" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-recess border border-hairline/70 focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm text-body placeholder:text-faint outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-recess border border-hairline/60 text-quiet text-xs flex items-center justify-between">
              <span>Testing without real email?</span>
              <button
                type="button"
                onClick={() => setIsDevMailboxOpen(true)}
                className="text-accent font-semibold hover:underline flex items-center gap-1"
              >
                <Inbox className="w-3.5 h-3.5" /> Open Dev Mailbox
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-solid text-on-solid font-semibold text-sm shadow-quiet transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Instructions'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthModalView('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="w-full py-2 text-xs text-quiet hover:text-body"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 5. RESET PASSWORD VIEW */}
        {/* ========================================================================= */}
        {authModalView === 'reset-password' && (
          <form onSubmit={onResetSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-body mb-1">Reset Token</label>
              <input
                type="text"
                required
                placeholder="Token from email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-recess border border-hairline/70 text-xs font-mono text-body"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="Enter new strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-recess border border-hairline/70 text-sm text-body"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-body mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-recess border border-hairline/70 text-sm text-body"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-solid text-on-solid font-semibold text-sm shadow-quiet transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthModalView('login'); setErrorMsg(''); }}
              className="w-full py-2 text-xs text-quiet hover:text-body"
            >
              Cancel and Sign In
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 6. VERIFY EMAIL VIEW */}
        {/* ========================================================================= */}
        {authModalView === 'verify-email' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-accent-soft border border-accent/20 text-center">
              <Mail className="w-10 h-10 text-accent mx-auto mb-2" />
              <h4 className="text-sm font-bold text-body mb-1">Verification Link Dispatched</h4>
              <p className="text-xs text-quiet">
                We sent a secure verification code to <span className="text-accent font-semibold">{email || 'your email'}</span>.
              </p>
            </div>

            <form onSubmit={onVerifySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-body mb-1">Paste Verification Token</label>
                <input
                  type="text"
                  required
                  placeholder="Paste token here"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-recess border border-hairline/70 text-xs font-mono text-body"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !verifyToken.trim()}
                className="w-full py-2.5 rounded-xl bg-solid hover:opacity-90 text-on-solid font-semibold text-sm transition-all"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Verification'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => handleResendVerification(email)}
                className="text-accent hover:text-accent"
              >
                Resend verification email
              </button>
              <button
                type="button"
                onClick={() => setIsDevMailboxOpen(true)}
                className="text-success hover:text-success font-semibold flex items-center gap-1"
              >
                <Inbox className="w-3.5 h-3.5" /> View in Dev Mailbox
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setAuthModalView('login'); setErrorMsg(''); }}
              className="w-full py-2 text-xs text-quiet hover:text-body"
            >
              Done / Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
