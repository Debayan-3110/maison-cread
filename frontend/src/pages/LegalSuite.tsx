import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  Lock,
  Cookie,
  RotateCcw,
  History,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { LEGAL_VERSIONS } from '../utils/complianceManager';
import ThemeToggle from '../components/ThemeToggle';

interface LegalSuiteProps {
  initialPolicy?: 'privacy' | 'terms' | 'cookies' | 'returns' | 'history';
  onClose?: () => void;
  isModal?: boolean;
}

export const LegalSuite: React.FC<LegalSuiteProps> = ({
  initialPolicy = 'privacy',
  onClose,
  isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies' | 'returns' | 'history'>(initialPolicy);

  useEffect(() => {
    if (initialPolicy) {
      setActiveTab(initialPolicy);
    }
  }, [initialPolicy]);

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, ref: 'DPDP 2023 / GDPR' },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, ref: 'Consumer Protection 2020' },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie, ref: 'Storage Disclosure' },
    { id: 'returns', label: 'Refund & OBD Policy', icon: RotateCcw, ref: 'Open Box Delivery' },
    { id: 'history', label: 'Version History', icon: History, ref: 'Audit Log' },
  ];

  return (
    <div className={`${isModal ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md' : 'min-h-screen bg-canvas text-body py-10'}`}>
      <div className={`relative w-full max-w-5xl rounded-2xl border border-hairline bg-canvas text-body shadow-2xl overflow-hidden flex flex-col ${isModal ? 'max-h-[92vh]' : 'mx-auto'}`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-hairline bg-panel/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007BA7]/15 border border-[#007BA7]/30 text-[#007BA7]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-body">
                  Legal Documentation &amp; Statutory Governance
                </h1>
                <span className="rounded-full bg-[#007BA7]/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#007BA7] border border-[#007BA7]/30 uppercase">
                  v2.4 Certified
                </span>
              </div>
              <p className="text-xs text-quiet">
                Digital Personal Data Protection Act 2023 • GDPR (EU 2016/679) • Consumer Protection (E-Commerce) Rules 2020
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="rounded-full p-2 text-quiet hover:text-body hover:bg-recess transition-colors"
                aria-label="Close legal modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-panel/30 px-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#007BA7] text-[#007BA7]'
                    : 'border-transparent text-quiet hover:text-body'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-[#007BA7]/10 text-[#007BA7]' : 'text-faint'}`}>
                  {tab.ref}
                </span>
              </button>
            );
          })}
        </div>

        {/* Policy Content Scroll Area */}
        <div className="thin-scroll flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-quiet leading-relaxed">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#007BA7]/30 bg-[#007BA7]/5 p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#007BA7] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-body">Statutory Compliance Note (DPDP Act 2023 &amp; GDPR):</span>
                  <p className="mt-1 text-quiet">
                    Maison Cread Private Limited acts as the Data Fiduciary under Section 2(i) of the Digital Personal Data Protection Act, 2023. We process personal data solely on the lawful bases of explicit consent (Section 6) and performance of contract (Section 4).
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">1. Information We Collect (Data Minimization)</h2>
                <p>
                  Pursuant to principles of proportionality, we collect only the personal data strictly required to process your order, provide authenticity provenance certificates, and fulfill statutory tax mandates:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li><strong className="text-body">Identity Data:</strong> Full legal name and account credentials (stored as salted, argon2/bcrypt cryptographic one-way hashes).</li>
                  <li><strong className="text-body">Protected Contact Data:</strong> Customer phone numbers are processed exclusively through our <strong className="text-body">Bridge Number Service (BNS)</strong>. Your raw telephone number is never disclosed to merchant sellers, couriers, or customer service representatives.</li>
                  <li><strong className="text-body">Delivery Data:</strong> Recipient delivery address, city, and PIN code necessary for insured custodial courier delivery.</li>
                  <li><strong className="text-body">Transaction &amp; Tax Data:</strong> Order value, itemized GST invoices, and masked payment authorization tokens. We do not store raw credit/debit card primary account numbers (PAN).</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">2. Legal Basis &amp; Purpose of Processing</h2>
                <p className="text-xs">
                  Under GDPR Article 6 and DPDP Act Section 4, personal data is processed exclusively for:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-hairline bg-panel p-3">
                    <span className="font-semibold text-body">Contractual Performance</span>
                    <p className="mt-1 text-quiet">Fulfillment of purchased items, white-glove transport, and physical Open Box Delivery verification.</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-panel p-3">
                    <span className="font-semibold text-body">Legal &amp; Tax Obligation</span>
                    <p className="mt-1 text-quiet">Retention of financial invoices for 72 months pursuant to Section 36 of the Central Goods and Services Tax (CGST) Act, 2017.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">3. Retention &amp; Right to Erasure (DPDP Sec 12 / GDPR Art 17)</h2>
                <p>
                  You possess the statutory right to request permanent erasure of your personal data at any time via the atelier profile settings or by submitting an erasure request to our Data Protection Officer.
                </p>
                <p className="text-xs text-quiet">
                  Upon receipt of an erasure request:
                  (a) All account identifiers, passwords, profile details, and BNS session mappings are permanently hard-deleted.
                  (b) Financial transaction records required for tax audits are irreversibly anonymized (shipping details redacted to <code className="font-mono text-body">REDACTED_DELETED_USER</code>).
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">4. Appointed Data Protection Officer (DPO) &amp; Grievance Redressal</h2>
                <div className="rounded-xl border border-hairline bg-panel p-4 text-xs space-y-1">
                  <p><strong className="text-body">Data Protection Officer:</strong> Adv. K. R. Mehra, Lead Compliance Counsel</p>
                  <p><strong className="text-body">Statutory Email:</strong> <code className="font-mono text-[#007BA7]">dpo@shopcread.com</code> / <code className="font-mono text-[#007BA7]">grievance@shopcread.com</code></p>
                  <p><strong className="text-body">Corporate Office:</strong> Maison Cread Tower, Bandra Kurla Complex (BKC), Mumbai 400051, Maharashtra, India</p>
                  <p><strong className="text-body">Statutory Resolution Timeline:</strong> Maximum 30 calendar days as specified under the DPDP Rules.</p>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-hairline bg-panel/50 p-4 text-xs text-quiet">
                <span className="font-bold text-body">Governing Law:</span> These Terms are governed by and construed in accordance with the laws of the Republic of India, specifically the Information Technology Act 2000, the Consumer Protection Act 2019, and the Consumer Protection (E-Commerce) Rules 2020.
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">1. Authenticity Guarantee &amp; Forensic Provenance</h2>
                <p>
                  Every luxury item, mechanical timepiece, and certified object cataloged on ShopCread undergoes two-tier physical inspection, non-destructive spectroscopy, and serial number provenance verification. Counterfeiting is strictly prohibited; any confirmed inauthenticity entitles the buyer to an immediate 100% full refund including all shipping fees and custodial insurance.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">2. Payment Obligations &amp; Custodial Escrow</h2>
                <p>
                  Prices are listed in Indian Rupees (INR) inclusive of applicable GST unless explicitly stated otherwise. Funds remain in custodial escrow until successful delivery confirmation via the BNS Delivery Verification OTP. Merchant payouts are executed only after the Open Box Delivery inspection period closes without dispute.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">3. Delivery Liability &amp; Risk Transfer</h2>
                <p>
                  Risk of loss and title for all goods remain with ShopCread until the physical handoff is completed at your registered delivery address following Open Box Delivery (OBD) inspection. All consignments are fully insured under a master policy underwritten by Lloyd's syndicates.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">4. Dispute Resolution &amp; Jurisdiction</h2>
                <p>
                  Any controversy or claim arising out of or relating to this agreement shall be settled through binding arbitration administered in accordance with the Indian Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Mumbai, India, conducted in the English language. Subject to arbitration, the courts at Mumbai shall exercise exclusive jurisdiction.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">Complete Storage &amp; Cookie Disclosure</h2>
                <p className="text-xs">
                  We use cookies and browser local storage strictly in accordance with consent-first requirements. The comprehensive inventory below details every token stored by our service:
                </p>
              </section>

              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-panel text-body font-semibold">
                      <th className="p-3 font-mono">Token / Key</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Purpose &amp; Statutory Justification</th>
                      <th className="p-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    <tr>
                      <td className="p-3 font-mono text-[#007BA7]">shopcread_access_token</td>
                      <td className="p-3"><span className="rounded bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-bold">Strictly Necessary</span></td>
                      <td className="p-3">Cryptographic JWT bearer token authenticating your atelier session.</td>
                      <td className="p-3 text-faint">15 minutes</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#007BA7]">shopcread_csrf</td>
                      <td className="p-3"><span className="rounded bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-bold">Strictly Necessary</span></td>
                      <td className="p-3">Double-submit anti-CSRF token preventing unauthorized cross-site mutations.</td>
                      <td className="p-3 text-faint">Session</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-[#007BA7]">shopcread_cookie_consent</td>
                      <td className="p-3"><span className="rounded bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px] font-bold">Strictly Necessary</span></td>
                      <td className="p-3">Auditable cryptographic record of user consent under DPDP Act 2023.</td>
                      <td className="p-3 text-faint">12 months</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-body">shopcread_theme</td>
                      <td className="p-3"><span className="rounded bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[10px] font-bold">Functional</span></td>
                      <td className="p-3">Stores appearance preference (Midnight Obsidian vs. Gallery White).</td>
                      <td className="p-3 text-faint">Persistent</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-body">shopcread_cart</td>
                      <td className="p-3"><span className="rounded bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[10px] font-bold">Functional</span></td>
                      <td className="p-3">Preserves your shopping bag selections across browser refreshes.</td>
                      <td className="p-3 text-faint">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-hairline bg-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-body">Modify Your Cookie Preferences</h4>
                  <p className="text-[11px] text-quiet">You can withdraw or customize your non-essential consent at any time.</p>
                </div>
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    window.dispatchEvent(new CustomEvent('shopcread_open_cookie_banner'));
                  }}
                  className="rounded-full bg-[#007BA7] px-4 py-2 text-xs font-bold text-white hover:bg-[#008ec0] transition-colors"
                >
                  Manage Preferences
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: REFUND & OPEN BOX DELIVERY (OBD) POLICY */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#FF007F]/30 bg-[#FF007F]/5 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#FF007F] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-body">High-Value Luxury Goods &amp; Open Box Delivery (OBD):</span>
                  <p className="mt-1 text-quiet">
                    To safeguard both buyers and sellers from transit theft and switch-out fraud, all items exceeding ₹10,000 are delivered exclusively under mandatory Open Box Delivery (OBD).
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">1. Open Box Delivery (OBD) Protocol</h2>
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg border border-hairline bg-panel p-3">
                    <span className="font-bold text-body">Step 1: Physical Inspection before OTP Sharing</span>
                    <p className="mt-1">The authorized logistics associate will unbox the tamper-evident security vault in your presence. You must verify: (i) the physical condition, (ii) matching serial number, and (iii) absence of superficial damage or scratches.</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-panel p-3">
                    <span className="font-bold text-body">Step 2: Acceptance via BNS Verification PIN</span>
                    <p className="mt-1">Once satisfied, share the 6-digit BNS Delivery OTP. Sharing the OTP constitutes formal acceptance of cosmetic condition. Claims for external physical transit damage cannot be accepted once OBD OTP is validated.</p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-panel p-3">
                    <span className="font-bold text-body">Step 3: Refusal on the Spot (Zero Deductions)</span>
                    <p className="mt-1">If the seal is broken or cosmetic damage is observed, refuse delivery immediately on the spot. Do NOT share the OTP. An immediate replacement or 100% refund will be triggered automatically within 24 hours.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">2. 7-Day Mechanical &amp; Authenticity Return Window</h2>
                <p>
                  For internal mechanical discrepancies, movement malfunction in timepieces, or forensic authenticity challenges, you retain a strict 7-day return window from delivery date.
                </p>
                <p className="text-xs">
                  Returned goods are inspected at our central vault under dual-camera recording. Upon validation, statutory refunds are processed within <strong className="text-body">48 business hours</strong> directly to your original payment method pursuant to Rule 6 of the Consumer Protection (E-Commerce) Rules 2020.
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: VERSION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-body font-display">Statutory Policy Version History &amp; Revision Log</h2>
                <p className="text-xs">
                  In compliance with ISO 27701 and DPDP Act accountability standards, every revision to our legal documentation is version-controlled and archived:
                </p>
              </section>

              <div className="space-y-4">
                {Object.entries(LEGAL_VERSIONS).map(([key, records]) => (
                  <div key={key} className="rounded-xl border border-hairline bg-panel p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#007BA7]">
                        {key.toUpperCase()} POLICY REVISION TRAIL
                      </span>
                      <span className="text-[10px] font-mono text-quiet">{records.length} Recorded Releases</span>
                    </div>

                    <div className="space-y-3">
                      {records.map((rec, i) => (
                        <div key={i} className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-accent/15 text-accent font-mono font-bold px-2 py-0.5 text-[10px]">{rec.version}</span>
                            <span className="text-body font-semibold">{rec.effectiveDate}</span>
                          </div>
                          <p className="text-[11.5px] text-body">{rec.statutorySummary}</p>
                          <ul className="list-disc pl-5 text-[11px] text-quiet space-y-0.5">
                            {rec.changes.map((ch, idx) => (
                              <li key={idx}>{ch}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-hairline bg-panel/40 px-6 py-4 text-xs text-quiet">
          <span>ShopCread Atelier Legal Suite • Certified under Indian &amp; EU E-Commerce Law</span>
          <button
            onClick={onClose || (() => window.history.back())}
            className="rounded-full bg-[#007BA7] px-5 py-2 font-bold text-white hover:bg-[#008ec0] transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalSuite;

