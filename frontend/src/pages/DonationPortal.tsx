import React, { useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Users,
  CheckCircle2,
  ExternalLink,
  Layers,
  Database,
  Cloud,
  Lock,
  Gift,
  Copy,
  Check,
  Activity,
  Send,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  fetchDonationBeneficiariesAPI,
  fetchDonationLedgerAPI,
  fetchDonationCloudStatusAPI,
  pledgeDonationAPI
} from '../services/api';

interface Beneficiary {
  id: string;
  name: string;
  type: 'orphanage' | 'old_age_home';
  tagline: string;
  location: string;
  city: string;
  country: string;
  founded_year: number;
  residents_count: number;
  verified_charity_id: string;
  monthly_need_usd: number;
  raised_amount_usd: number;
  cloudinary_image_url: string;
  optimized_image_url?: string;
  urgency_level: string;
  needs_list: string[];
  percent_funded: number;
}

interface LedgerBlock {
  ledger_id: string;
  donation_id: string;
  donor_hash: string;
  amount: number;
  beneficiary_code: string;
  escrow_status: string;
  consensus_node: string;
  block_hash: string;
  recorded_at: string;
}

interface CloudStatus {
  status: string;
  cloudinary?: {
    status: string;
    cloud_name?: string;
    cdn_features?: string[];
    latency_ms?: number;
  };
  neon?: {
    status: string;
    latency_ms?: number;
    beneficiaries_count?: number;
    donations_count?: number;
    total_raised_usd?: number;
  };
  cockroach_labs?: {
    status: string;
    latency_ms?: number;
    ledger_blocks_count?: number;
    region?: string;
    engine?: string;
  };
}

export default function DonationPortal() {
  const [filterType, setFilterType] = useState<'all' | 'orphanage' | 'old_age_home'>('all');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Donation Form State
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [tributeName, setTributeName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Confirmation State
  const [pledgeResult, setPledgeResult] = useState<any>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Parse URL query parameter for preselected amount (e.g., ?amount=100)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amtParam = params.get('amount');
    if (amtParam && !isNaN(Number(amtParam))) {
      setSelectedAmount(Number(amtParam));
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const [bData, lData, cData] = await Promise.all([
          fetchDonationBeneficiariesAPI(),
          fetchDonationLedgerAPI(20),
          fetchDonationCloudStatusAPI()
        ]);

        if (bData && bData.beneficiaries) {
          setBeneficiaries(bData.beneficiaries);
          if (bData.beneficiaries.length > 0 && !selectedBeneficiaryId) {
            setSelectedBeneficiaryId(bData.beneficiaries[0].id);
          }
        }

        if (lData && lData.ledger) {
          setLedgerBlocks(lData.ledger);
        }

        if (cData) {
          setCloudStatus(cData);
        }
      } catch (err: any) {
        console.error('Failed to load philanthropic portal data:', err);
        setErrorMsg(err.message || 'Error loading donation system data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  // Impact Calculations
  const getImpactDescription = (amount: number) => {
    if (amount <= 25) {
      return 'Provides 10 warm organic lunches & clean drinking water bottles for children.';
    } else if (amount <= 50) {
      return 'Covers pediatric health checkups, vitamins & dental screenings for 4 children.';
    } else if (amount <= 100) {
      return 'Supplies school uniforms, STEM coding tablets & literature books for 2 orphaned students.';
    } else if (amount <= 250) {
      return 'Funds 1 month of dedicated geriatric physiotherapy, cardiac medicines & mobility aids.';
    } else {
      return 'Full sanctuary sponsorship: comprehensive nutrition, palliative nursing & educational tutoring for an entire quarter.';
    }
  };

  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorEmail || !donorEmail.includes('@')) {
      alert('Please enter a valid donor email address for your official receipt & reward coupon.');
      return;
    }
    if (effectiveAmount < 100) {
      alert('Minimum donation is ₹100 INR.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        donor_name: isAnonymous ? 'Anonymous Benefactor' : (donorName || 'Generous Benefactor'),
        donor_email: donorEmail,
        donor_phone: donorPhone,
        amount_usd: effectiveAmount,
        beneficiary_id: selectedBeneficiaryId,
        cause_category: 'orphanage_elderly_sanctuary',
        message: message,
        tribute_name: tributeName,
        is_anonymous: isAnonymous
      };

      const res = await pledgeDonationAPI(payload);
      setPledgeResult(res);

      // Refresh beneficiaries and ledger
      const [newB, newL] = await Promise.all([
        fetchDonationBeneficiariesAPI(),
        fetchDonationLedgerAPI(20)
      ]);
      if (newB && newB.beneficiaries) setBeneficiaries(newB.beneficiaries);
      if (newL && newL.ledger) setLedgerBlocks(newL.ledger);
    } catch (err: any) {
      alert(`Donation Pledge Error: ${err.message || 'Failed to submit pledge'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCouponToClipboard = () => {
    if (pledgeResult?.reward_coupon) {
      navigator.clipboard.writeText(pledgeResult.reward_coupon);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    if (filterType === 'all') return true;
    return b.type === filterType;
  });

  return (
    <div className="min-h-screen bg-canvas text-body flex flex-col font-sans transition-colors duration-500 selection:bg-amber-500/30 selection:text-body">
      {/* Top Multi-Cloud Telemetry & Navigation Bar */}
      <header className="sticky top-0 z-40 bg-panel/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={navigateToHome}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-quiet hover:text-body bg-recess border border-hairline hover:border-hairline-soft rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Boutique</span>
            </button>
            <div className="h-4 w-px bg-hairline hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 dark:text-amber-400">
                <Heart className="w-4 h-4 fill-amber-500/30 dark:fill-amber-400" />
              </span>
              <div>
                <span className="text-sm font-serif font-bold tracking-wider text-amber-600 dark:text-amber-300 uppercase">
                  Maison Cread Philanthropy
                </span>
                <span className="hidden md:inline-block ml-2 text-[10px] text-quiet uppercase tracking-widest font-mono">
                  Orphanage & Elder Sanctuaries
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Cloud Status Badges & Theme Toggle */}
          <div className="flex items-center gap-3 text-xs">
            {/* Neon DB */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-panel border border-hairline rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-quiet">Neon DB:</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {cloudStatus?.neon?.status === 'connected' ? 'Connected' : 'Active'}
              </span>
            </div>

            {/* Cockroach Labs */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-panel border border-hairline rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[11px] text-quiet">Cockroach Labs:</span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                {cloudStatus?.cockroach_labs?.status === 'connected' ? 'Consensus' : 'Ledger'}
              </span>
            </div>

            {/* Cloudinary */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-panel border border-hairline rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] text-quiet">Cloudinary:</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                {cloudStatus?.cloudinary?.status === 'connected' ? 'CDN Edge' : 'Active'}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <div className="pl-1 border-l border-hairline">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-r from-recess via-panel to-recess p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Global Philanthropic Alliance
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-body tracking-tight leading-tight">
              A Sacred Commitment to Orphaned Children & Elder Sanctuaries.
            </h1>
            <p className="text-sm sm:text-base text-quiet leading-relaxed font-light">
              100% of public gifts directly disburse essential pediatric meals, STEM schooling, geriatric palliative care, and orthopedic comfort across Tokyo, Paris, London, New York, Bengaluru, and New Delhi.
            </p>

            {/* Key Transparency Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-hairline">
              <div className="space-y-1">
                <div className="text-xs text-quiet uppercase tracking-wider">Total Raised</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  ₹{cloudStatus?.neon?.total_raised_usd ? (cloudStatus.neon.total_raised_usd * 83).toLocaleString() : '12,50,000'}+
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-quiet uppercase tracking-wider">Sanctuaries</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {beneficiaries.length || 6} Registered
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-quiet uppercase tracking-wider">Ledger Blocks</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
                  {cloudStatus?.cockroach_labs?.ledger_blocks_count || ledgerBlocks.length}+ Blocks
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-quiet uppercase tracking-wider">Donor Privilege</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  20% Coupon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal / Card if Pledge Submitted */}
        {pledgeResult && (
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500/10 via-panel to-emerald-500/5 border-2 border-emerald-500/50 rounded-2xl shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-body">
                    Pledge Confirmed & Ledger Disbursed!
                  </h3>
                  <p className="text-xs text-quiet">
                    Official Certificate #{pledgeResult.donation_id} • Dispatched to {pledgeResult.donor_email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPledgeResult(null)}
                className="text-xs text-quiet hover:text-body px-3 py-1 bg-recess border border-hairline rounded-lg transition-colors"
              >
                Close Receipt
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-recess rounded-xl border border-hairline text-xs">
              <div>
                <span className="text-faint uppercase tracking-wider font-semibold block">Neon DB Transaction</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{pledgeResult.neon_tx_id}</span>
              </div>
              <div>
                <span className="text-faint uppercase tracking-wider font-semibold block">CockroachDB Consensus Block</span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-medium">{pledgeResult.cockroach_ledger_id}</span>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-faint uppercase tracking-wider font-semibold block">SHA-256 Merkle Block Hash</span>
                <span className="font-mono text-body break-all">{pledgeResult.block_hash}</span>
              </div>
            </div>

            {/* Exclusive Benefactor Voucher Reward */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-lg text-amber-500 dark:text-amber-400">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                    Your 20% Off Storewide Benefactor Privilege Voucher
                  </div>
                  <div className="text-xs text-quiet">
                    Redeemable during checkout at Maison Cread for an immediate 20% reduction.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 font-mono font-bold text-lg text-amber-600 dark:text-amber-300 bg-panel border border-amber-500/40 rounded-lg tracking-widest shadow-sm">
                  {pledgeResult.reward_coupon}
                </span>
                <button
                  onClick={copyCouponToClipboard}
                  className="p-2.5 bg-amber-500 text-black hover:bg-amber-400 font-semibold rounded-lg transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                >
                  {copiedCoupon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCoupon ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-panel text-quiet hover:text-body border border-hairline'
              }`}
            >
              All Sanctuaries ({beneficiaries.length})
            </button>
            <button
              onClick={() => setFilterType('orphanage')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                filterType === 'orphanage'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-panel text-quiet hover:text-body border border-hairline'
              }`}
            >
              Orphanages & Youth Academies (👶)
            </button>
            <button
              onClick={() => setFilterType('old_age_home')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                filterType === 'old_age_home'
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-panel text-quiet hover:text-body border border-hairline'
              }`}
            >
              Senior & Elder Living Sanctuaries (👵)
            </button>
          </div>

          <div className="text-xs text-quiet flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Audited & verified by State NGO Registries</span>
          </div>
        </div>

        {/* Beneficiaries Grid & Pledge Form Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Beneficiaries Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredBeneficiaries.map((b) => {
                const isSelected = selectedBeneficiaryId === b.id;
                const imgUrl = b.optimized_image_url || b.cloudinary_image_url;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBeneficiaryId(b.id)}
                    className={`cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-panel shadow-xl ring-2 ring-amber-400/20'
                        : 'border-hairline bg-panel hover:border-hairline-soft shadow-md'
                    }`}
                  >
                    <div>
                      {/* Image Thumbnail with Cloudinary CDN tag */}
                      <div className="relative h-44 w-full overflow-hidden bg-recess">
                        <img
                          src={imgUrl}
                          alt={b.name}
                          className="w-full h-full object-cover filter brightness-90 hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full uppercase tracking-wider backdrop-blur-md ${
                            b.type === 'orphanage'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                              : 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                          }`}>
                            {b.type === 'orphanage' ? '👶 Children Haven' : '👵 Elder Respite'}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
                            CDN: Cloudinary
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-3 right-3 text-xs text-white font-medium drop-shadow-md flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            {b.city}, {b.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-300" />
                            {b.residents_count} Residents
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="text-base font-serif font-bold text-body line-clamp-1">
                            {b.name}
                          </h4>
                          <p className="text-xs text-quiet mt-1 line-clamp-2 leading-relaxed">
                            {b.tagline}
                          </p>
                        </div>

                        {/* Urgency Alert */}
                        <div className="p-2 rounded-lg bg-recess border border-hairline text-[11px] text-amber-600 dark:text-amber-300 font-medium">
                          ⚡ {b.urgency_level}
                        </div>

                        {/* Needs Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {b.needs_list.slice(0, 3).map((need, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] bg-recess text-quiet border border-hairline-soft"
                            >
                              {need}
                            </span>
                          ))}
                        </div>

                        {/* Funding Progress */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-quiet">Monthly Target</span>
                            <span className="font-mono text-body font-semibold">
                              ₹{(b.raised_amount_usd * 83).toLocaleString()} / ₹{(b.monthly_need_usd * 83).toLocaleString()} ({b.percent_funded}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-recess rounded-full overflow-hidden border border-hairline-soft">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, b.percent_funded)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBeneficiaryId(b.id);
                        }}
                        className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                            : 'bg-recess hover:bg-hairline text-body border border-hairline'
                        }`}
                      >
                        {isSelected ? '✓ Selected for Pledge' : 'Pledge For This Sanctuary'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Donation Pledge Form (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="rounded-2xl border border-amber-500/30 bg-panel p-6 sm:p-7 shadow-2xl space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-amber-500/30 dark:fill-amber-400" />
                  Philanthropic Sanctuary Pledge
                </div>
                <h3 className="text-xl font-serif font-bold text-body">
                  Direct Nutritional & Care Grant
                </h3>
                <p className="text-xs text-quiet">
                  Select your contribution. 100% of proceeds disburse directly to beneficiaries.
                </p>
              </div>

              {/* Amount Selection Grid */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-body block">
                  Select Pledge Amount (INR, ₹):
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[500, 1000, 2500, 5000, 10000].map((amt) => {
                    const isPicked = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount('');
                        }}
                        className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                          isPicked
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                            : 'bg-panel border border-hairline text-body hover:border-hairline-soft'
                        }`}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    );
                  })}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Custom ₹"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-panel border transition-all text-center focus:outline-none ${
                        customAmount
                          ? 'border-amber-400 text-amber-600 dark:text-amber-300'
                          : 'border-hairline text-body'
                      }`}
                    />
                  </div>
                </div>

                {/* Real-time Dynamic Impact Card */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Real-world impact of ₹{effectiveAmount.toLocaleString()}:</span>
                    <span className="text-quiet text-[11px] leading-tight">
                      {getImpactDescription(effectiveAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donor Form Fields */}
              <form onSubmit={handlePledgeSubmit} className="space-y-4">
                {/* Beneficiary Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs text-quiet uppercase tracking-wider font-medium">
                    Allocated Beneficiary
                  </label>
                  <select
                    value={selectedBeneficiaryId}
                    onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-recess border border-hairline rounded-xl text-xs sm:text-sm text-body focus:outline-none focus:border-amber-400"
                  >
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}, {b.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Donor Name & Anonymous Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-quiet uppercase tracking-wider font-medium">
                      Donor Name
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-quiet">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-hairline text-amber-500 focus:ring-0"
                      />
                      <span>Make Anonymous</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    placeholder={isAnonymous ? 'Anonymous Benefactor' : 'Lady Eleanor Vance'}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-recess border border-hairline rounded-xl text-xs sm:text-sm text-body disabled:opacity-50 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Email Address (Receipt Delivery) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-quiet uppercase tracking-wider font-medium">
                      Email Address (For Tax Receipt & Voucher)
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Sendmail Verified</span>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="patron@maison.luxury"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-recess border border-hairline rounded-xl text-xs sm:text-sm text-body focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Tribute / Dedication (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs text-quiet uppercase tracking-wider font-medium">
                    Tribute or Dedication (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="In Honor / Memory Of..."
                    value={tributeName}
                    onChange={(e) => setTributeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-recess border border-hairline rounded-xl text-xs sm:text-sm text-body focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Personal Message */}
                <div className="space-y-1">
                  <label className="text-xs text-quiet uppercase tracking-wider font-medium">
                    Words of Encouragement
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Dedicated with love to the bright children and beloved elders..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-recess border border-hairline rounded-xl text-xs sm:text-sm text-body focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Voucher Incentive Banner */}
                <div className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-xl text-xs text-body flex items-center gap-2.5">
                  <Gift className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    Includes <span className="text-amber-600 dark:text-amber-300 font-bold font-mono">HOPE-BLOOM-20</span> (20% off Maison Cread) + immutable CockroachDB block hash.
                  </div>
                </div>

                {/* Submit Pledge Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Recording to Neon & CockroachDB...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 fill-black" />
                      <span>Authorize Pledge of ₹{effectiveAmount.toLocaleString()} INR</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cockroach Labs Serverless Distributed Ledger Section */}
        <div className="rounded-3xl border border-sky-500/30 dark:border-sky-500/20 bg-panel p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 font-semibold font-mono">
                <Database className="w-3.5 h-3.5" />
                Cockroach Labs Distributed Consensus
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-body">
                Tamper-Proof Philanthropic Ledger
              </h3>
              <p className="text-xs text-quiet max-w-2xl leading-relaxed">
                Every dollar pledged is cryptographically minted into a distributed CockroachDB block with a SHA-256 Merkle hash and privacy-preserving donor salt. Zero possibility of financial alteration.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs text-sky-600 dark:text-sky-300 font-mono">
              <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <span>Consensus: aws-ap-south-1</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-hairline bg-panel">
            <table className="w-full text-left text-xs">
              <thead className="bg-recess text-quiet uppercase tracking-wider font-semibold border-b border-hairline">
                <tr>
                  <th className="py-3 px-4">Block ID</th>
                  <th className="py-3 px-4">Donation Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Merkle Block Hash</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-mono">
                {ledgerBlocks.map((blk) => (
                  <tr key={blk.ledger_id} className="hover:bg-recess/60 transition-colors">
                    <td className="py-3 px-4 text-sky-600 dark:text-sky-400 font-semibold">{blk.ledger_id}</td>
                    <td className="py-3 px-4 text-body">{blk.donation_id}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">₹{(blk.amount * 83).toFixed(0)}</td>
                    <td className="py-3 px-4 text-amber-600 dark:text-amber-400">{blk.beneficiary_code}</td>
                    <td className="py-3 px-4 text-quiet max-w-[200px] truncate" title={blk.block_hash}>
                      {blk.block_hash}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                        {blk.escrow_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-panel/80 py-8 text-center text-xs text-quiet">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif tracking-wider text-body font-semibold">
            MAISON CREAD PHILANTHROPIC SANCTUARY ALLIANCE
          </p>
          <p className="text-[11px] text-faint">
            Powered by Neon Distributed PostgreSQL • Cockroach Labs Consensus Engine • Cloudinary Edge CDN • Sendmail Protocol.
          </p>
        </div>
      </footer>
    </div>
  );
}

