import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
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
  Inbox,
  Smartphone,
  Phone,
  Check
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
    handlePhoneSendOtp,
    handlePhoneVerifyOtp,
    handleEmailSendOtp,
    handleEmailVerifyOtp,
    handleForgotPasswordSendOtp,
    handleForgotPasswordVerifyOtp,
    handleNeonGoogleLogin,
    setIsDevMailboxOpen,
    openLegalPolicy,
    theme
  } = useShop();

  const isDark = theme === 'dark';

  // Mode: 'email' (Personal Gmail / Email) | 'phone' (Mobile Phone OTP)
  const [authMode, setAuthMode] = useState('email');
  // Email auth method: 'password' (standard) | 'otp' (direct 6-digit code via SMTP)
  const [emailAuthMethod, setEmailAuthMethod] = useState('password');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [resetToken, setResetToken] = useState('');

  // OTP Verification State (Phone & Forgot Password)
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: input identifier, 2: OTP + new password
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRefs = useRef([]);

  // Detect personal Gmail
  const isPersonalGmail = email.trim().toLowerCase().endsWith('@gmail.com');
  const isForgotGmail = forgotIdentifier.trim().toLowerCase().endsWith('@gmail.com');

  // Sync initial props
  useEffect(() => {
    if (authInitialEmail) {
      setEmail(authInitialEmail);
      setForgotIdentifier(authInitialEmail);
    }
    if (authResetToken) setResetToken(authResetToken);
    setErrorMsg('');
    setSuccessMsg('');
    setOtpSent(false);
    setEmailOtpSent(false);
    setEmailAuthMethod('password');
    setOtpDigits(['', '', '', '', '', '']);
    setForgotPasswordStep(1);
  }, [authInitialEmail, authResetToken, authModalView, isAuthModalOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (isOtpTimerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setIsOtpTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpTimerActive, otpTimer]);

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
  const pwColors = isDark
    ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-[#007BA7]', 'bg-emerald-400']
    : ['bg-red-500', 'bg-orange-500', 'bg-yellow-600', 'bg-[#CC5500]', 'bg-emerald-600'];

  // Handle 6-digit OTP input change
  const handleOtpDigitChange = (index, val) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Support paste of 6 digits
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split('');
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        next[i] = pasteDigits[i] || '';
      }
      setOtpDigits(next);
      const focusIndex = Math.min(pasteDigits.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned[0];
    setOtpDigits(next);

    // Auto-advance to next box
    if (index < 5 && cleaned[0]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // --- 1. Email Login Submit (Password) ---
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

  // --- 1B. Email Send OTP (Direct SMTP Protocol) ---
  const onSendEmailOtp = async (purpose = 'login') => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid Personal Gmail or Email address.');
      return;
    }
    setSubmitting(true);
    try {
      await handleEmailSendOtp(cleanEmail, purpose);
      setEmailOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setIsOtpTimerActive(true);
      setSuccessMsg(`6-digit passcode dispatched directly to ${cleanEmail} via SMTP.`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch email OTP via SMTP');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 1C. Email Verify OTP (Direct SMTP Protocol) ---
  const onVerifyEmailOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setSubmitting(true);
    try {
      await handleEmailVerifyOtp({
        email: cleanEmail,
        otp: enteredOtp,
        fullName: fullName || undefined,
        rememberMe
      });
    } catch (err) {
      setErrorMsg(err.message || 'Email OTP verification failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 2. Phone Send OTP Submit ---
  const onSendPhoneOtp = async (purpose = 'login') => {
    setErrorMsg('');
    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await handlePhoneSendOtp(fullPhone, purpose);
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setIsOtpTimerActive(true);
      setSuccessMsg(`6-digit code dispatched to ${fullPhone}. Check Dev Mailbox or SMS.`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch phone OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 3. Phone Verify OTP Submit ---
  const onVerifyPhoneOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }
    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
    setSubmitting(true);
    try {
      await handlePhoneVerifyOtp({
        phone: fullPhone,
        otp: enteredOtp,
        fullName: fullName || undefined,
        rememberMe
      });
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 4. Register Submit (Email) ---
  const onRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!agreedToLegal) {
      setErrorMsg('You must agree to the Terms & Conditions and Privacy Policy to create an account.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (pwStrength < 3) {
      setErrorMsg('Please choose a stronger passphrase (minimum 8 chars, uppercase, lowercase, number, special).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await handleRegister({
        email,
        password,
        fullName,
        address: ''
      });
      setSuccessMsg(res.message || 'Account created! Verification instructions dispatched.');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 5. Forgot Password: Step 1 Send OTP ---
  const onForgotSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered Gmail or mobile phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await handleForgotPasswordSendOtp(forgotIdentifier.trim());
      setForgotPasswordStep(2);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60);
      setIsOtpTimerActive(true);
      setSuccessMsg(`Verification code sent to ${forgotIdentifier.trim()}.`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch password recovery code');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 6. Forgot Password: Step 2 Verify OTP & Reset ---
  const onForgotVerifyAndReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (pwStrength < 3) {
      setErrorMsg('Password must be at least 8 characters with upper, lower, digit, and special symbol.');
      return;
    }
    setSubmitting(true);
    try {
      await handleForgotPasswordVerifyOtp({
        identifier: forgotIdentifier.trim(),
        otp: enteredOtp,
        newPassword: password
      });
      setSuccessMsg('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        setAuthModalView('login');
        setPassword('');
        setConfirmPassword('');
      }, 1400);
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 2FA Submit
  const on2FASubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleLogin2FA({ code: totpCode, rememberMe });
    } catch (err) {
      setErrorMsg(err.message || '2FA authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Google OAuth via Neon Auth
  const onGoogleLogin = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await handleNeonGoogleLogin();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initialize Google authentication');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          background: isDark ? 'rgba(2, 2, 2, 0.85)' : 'rgba(12, 12, 12, 0.65)',
          backdropFilter: 'blur(12px)'
        }}
        onClick={closeAuthModal}
      />

      {/* Sovereign Auth Card */}
      <div
        className={`relative z-10 w-full max-w-[480px] rounded-3xl p-7 md:p-8 transition-all duration-300 overflow-hidden ${
          isDark
            ? 'bg-[#0A1218]/95 border border-[#007BA7]/40 text-white shadow-[0_0_50px_rgba(0,123,167,0.2)]'
            : 'bg-[#FFFDD0] border border-[#0C0C0C]/20 text-[#0C0C0C] shadow-[0_20px_60px_rgba(12,12,12,0.15)]'
        }`}
      >
        {/* Accent Luminescent Glow */}
        <div
          className={`pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full blur-[80px] ${
            isDark ? 'bg-gradient-to-br from-[#007BA7]/30 to-[#FF007F]/20' : 'bg-[#CC5500]/15'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
            isDark
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              : 'text-[#0C0C0C]/60 hover:text-[#0C0C0C] hover:bg-[#0C0C0C]/5'
          }`}
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-widest font-mono font-semibold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'border-[#007BA7]/50 text-[#007BA7] bg-[#007BA7]/10'
                  : 'border-[#CC5500]/50 text-[#CC5500] bg-[#CC5500]/10'
              }`}
            >
              Maison Security Vault
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Neon Auth 2.0</span>
          </div>

          <h3 className="text-2xl font-bold font-serif tracking-tight mt-2.5">
            {authModalView === 'login' && 'Welcome Back'}
            {authModalView === 'register' && 'Create Your Maison Account'}
            {authModalView === 'forgot-password' && 'Password Recovery'}
            {authModalView === '2fa' && 'Two-Factor Challenge'}
          </h3>

          <p className="text-xs text-zinc-400 mt-1">
            {authModalView === 'login' && 'Sign in using your Personal Gmail, Phone Number, or credentials.'}
            {authModalView === 'register' && 'Instant registration via Google OAuth or verified Mobile Phone.'}
            {authModalView === 'forgot-password' && 'Reset your password using instant 6-digit OTP verification.'}
            {authModalView === '2fa' && 'Enter the 6-digit authenticator code to access your vault.'}
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOGIN & REGISTER VIEWS */}
        {/* ========================================================================= */}
        {(authModalView === 'login' || authModalView === 'register') && (
          <div className="space-y-4">
            {/* Primary Google / Personal Gmail Neon Auth Button */}
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={submitting}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-3 border shadow-sm ${
                isDark
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-white border-zinc-700/60 hover:border-[#007BA7]/80 hover:shadow-[0_0_15px_rgba(0,123,167,0.25)]'
                  : 'bg-white hover:bg-zinc-50 text-[#0C0C0C] border-zinc-300 hover:border-[#CC5500]/80 hover:shadow-[0_4px_12px_rgba(204,85,0,0.12)]'
              }`}
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Personal Gmail / Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-[1px] bg-zinc-700/40" />
              <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-mono">
                or sign in directly
              </span>
              <div className="flex-1 h-[1px] bg-zinc-700/40" />
            </div>

            {/* Dual Identification Tabs (Gmail/Email vs Phone Number) */}
            <div className={`p-1 rounded-xl flex items-center gap-1 border ${
              isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-200/70 border-zinc-300'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setErrorMsg('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'email'
                    ? isDark
                      ? 'bg-[#007BA7] text-white shadow-[0_0_12px_rgba(0,123,167,0.4)]'
                      : 'bg-[#CC5500] text-white shadow-sm'
                    : isDark
                      ? 'text-zinc-400 hover:text-white'
                      : 'text-zinc-700 hover:text-black'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Personal Gmail / Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setErrorMsg('');
                  setOtpSent(false);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  authMode === 'phone'
                    ? isDark
                      ? 'bg-[#007BA7] text-white shadow-[0_0_12px_rgba(0,123,167,0.4)]'
                      : 'bg-[#CC5500] text-white shadow-sm'
                    : isDark
                      ? 'text-zinc-400 hover:text-white'
                      : 'text-zinc-700 hover:text-black'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Phone (OTP)</span>
              </button>
            </div>

            {/* TAB 1: EMAIL / GMAIL MODE */}
            {authMode === 'email' && (
              <div className="space-y-3.5">
                {/* Method Selector: Password vs Direct SMTP Protocol OTP */}
                <div className={`p-1 rounded-xl flex items-center gap-1 border ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-zinc-200/50 border-zinc-300/80'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMethod('password');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${
                      emailAuthMethod === 'password'
                        ? isDark
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-white text-black shadow-sm'
                        : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Password Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMethod('otp');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      emailAuthMethod === 'otp'
                        ? isDark
                          ? 'bg-[#007BA7] text-white shadow-[0_0_10px_rgba(0,123,167,0.3)]'
                          : 'bg-[#CC5500] text-white shadow-sm'
                        : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Direct OTP (SMTP)</span>
                  </button>
                </div>

                {emailAuthMethod === 'password' ? (
                  /* Standard Password Form */
                  <form onSubmit={authModalView === 'login' ? onLoginSubmit : onRegisterSubmit} className="space-y-3.5">
                    {authModalView === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">Full Legal Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                          <input
                            type="text"
                            required
                            placeholder="Aria Sterling"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                              isDark
                                ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold">Personal Gmail or Email</label>
                        {isPersonalGmail && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1 ${
                            isDark ? 'text-[#007BA7] bg-[#007BA7]/10' : 'text-[#CC5500] bg-[#CC5500]/10'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" /> Personal Gmail Detected
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                        <input
                          type="email"
                          required
                          placeholder="client@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                            isDark
                              ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                              : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold">Password</label>
                        {authModalView === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalView('forgot-password');
                              setForgotIdentifier(email);
                              setErrorMsg('');
                            }}
                            className={`text-xs hover:underline transition-colors ${
                              isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                            }`}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none transition-all border ${
                            isDark
                              ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                              : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Meter for Register */}
                      {authModalView === 'register' && password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400">Strength</span>
                            <span className="font-semibold">{pwLabels[pwStrength]}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1 h-1">
                            {[0, 1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`rounded-full h-full transition-all duration-300 ${
                                  step <= pwStrength ? pwColors[pwStrength] : 'bg-zinc-700/50'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {authModalView === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none transition-all border ${
                              isDark
                                ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Consent & Remember Me */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-zinc-600 text-[#007BA7] focus:ring-0"
                        />
                        <span className="text-zinc-400">Remember session</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailAuthMethod('otp');
                          setErrorMsg('');
                        }}
                        className={`text-[11px] underline hover:opacity-80 ${
                          isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                        }`}
                      >
                        Sign in via SMTP OTP
                      </button>
                    </div>

                    {authModalView === 'register' && (
                      <div className="text-[11px] text-zinc-400 pt-1">
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={agreedToLegal}
                            onChange={(e) => setAgreedToLegal(e.target.checked)}
                            className="mt-0.5 rounded border-zinc-600 text-[#007BA7] focus:ring-0"
                          />
                          <span>
                            I agree to the{' '}
                            <button
                              type="button"
                              onClick={() => openLegalPolicy('terms')}
                              className="underline hover:text-white"
                            >
                              Terms & Conditions
                            </button>{' '}
                            and{' '}
                            <button
                              type="button"
                              onClick={() => openLegalPolicy('privacy')}
                              className="underline hover:text-white"
                            >
                              Privacy Policy (DPDP 2023)
                            </button>
                            .
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isDark
                          ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                          : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                      } disabled:opacity-50`}
                    >
                      {submitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : authModalView === 'login' ? (
                        'Enter Maison Vault'
                      ) : (
                        'Complete Registration'
                      )}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  /* Direct 6-Digit Email OTP via SMTP */
                  <div className="space-y-4">
                    {!emailOtpSent ? (
                      /* Step A: Request Email OTP via SMTP */
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          onSendEmailOtp(authModalView === 'register' ? 'signup' : 'login');
                        }}
                        className="space-y-3.5"
                      >
                        {authModalView === 'register' && (
                          <div>
                            <label className="block text-xs font-semibold mb-1">Full Legal Name</label>
                            <div className="relative">
                              <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                              <input
                                type="text"
                                required
                                placeholder="Aria Sterling"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                                  isDark
                                    ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                    : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold">Personal Gmail or Email</label>
                            {isPersonalGmail && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1 ${
                                isDark ? 'text-[#007BA7] bg-[#007BA7]/10' : 'text-[#CC5500] bg-[#CC5500]/10'
                              }`}>
                                <Sparkles className="w-2.5 h-2.5" /> Personal Gmail Detected
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                            <input
                              type="email"
                              required
                              placeholder="client@gmail.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                                isDark
                                  ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                  : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                              }`}
                            />
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#007BA7] shrink-0" />
                            <span>A 6-digit code will be dispatched directly to your inbox via SMTP.</span>
                          </p>
                        </div>

                        {/* Remember Session */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded border-zinc-600 text-[#007BA7] focus:ring-0"
                            />
                            <span className="text-zinc-400">Remember session</span>
                          </label>
                        </div>

                        {authModalView === 'register' && (
                          <div className="text-[11px] text-zinc-400 pt-1">
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={agreedToLegal}
                                onChange={(e) => setAgreedToLegal(e.target.checked)}
                                className="mt-0.5 rounded border-zinc-600 text-[#007BA7] focus:ring-0"
                              />
                              <span>
                                I agree to the{' '}
                                <button
                                  type="button"
                                  onClick={() => openLegalPolicy('terms')}
                                  className="underline hover:text-white"
                                >
                                  Terms & Conditions
                                </button>{' '}
                                and{' '}
                                <button
                                  type="button"
                                  onClick={() => openLegalPolicy('privacy')}
                                  className="underline hover:text-white"
                                >
                                  Privacy Policy (DPDP 2023)
                                </button>
                                .
                              </span>
                            </label>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                            isDark
                              ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                              : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                          } disabled:opacity-50`}
                        >
                          {submitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Dispatch 6-Digit OTP via SMTP'
                          )}
                          {!submitting && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </form>
                    ) : (
                      /* Step B: 6-Digit Verification for Email OTP */
                      <form onSubmit={onVerifyEmailOtp} className="space-y-4">
                        <div className="text-center">
                          <p className="text-xs text-zinc-400">
                            Enter the 6-digit passcode dispatched via SMTP to{' '}
                            <span className="font-mono font-semibold text-white">
                              {email}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setEmailOtpSent(false)}
                            className={`text-[11px] underline mt-0.5 ${
                              isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                            }`}
                          >
                            Change email address
                          </button>
                        </div>

                        {/* 6-Digit Boxes */}
                        <div className="flex items-center justify-center gap-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => (otpInputRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className={`w-11 h-12 text-center text-lg font-bold rounded-xl border outline-none font-mono transition-all ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-700 focus:border-[#007BA7] focus:ring-2 focus:ring-[#007BA7]/30 text-white'
                                  : 'bg-white border-zinc-300 focus:border-[#CC5500] focus:ring-2 focus:ring-[#CC5500]/30 text-black'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Resend Timer */}
                        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                          <span>Didn't receive code?</span>
                          {isOtpTimerActive ? (
                            <span className="font-mono text-zinc-500">Resend in {otpTimer}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSendEmailOtp(authModalView === 'register' ? 'signup' : 'login')}
                              className={`font-semibold hover:underline ${
                                isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                              }`}
                            >
                              Resend via SMTP
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={submitting || otpDigits.join('').length !== 6}
                          className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                            isDark
                              ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                              : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                          } disabled:opacity-50`}
                        >
                          {submitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Verify OTP & Enter Maison Vault'
                          )}
                          {!submitting && <ShieldCheck className="w-4 h-4" />}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PHONE NUMBER (OTP) MODE */}
            {authMode === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  /* Step A: Input Phone Number */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onSendPhoneOtp(authModalView === 'register' ? 'signup' : 'login');
                    }}
                    className="space-y-3.5"
                  >
                    {authModalView === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">Full Legal Name</label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                          <input
                            type="text"
                            required
                            placeholder="Aria Sterling"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                              isDark
                                ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1">Mobile Phone Number</label>
                      <div className="flex gap-2">
                        <div className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-medium ${
                          isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-black'
                        }`}>
                          <span>🇮🇳</span>
                          <span>{countryCode}</span>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                          <input
                            type="tel"
                            required
                            placeholder="98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all font-mono border ${
                              isDark
                                ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                                : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                            }`}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        A 6-digit one-time verification passcode will be sent via SMS.
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-zinc-600 text-[#007BA7] focus:ring-0"
                        />
                        <span className="text-zinc-400">Remember session</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isDark
                          ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                          : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                      } disabled:opacity-50`}
                    >
                      {submitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Dispatch 6-Digit OTP'
                      )}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  /* Step B: 6-Digit OTP Verification */
                  <form onSubmit={onVerifyPhoneOtp} className="space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-zinc-400">
                        Enter the 6-digit code sent to{' '}
                        <span className="font-mono font-semibold text-white">
                          {countryCode} {phone}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className={`text-[11px] underline mt-0.5 ${
                          isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                        }`}
                      >
                        Change number
                      </button>
                    </div>

                    {/* 6-Digit Boxes */}
                    <div className="flex items-center justify-center gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={`w-11 h-12 text-center text-lg font-bold rounded-xl border outline-none font-mono transition-all ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-700 focus:border-[#007BA7] focus:ring-2 focus:ring-[#007BA7]/30 text-white'
                              : 'bg-white border-zinc-300 focus:border-[#CC5500] focus:ring-2 focus:ring-[#CC5500]/30 text-black'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Resend Timer */}
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                      <span>Didn't receive code?</span>
                      {isOtpTimerActive ? (
                        <span className="font-mono text-zinc-500">Resend in {otpTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSendPhoneOtp(authModalView === 'register' ? 'signup' : 'login')}
                          className={`font-semibold hover:underline ${
                            isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                          }`}
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || otpDigits.join('').length !== 6}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isDark
                          ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                          : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                      } disabled:opacity-50`}
                    >
                      {submitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Verify & Enter Maison'
                      )}
                      {!submitting && <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Dev Mailbox Testing Pill */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              <span className="text-[11px]">Local Dev Testing?</span>
              <button
                type="button"
                onClick={() => setIsDevMailboxOpen(true)}
                className={`font-semibold text-[11px] flex items-center gap-1 hover:underline ${
                  isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Open Dev Mailbox / OTP Log</span>
              </button>
            </div>

            {/* Toggle between Login and Register */}
            <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-700/40">
              {authModalView === 'login' ? (
                <span>
                  Don't have a private account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalView('register');
                      setErrorMsg('');
                    }}
                    className={`font-semibold hover:underline ${
                      isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                    }`}
                  >
                    Open an Account
                  </button>
                </span>
              ) : (
                <span>
                  Already hold credentials?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalView('login');
                      setErrorMsg('');
                    }}
                    className={`font-semibold hover:underline ${
                      isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                    }`}
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORGOT PASSWORD VIEW (MIRRORED OTP VERIFICATION FLOW) */}
        {/* ========================================================================= */}
        {authModalView === 'forgot-password' && (
          <div className="space-y-4">
            {forgotPasswordStep === 1 ? (
              /* Step 1: Identifier Input */
              <form onSubmit={onForgotSendOtp} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Registered Personal Gmail or Phone</label>
                    {isForgotGmail && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1 ${
                        isDark ? 'text-[#007BA7] bg-[#007BA7]/10' : 'text-[#CC5500] bg-[#CC5500]/10'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" /> Personal Gmail
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="client@gmail.com or +919876543210"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all border ${
                        isDark
                          ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                          : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#007BA7] shrink-0" />
                    <span>
                      {forgotIdentifier.includes('@')
                        ? 'Dispatched directly to your inbox via Maison SMTP protocol.'
                        : 'Dispatched directly via SMS to your verified device.'}
                    </span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isDark
                      ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                      : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    forgotIdentifier.includes('@') ? 'Dispatch 6-Digit OTP (via SMTP)' : 'Dispatch 6-Digit OTP'
                  )}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification + New Password */
              <form onSubmit={onForgotVerifyAndReset} className="space-y-3.5">
                <div className="text-center">
                  <p className="text-xs text-zinc-400">
                    Enter the 6-digit passcode dispatched {forgotIdentifier.includes('@') ? 'via SMTP ' : ''}to{' '}
                    <span className="font-mono font-semibold text-white">{forgotIdentifier}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep(1)}
                    className={`text-[11px] underline mt-0.5 ${
                      isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                    }`}
                  >
                    Change recipient
                  </button>
                </div>

                {/* 6-Digit Boxes */}
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-12 text-center text-lg font-bold rounded-xl border outline-none font-mono transition-all ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 focus:border-[#007BA7] focus:ring-2 focus:ring-[#007BA7]/30 text-white'
                          : 'bg-white border-zinc-300 focus:border-[#CC5500] focus:ring-2 focus:ring-[#CC5500]/30 text-black'
                      }`}
                    />
                  ))}
                </div>

                {/* Resend Timer */}
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Didn't receive code?</span>
                  {isOtpTimerActive ? (
                    <span className="font-mono text-zinc-500">Resend in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={onForgotSendOtp}
                      className={`font-semibold hover:underline ${
                        isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                      }`}
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none transition-all border ${
                        isDark
                          ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                          : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Strength</span>
                        <span className="font-semibold">{pwLabels[pwStrength]}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 h-1">
                        {[0, 1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`rounded-full h-full transition-all duration-300 ${
                              step <= pwStrength ? pwColors[pwStrength] : 'bg-zinc-700/50'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs outline-none transition-all border ${
                        isDark
                          ? 'bg-zinc-900/80 border-zinc-700/80 focus:border-[#007BA7] text-white placeholder:text-zinc-600'
                          : 'bg-white border-zinc-300 focus:border-[#CC5500] text-black placeholder:text-zinc-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpDigits.join('').length !== 6}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isDark
                      ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                      : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify OTP & Update Password'
                  )}
                  {!submitting && <Check className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* Back to Sign In */}
            <button
              type="button"
              onClick={() => {
                setAuthModalView('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TWO FACTOR CHALLENGE VIEW */}
        {/* ========================================================================= */}
        {authModalView === '2fa' && (
          <form onSubmit={on2FASubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                {isBackupCodeMode ? 'One-time Backup Code' : '6-digit Authenticator Code'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  required
                  placeholder={isBackupCodeMode ? 'A1B2C3D4' : '123456'}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none font-mono tracking-widest transition-all border ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-white'
                      : 'bg-white border-zinc-300 text-black'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsBackupCodeMode(!isBackupCodeMode)}
                className={`text-xs hover:underline ${
                  isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                }`}
              >
                {isBackupCodeMode ? 'Use Authenticator Code' : 'Use Backup Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                isDark
                  ? 'bg-[#007BA7] hover:bg-[#007BA7]/85 text-white shadow-[0_0_20px_rgba(0,123,167,0.35)]'
                  : 'bg-[#CC5500] hover:bg-[#CC5500]/85 text-white shadow-[0_4px_12px_rgba(204,85,0,0.2)]'
              } disabled:opacity-50`}
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Challenge'}
            </button>

            <button
              type="button"
              onClick={() => setAuthModalView('login')}
              className="w-full py-1 text-xs text-zinc-400 hover:text-white"
            >
              Cancel and Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
