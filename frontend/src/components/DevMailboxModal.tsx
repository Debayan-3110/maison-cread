import React, { useEffect } from 'react';
import { useShop } from '../context/ShopContext.tsx';
import {
  X, Inbox, Mail, CheckCircle2, KeyRound,
  RefreshCw, ExternalLink, ArrowRight, ShieldAlert
} from 'lucide-react';

export default function DevMailboxModal() {
  const {
    isDevMailboxOpen,
    setIsDevMailboxOpen,
    devEmails,
    refreshDevEmails,
    handleVerifyEmail,
    openAuthModal,
    showToast
  } = useShop();

  useEffect(() => {
    if (isDevMailboxOpen) {
      refreshDevEmails();
    }
  }, [isDevMailboxOpen, refreshDevEmails]);

  if (!isDevMailboxOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-scrim backdrop-blur-[3px] backdrop-in phone-xl:items-center phone-xl:p-4 sm:p-6">
      <div className="relative flex max-h-dvh w-full max-w-2xl flex-col border border-hairline bg-canvas p-4 text-body shadow-scrim backdrop-blur-xl phone-xl:max-h-[88dvh] phone-xl:rounded-[20px] phone-xl:p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-hairline shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-hairline flex items-center justify-center text-accent">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-body">Developer Testing Mailbox</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-success/15 text-success border border-hairline">
                  LIVE INTERCEPTOR
                </span>
              </div>
              <p className="text-xs text-quiet">
                Simulated emails for email verification and password resets
              </p>
            </div>
          </div>
          <button onClick={() => setIsDevMailboxOpen(false)} className="p-2 rounded-xl hover:bg-recess transition-colors">
            <X className="w-5 h-5 text-quiet" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {devEmails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-20 h-20 rounded-full bg-recess/50 flex items-center justify-center text-faint">
                <Mail className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-body">No Emails Found</h3>
              <p className="text-xs text-quiet max-w-xs">
                Perform an action like Registration or Password Reset to see intercepted emails here.
              </p>
            </div>
          ) : (
            devEmails.map((email: any, idx: number) => (
              <div key={idx} className="card-premium p-4 border border-hairline hover:border-accent transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-body">{email.recipient}</span>
                  </div>
                  <span className="text-[10px] text-faint">{email.timestamp || 'Just now'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-sm font-semibold text-body truncate flex-1">{email.subject}</h4>
                  <div className="flex gap-2 shrink-0">
                    {email.email_type === 'verification' && (
                      <button
                        onClick={() => {
                          handleVerifyEmail(email.token);
                          setIsDevMailboxOpen(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-success text-body text-[10px] font-bold hover:bg-success transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {email.email_type === 'password_reset' && (
                      <button
                        onClick={() => {
                          openAuthModal('reset', '', email.token);
                          setIsDevMailboxOpen(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-solid text-on-solid text-[10px] font-bold hover:opacity-90 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-hairline flex justify-between items-center shrink-0">
          <button
            onClick={refreshDevEmails}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-recess hover:bg-recess text-body text-xs font-bold transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Mailbox
          </button>
          <span className="text-xs text-faint">Total: {devEmails.length} emails</span>
        </div>
      </div>
    </div>
  );
}
