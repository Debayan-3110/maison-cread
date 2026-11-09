/**
 * ShopCread Centralized Compliance & Data Privacy Manager
 * Compliant with:
 * - Digital Personal Data Protection (DPDP) Act 2023 (India)
 * - General Data Protection Regulation (GDPR - EU 2016/679)
 * - Consumer Protection (E-Commerce) Rules, 2020 (India)
 * - WCAG 2.2 Level AA Digital Accessibility Standards
 */

export interface CookiePreferences {
  strictly_necessary: boolean; // Always true
  functional: boolean;
  analytical: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  consent_id: string;
  timestamp: string;
  version: string;
  preferences: CookiePreferences;
  dpdp_lawful_basis: string;
  gdpr_legal_basis: string;
}

export interface PolicyVersionRecord {
  version: string;
  effectiveDate: string;
  statutorySummary: string;
  changes: string[];
}

export const LEGAL_VERSIONS: Record<string, PolicyVersionRecord[]> = {
  privacy: [
    {
      version: 'v2.4',
      effectiveDate: 'November 2026',
      statutorySummary: 'Updated under DPDP Act 2023 Section 8 (Data Fiduciary Duties) & GDPR Article 13/14 transparency obligations.',
      changes: [
        'Added explicit DPDP Data Principal rights: Right to Access, Correction, and Section 12 Right to Erasure.',
        'Codified statutory 72-month GST/Tax audit retention under Section 36 of CGST Act 2017 with automated PII scrubbing.',
        'Integrated BNS (Bridge Numbering Service) Zero-Knowledge phone masking protocol disclosure.',
        'Published appointed Data Protection Officer (DPO) and Grievance Redressal statutory contact particulars.'
      ]
    },
    {
      version: 'v2.1',
      effectiveDate: 'April 2026',
      statutorySummary: 'Initial DPDP 2023 alignment with two-factor cryptographic authentication and session tokenization.',
      changes: ['Introduced consent-first cookie management and OAuth token hygiene.']
    }
  ],
  terms: [
    {
      version: 'v2.4',
      effectiveDate: 'November 2026',
      statutorySummary: 'Revised under Rule 4(4) and Rule 6 of the Consumer Protection (E-Commerce) Rules 2020.',
      changes: [
        'Mandated Open Box Delivery (OBD) inspection terms prior to verification OTP handoff.',
        'Defined platform custodial escrow settlement and Lloyd\'s syndicate armored transit insurance terms.',
        'Established binding arbitration framework under the Indian Arbitration and Conciliation Act, 1996 with seat at Mumbai.'
      ]
    }
  ],
  cookies: [
    {
      version: 'v2.4',
      effectiveDate: 'November 2026',
      statutorySummary: 'Granular cookie categorization conforming to ePrivacy Directive & DPDP Consent-First mandate.',
      changes: [
        'Categorized all storage tokens into Strictly Necessary, Functional, and Analytical.',
        'Enforced hard-block of all tracking scripts prior to un-coerced explicit consent.'
      ]
    }
  ],
  returns: [
    {
      version: 'v2.4',
      effectiveDate: 'November 2026',
      statutorySummary: 'High-Value Luxury Return & Open Box Delivery (OBD) Policy pursuant to Consumer Protection (E-Commerce) Rules 2020 Rule 6.',
      changes: [
        'Codified two-step Open Box Delivery (OBD) verification with visual tamper inspection.',
        'Established 7-day forensic authenticity return guarantee with sub-millimeter spectroscopic validation.',
        'Mandated 48-hour statutory refund turnaround to original payment source upon vault receipt.'
      ]
    }
  ]
};

const CONSENT_STORAGE_KEY = 'shopcread_cookie_consent';

export const DEFAULT_PREFERENCES: CookiePreferences = {
  strictly_necessary: true,
  functional: false,
  analytical: false,
  marketing: false,
};

export class ComplianceManager {
  private static generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'cld-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }

  public static getConsentRecord(): ConsentRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static hasUserResponded(): boolean {
    return this.getConsentRecord() !== null;
  }

  public static saveConsent(preferences: Partial<CookiePreferences>): ConsentRecord {
    const fullPreferences: CookiePreferences = {
      strictly_necessary: true, // Immutable requirement
      functional: Boolean(preferences.functional),
      analytical: Boolean(preferences.analytical),
      marketing: Boolean(preferences.marketing),
    };

    const record: ConsentRecord = {
      consent_id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      version: 'v2.4-2026',
      preferences: fullPreferences,
      dpdp_lawful_basis: 'Section 4(1) Explicit Consent & Contractual Performance',
      gdpr_legal_basis: 'Article 6(1)(a) Consent & Article 6(1)(b) Performance of a Contract',
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent('shopcread_consent_updated', { detail: record }));
    } catch (err) {
      console.warn('ComplianceManager: Could not persist consent', err);
    }

    return record;
  }

  public static acceptAll(): ConsentRecord {
    return this.saveConsent({
      functional: true,
      analytical: true,
      marketing: true,
    });
  }

  public static rejectNonEssential(): ConsentRecord {
    return this.saveConsent({
      functional: false,
      analytical: false,
      marketing: false,
    });
  }

  public static canLoadAnalytics(): boolean {
    const record = this.getConsentRecord();
    return Boolean(record?.preferences?.analytical);
  }

  public static canLoadFunctional(): boolean {
    const record = this.getConsentRecord();
    return Boolean(record?.preferences?.functional);
  }

  public static resetConsent(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('shopcread_consent_reset'));
    }
  }
}

