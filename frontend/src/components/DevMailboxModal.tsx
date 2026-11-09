import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  X, Inbox, Mail, CheckCircle2, KeyRound,
  RefreshCw, ExternalLink, ArrowRight, ShieldAlert,
  Tag, Truck, ShieldCheck, Send, Sparkles, Copy, Eye, Check
} from 'lucide-react';
import { sendTestMailAPI } from '../services/api';

export default function DevMailboxModal() {
  const {
    isDevMailboxOpen,
    setIsDevMailboxOpen,
    devEmails,
    refreshDevEmails,
    handleVerifyEmail,
    openAuthModal,
    openOrderTracker,
    applyCoupon,
    showToast
  } = useShop();

  const [activeFilter, setActiveFilter] = useState<'all' | 'otp' | 'offer' | 'order_tracking' | 'security'>('all');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  useEffect(() => {
    if (isDevMailboxOpen) {
      refreshDevEmails();
    }
  }, [isDevMailboxOpen, refreshDevEmails]);

  if (!isDevMailboxOpen) return null;

  const filteredEmails = devEmails.filter((email: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'otp') return email.email_type === 'otp' || email.email_type === 'verification';
    return email.email_type === activeFilter;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    showToast(`Copied "${text}" to clipboard!`, 'info');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleSendQuickTest = async (category: 'otp' | 'offer' | 'tracking' | 'security') => {
    setIsSendingTest(true);
    try {
      await sendTestMailAPI({
        recipient: 'client.concierge@gmail.com',
        category,
        token: category === 'offer' ? 'MAISON20' : category === 'tracking' ? 'MC-ORD-2026-78491' : '889922'
      });
      showToast(`✓ Sendmail dispatched ${category.toUpperCase()} email!`, 'success');
      await refreshDevEmails();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch test mail', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-scrim backdrop-blur-[3px] backdrop-in phone-xl:items-center phone-xl:p-4 sm:p-6">
      <div className="relative flex max-h-dvh w-full max-w-4xl flex-col border border-hairline bg-canvas p-4 text-body shadow-scrim backdrop-blur-xl phone-xl:max-h-[88dvh] phone-xl:rounded-[24px] phone-xl:p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-hairline flex items-center justify-center text-accent">
              <Inbox className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-body">Universal Sendmail & Dev Mailbox</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  SENDMAIL PROTOCOL ACTIVE
                </span>
              </div>
              <p className="text-xs text-quiet">
                Live delivery interceptor for OTPs, VIP Offers, Order Tracking & Security Notices
              </p>
            </div>
          </div>
          <button onClick={() => { setIsDevMailboxOpen(false); setSelectedEmail(null); }} className="p-2 rounded-xl hover:bg-recess transition-colors">
            <X className="w-5 h-5 text-quiet" />
          </button>
        </div>

        {/* Quick Sendmail Actions & Filter Tabs */}
        <div className="py-3 border-b border-hairline flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === 'all'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-recess text-quiet hover:text-body'
              }`}
            >
              All ({devEmails.length})
            </button>
            <button
              onClick={() => setActiveFilter('otp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === 'otp'
                  ? 'bg-cyan-500 text-black font-bold shadow-sm'
                  : 'bg-recess text-quiet hover:text-body'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> OTPs
            </button>
            <button
              onClick={() => setActiveFilter('offer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === 'offer'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'bg-recess text-quiet hover:text-body'
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> VIP Offers
            </button>
            <button
              onClick={() => setActiveFilter('order_tracking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === 'order_tracking'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'bg-recess text-quiet hover:text-body'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Order Tracking
            </button>
            <button
              onClick={() => setActiveFilter('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === 'security'
                  ? 'bg-rose-500 text-white font-bold shadow-sm'
                  : 'bg-recess text-quiet hover:text-body'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Security
            </button>
          </div>

          {/* Quick Test Triggers */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-quiet hidden sm:inline">Sendmail Test:</span>
            <button
              disabled={isSendingTest}
              onClick={() => handleSendQuickTest('otp')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
            >
              + OTP
            </button>
            <button
              disabled={isSendingTest}
              onClick={() => handleSendQuickTest('offer')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              + Offer
            </button>
            <button
              disabled={isSendingTest}
              onClick={() => handleSendQuickTest('tracking')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
              + Tracking
            </button>
          </div>
        </div>

        {/* Content Area: Two-Column when email selected, or single list */}
        <div className="flex-1 overflow-y-auto py-4">
          {selectedEmail ? (
            /* Selected Email Full HTML Preview View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Mailbox List
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-quiet">{selectedEmail.created_at || 'Just now'}</span>
                  {selectedEmail.token && (
                    <button
                      onClick={() => handleCopy(selectedEmail.token)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-soft text-accent text-xs font-mono font-bold hover:bg-accent-soft/80"
                    >
                      {copiedToken === selectedEmail.token ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Token: {selectedEmail.token}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-recess/50 p-3.5 rounded-xl border border-hairline text-xs space-y-1 font-mono">
                <div><span className="text-quiet">Subject:</span> <strong className="text-body font-sans text-sm">{selectedEmail.subject}</strong></div>
                <div><span className="text-quiet">Recipient:</span> <span className="text-accent">{selectedEmail.recipient}</span></div>
                <div><span className="text-quiet">Email Type:</span> <span className="uppercase text-amber-400 font-bold">{selectedEmail.email_type}</span></div>
              </div>

              {/* Rendered HTML Sandbox Frame */}
              <div className="border border-hairline rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  title="Luxury Email Preview"
                  srcDoc={selectedEmail.body || '<p style="padding:20px;color:#fff;">No preview body available.</p>'}
                  className="w-full h-[480px] border-none"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                />
              </div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
              <div className="w-20 h-20 rounded-full bg-recess/50 flex items-center justify-center text-faint">
                <Mail className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-body">No Emails in this Category</h3>
              <p className="text-xs text-quiet max-w-xs">
                Trigger an action like Email OTP Login, Placing an Order, or click one of the quick test buttons above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmails.map((email: any, idx: number) => {
                const isOtp = email.email_type === 'otp';
                const isOffer = email.email_type === 'offer';
                const isTracking = email.email_type === 'order_tracking';
                const isSecurity = email.email_type === 'security';

                return (
                  <div
                    key={idx}
                    className="card-premium p-4 border border-hairline hover:border-accent transition-all group rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isOtp && <KeyRound className="w-4 h-4 text-cyan-400" />}
                        {isOffer && <Tag className="w-4 h-4 text-amber-400" />}
                        {isTracking && <Truck className="w-4 h-4 text-emerald-400" />}
                        {isSecurity && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                        {!isOtp && !isOffer && !isTracking && !isSecurity && <Mail className="w-4 h-4 text-accent" />}
                        
                        <span className="text-xs font-bold text-body">{email.recipient}</span>
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-md bg-recess border border-hairline text-quiet">
                          {email.email_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-faint font-mono">{email.created_at || 'Just now'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-body truncate flex-1">
                        {email.subject}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* OTP Action */}
                        {isOtp && email.token && (
                          <button
                            onClick={() => handleCopy(email.token)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/25 transition-all"
                          >
                            {copiedToken === email.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            CODE: {email.token}
                          </button>
                        )}

                        {/* Offer Action */}
                        {isOffer && email.token && (
                          <button
                            onClick={async () => {
                              await applyCoupon(email.token);
                              setIsDevMailboxOpen(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Apply {email.token}
                          </button>
                        )}

                        {/* Order Tracking Action */}
                        {isTracking && email.token && (
                          <button
                            onClick={() => {
                              openOrderTracker(email.token);
                              setIsDevMailboxOpen(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-all"
                          >
                            <Truck className="w-3.5 h-3.5" /> Track #{email.token}
                          </button>
                        )}

                        {/* Verification Action */}
                        {email.email_type === 'verification' && (
                          <button
                            onClick={() => {
                              handleVerifyEmail(email.token);
                              setIsDevMailboxOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-success text-body text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            Verify Email
                          </button>
                        )}

                        {/* Password Reset Action */}
                        {email.email_type === 'password_reset' && (
                          <button
                            onClick={() => {
                              openAuthModal('reset', '', email.token);
                              setIsDevMailboxOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-solid text-on-solid text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            Reset Password
                          </button>
                        )}

                        {/* View HTML Preview Button */}
                        <button
                          onClick={() => setSelectedEmail(email)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-recess hover:bg-recess/80 text-body text-xs font-bold border border-hairline transition-all"
                          title="View Luxury HTML Email"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" /> Preview
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-hairline flex justify-between items-center shrink-0">
          <button
            onClick={refreshDevEmails}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-recess hover:bg-recess text-body text-xs font-bold transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Mailbox
          </button>
          <div className="flex items-center gap-3 text-xs text-faint">
            <span className="hidden sm:inline">Dispatched via Sendmail / SMTP Gateway</span>
            <span>Total: <strong>{devEmails.length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
