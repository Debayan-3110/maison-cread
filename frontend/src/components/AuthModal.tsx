import React, { useState, useEffect } from 'react';
import {
  X, Lock, Mail, User, ShieldCheck, KeyRound,
  Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight,
  RefreshCw, Sparkles, Inbox
} from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';
import { Button } from './common/Button';

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

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [totpCode, setTotpCode] = useState<string>('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState<boolean>(false);
  const [verifyToken, setVerifyToken] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (authInitialEmail) setEmail(authInitialEmail);
    if (authResetToken) setResetToken(authResetToken);
    setErrorMsg('');
    setSuccessMsg('');
  }, [authInitialEmail, authResetToken, authModalView, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    return score;
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      switch (authModalView) {
        case 'login':
          await handleLogin(email, password, rememberMe);
          break;
        case 'register':
          if (password !== confirmPassword) throw new Error('Passwords do not match');
          await handleRegister(email, password, fullName);
          break;
        case 'verify':
          await handleVerifyEmail(verifyToken);
          break;
        case 'forgot':
          await handleForgotPassword(email);
          break;
        case 'reset':
          await handleResetPassword(resetToken, password);
          break;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-[2px] p-4">
      <div className="bg-panel dark:bg-panel w-full max-w-md rounded-2xl shadow-scrim overflow-hidden transition-all modal-in">
        <div className="relative p-6">
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-recess dark:hover:bg-recess transition-colors"
          >
            <X className="w-5 h-5 text-faint" />
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-accent dark:text-accent mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-body">
              {authModalView === 'login' && 'Welcome Back'}
              {authModalView === 'register' && 'Create Account'}
              {authModalView === 'verify' && 'Verify Email'}
              {authModalView === 'forgot' && 'Reset Password'}
              {authModalView === 'reset' && 'New Password'}
            </h2>
            <p className="text-faint dark:text-quiet mt-2">
              {authModalView === 'login' && 'Enter your credentials to access your account'}
              {authModalView === 'register' && 'Join Maison Cread for an elite shopping experience'}
              {authModalView === 'verify' && 'Enter your verification code to activate your account'}
              {authModalView === 'forgot' && 'Enter your email to receive a reset link'}
              {authModalView === 'reset' && 'Set a strong password to secure your account'}
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {authModalView === 'login' && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-quiet hover:text-faint"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
                    />
                    <span className="text-faint dark:text-quiet group-hover:text-slate-900 dark:group-hover:text-body transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthModalView('forgot')}
                    className="text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}

            {authModalView === 'register' && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-quiet hover:text-faint"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-faint">
                      <span>Password Strength</span>
                      <span>{getPasswordStrength(password)}/4</span>
                    </div>
                    <div className="h-1.5 w-full bg-recess dark:bg-recess rounded-full overflow-hidden flex">
                      {strengthColors.map((color, i) => (
                        <div
                          key={i}
                          className={`h-full w-1/4 transition-all duration-500 ${i < getPasswordStrength(password) ? color : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              </>
            )}

            {authModalView === 'verify' && (
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                  placeholder="Enter verification token"
                  required
                />
              </div>
            )}

            {authModalView === 'forgot' && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                  placeholder="email@example.com"
                  required
                />
              </div>
            )}

            {authModalView === 'reset' && (
              <>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="Enter reset token"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-quiet" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-hairline dark:border-hairline bg-transparent dark:text-body focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="New Password"
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 font-semibold text-lg"
            >
              {submitting ? (
                <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>
                  {authModalView === 'login' && 'Sign In'}
                  {authModalView === 'register' && 'Create Account'}
                  {authModalView === 'verify' && 'Verify Email'}
                  {authModalView === 'forgot' && 'Send Reset Link'}
                  {authModalView === 'reset' && 'Update Password'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-faint dark:text-quiet">
            {authModalView === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthModalView('register')}
                  className="text-accent hover:underline font-medium"
                >
                  Sign up for free
                </button>
              </>
            )}
            {authModalView === 'register' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthModalView('login')}
                  className="text-accent hover:underline font-medium"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
