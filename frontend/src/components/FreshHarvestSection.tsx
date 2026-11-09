import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import {
  Sparkles,
  Heart,
  Clock,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  Gift,
  CheckCircle,
  Copy,
  ChevronRight,
  Smile,
  Leaf
} from 'lucide-react';
import { formatINR } from '../utils/commerce';
import Card3D from './common/Card3D';
import { getSafeImageUrl, getCloudinaryOptimizedImageUrl, handleImageError } from '../utils/imageFallback';
import { fetchDailyFreshStatus, calculateDonationImpact } from '../services/api';

const DONATION_PRESETS = [
  { amount: 50, label: '₹50 Micro-Gift', sub: 'Fruit Breakfast' },
  { amount: 100, label: '₹100 Cheer Pack', sub: 'Fruits + Flowers' },
  { amount: 250, label: '₹250 Weekly Care', sub: 'High-Protein Nutrition' },
  { amount: 500, label: '₹500 Hall Feast', sub: 'Full Orphanage Decor' },
];

export default function FreshHarvestSection() {
  const { setSelectedCategory, setQuickViewProduct, addToCart, products, showToast } = useShop();

  const [activeTab, setActiveTab] = useState<'all' | 'organic-fruits' | 'fresh-flowers' | 'fresh-fish'>('all');
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [pledgeAmount, setPledgeAmount] = useState<number>(100);
  const [pledgeImpact, setPledgeImpact] = useState<any>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 48,
    seconds: 12
  });

  // Load backend daily status & initial impact
  useEffect(() => {
    let isMounted = true;
    fetchDailyFreshStatus().then((data) => {
      if (isMounted && data) {
        setDailyStatus(data);
      }
    });
    calculateDonationImpact(100).then((data) => {
      if (isMounted && data) {
        setPledgeImpact(data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Update impact dynamically when pledge amount changes
  useEffect(() => {
    calculateDonationImpact(pledgeAmount).then((data) => {
      if (data) setPledgeImpact(data);
    });
  }, [pledgeAmount]);

  // Countdown timer to 05:00 AM harvest
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    showToast(`Coupon code ${code} copied to clipboard! (20% Off)`, 'success');
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // Filter fresh products matching active tab
  const freshProducts = React.useMemo(() => {
    if (!products || !products.length) return [];
    return products.filter((p) => {
      if (activeTab === 'all') {
        return ['organic-fruits', 'fresh-flowers', 'fresh-fish'].includes(p.category);
      }
      return p.category === activeTab;
    }).slice(0, 8);
  }, [products, activeTab]);

  return (
    <section className="relative overflow-hidden border-t border-hairline bg-gradient-to-b from-canvas via-recess/40 to-canvas py-16 sm:py-24">
      {/* Decorative ambient aura */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-accent/10 blur-[130px]" />

      <div className="shell relative">
        {/* Header & Editorial Lead */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-hairline pb-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent">
                <Leaf className="h-3 w-3" />
                Maison Fresh & Botanicals
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-quiet">
                <Clock className="h-3.5 w-3.5 text-accent" />
                Harvested at 05:00 AM Today
              </span>
            </div>

            <h2 className="title-editorial mt-4 text-[30px] font-normal leading-tight text-body sm:text-[42px] lg:text-[48px]">
              Organic Fruits, Morning Blooms <br className="hidden sm:block" />
              <em className="font-display italic text-accent">&amp; Wild Deep-Sea Catch</em>
            </h2>

            <p className="fluid-lede mt-3 text-[14px] leading-relaxed text-quiet sm:text-[15.5px]">
              Over <strong>50,000+ units</strong> sourced fresh daily at dawn across our organic orchards, floral glasshouses, and sustainable fisheries. Maintained under a strict 0–2°C continuous cold chain,
              backed by our zero-waste social pledge: unsold daily surplus is hand-delivered to decorate partner orphanages
              and nourish children in need.
            </p>
          </div>

          {/* Real-Time Harvest Telemetry Card */}
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-hairline bg-panel/90 p-4 shadow-quiet backdrop-blur sm:gap-5 sm:p-5">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-ping" />
                Next Dawn Harvest In
              </p>
              <p className="numerals mt-1.5 text-[20px] font-medium text-body sm:text-[24px]">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </p>
            </div>

            <div className="h-10 w-px bg-hairline" />

            <div>
              <p className="eyebrow flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5 text-accent" />
                Cold-Chain
              </p>
              <p className="numerals mt-1.5 text-[15px] font-semibold text-accent">
                1.4°C Protected
              </p>
            </div>

            <div className="h-10 w-px bg-hairline" />

            <div>
              <p className="eyebrow">Active SKUs</p>
              <p className="numerals mt-1.5 text-[15px] font-semibold text-body">
                51,000+ Fresh
              </p>
            </div>
          </div>
        </div>

        {/* Waste-to-Welfare / Orphanage Decoration & Nourishment Banner */}
        <div className="mt-8 overflow-hidden rounded-[20px] border border-accent/25 bg-gradient-to-r from-accent/15 via-panel to-accent/10 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 text-accent">
                <Heart className="h-4 w-4 fill-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Zero-Waste • Orphanage Sanctuary Pledge
                </span>
              </div>

              <h3 className="title-editorial mt-2.5 text-[22px] font-normal leading-snug text-body sm:text-[28px]">
                Fresh flowers to decorate care rooms. <br />
                <span className="text-accent font-display italic">Organic fruit to nourish young lives.</span>
              </h3>

              <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-quiet sm:text-[14px]">
                Our harvest is strictly fresh. At dusk, every unsold floral arrangement is hand-delivered to brighten
                dormitories, classrooms, and pediatric wards across <strong>24 partner orphanages</strong>. Unsold organic produce
                and fish are repurposed into wholesome children&apos;s meals for free or nominal micro-cost.
              </p>

              {/* Beneficiary Pill Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-quiet">Supported Sanctuary Homes:</span>
                {[
                  "Sunshine Sanctuary",
                  "Lotus Child Welfare",
                  "Hope Haven Home",
                  "Little Angels Care",
                  "Grace Foundation"
                ].map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full border border-hairline bg-panel/80 px-2.5 py-0.5 text-[11px] text-body"
                  >
                    <Smile className="h-3 w-3 text-accent" />
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Impact Counters */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-5 lg:gap-3.5">
              {[
                { count: '24', label: 'Orphanages Decorated', icon: '🌸' },
                { count: '340+', label: 'Bouquets Donated', icon: '💐' },
                { count: '2,850+', label: 'Meals Sponsored', icon: '🍎' },
                { count: '99.4%', label: 'Zero-Waste Rate', icon: '♻️' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-[14px] border border-hairline/80 bg-panel/90 p-3.5 text-center shadow-sm">
                  <div className="text-xl">{stat.icon}</div>
                  <p className="numerals mt-1.5 text-[18px] font-semibold text-body sm:text-[20px]">{stat.count}</p>
                  <p className="eyebrow mt-1 text-[9.5px] leading-tight text-quiet">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Donation & Impact Reward Coupon Calculator */}
        <div className="mt-8 rounded-[20px] border border-hairline bg-panel p-6 shadow-quiet sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-accent" />
                <p className="eyebrow text-accent">Real-Time Donation &amp; Impact Coupon</p>
              </div>
              <h4 className="title-editorial mt-1 text-[20px] text-body sm:text-[24px]">
                Support an Orphanage with Your Purchase
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-quiet">
                Add a micro-pledge at checkout. See exactly how your contribution translates into fresh fruits
                and floral cheer in real-time, plus unlock an instant <strong>20% off Impact Coupon</strong> with your order!
              </p>

              {/* Amount Selector Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {DONATION_PRESETS.map((p) => (
                  <button
                    key={p.amount}
                    onClick={() => setPledgeAmount(p.amount)}
                    className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-medium transition-all ${
                      pledgeAmount === p.amount
                        ? 'border-accent bg-accent text-on-solid shadow-sm'
                        : 'border border-hairline bg-panel hover:border-body text-body'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Real-Time Impact Display & Coupon Box */}
            <div className="min-w-0 flex-1 rounded-[16px] border border-accent/30 bg-accent-soft/40 p-5 lg:max-w-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="eyebrow text-accent">Real-Time Impact For {formatINR(pledgeAmount)}</span>
                  <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-body">
                    {pledgeImpact?.impactDescription || 'Sponsors fresh organic fruit breakfast baskets & flowers for children in need.'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-semibold uppercase text-accent">
                    {pledgeImpact?.badge || 'Maison Hope Angel'}
                  </span>
                </div>
              </div>

              {/* Generated Real-Time Coupon */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-hairline/80 bg-panel px-4 py-2.5 shadow-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-quiet">Instant Reward Coupon</p>
                  <p className="font-mono text-[14px] font-bold tracking-wider text-accent">
                    {pledgeImpact?.rewardCoupon?.code || 'HOPE-BLOOM-20'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCoupon(pledgeImpact?.rewardCoupon?.code || 'HOPE-BLOOM-20')}
                  className="btn-line flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] uppercase tracking-[0.12em]"
                >
                  {copiedCoupon ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCoupon ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Fresh Harvest', count: '50,000+ Units Daily' },
              { id: 'organic-fruits', label: 'Organic Fruits', count: 'Orchard Fresh' },
              { id: 'fresh-flowers', label: 'Fresh Flowers', count: 'Morning Flora' },
              { id: 'fresh-fish', label: 'Fresh Wild Catch', count: 'Daily Catch' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-full px-4 py-2 text-[12px] font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-body bg-solid text-on-solid shadow-sm'
                    : 'border border-hairline bg-panel text-quiet hover:border-body hover:text-body'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 text-[10.5px] opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedCategory(activeTab === 'all' ? 'organic-fruits' : activeTab);
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="link-quiet inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em]"
          >
            <span>Browse Full Fresh Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Fresh Products Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {freshProducts.map((p) => {
            const originalPrice = p.price / (1 - p.discountPercentage / 100);
            return (
              <Card3D key={p.id} maxTilt={6}>
                <article className="group relative flex h-full flex-col rounded-[16px] border border-hairline/60 bg-panel p-3 transition-all duration-500 hover:border-hairline hover:shadow-quiet">
                  {/* Origin Badge */}
                  <div className="absolute left-4 top-4 z-20" style={{ transform: 'translateZ(30px)' }}>
                    <span className="rounded-full bg-accent-soft/90 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-accent backdrop-blur-sm">
                      {p.brand || 'Daily Fresh'}
                    </span>
                  </div>

                  {/* Image Frame */}
                  <button
                    onClick={() => setQuickViewProduct(p)}
                    aria-label={`View ${p.title}`}
                    style={{ transform: 'translateZ(25px)' }}
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-recess transition-transform duration-500"
                  >
                    <img
                      src={getCloudinaryOptimizedImageUrl(p.thumbnail, 600, p.category)}
                      alt={p.title}
                      loading="lazy"
                      onError={(e) => handleImageError(e, p.category)}
                      className="h-full w-full object-cover object-center transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                    />
                    {p.discountPercentage > 0 && (
                      <span className="absolute right-3 top-3 z-10 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent">
                        -{Math.round(p.discountPercentage)}%
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 z-10 flex translate-y-full items-center justify-between bg-canvas/95 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-body backdrop-blur-md transition-transform duration-400 group-hover:translate-y-0">
                      Quick view
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  {/* Product Details */}
                  <div className="mt-3.5 flex flex-1 flex-col justify-between" style={{ transform: 'translateZ(15px)' }}>
                    <div>
                      <p className="eyebrow truncate capitalize text-quiet">{p.category?.replace('-', ' ')}</p>
                      <h4
                        onClick={() => setQuickViewProduct(p)}
                        className="mt-1 cursor-pointer text-[14px] font-medium leading-snug text-body transition-colors group-hover:text-accent"
                      >
                        <span className="line-clamp-2">{p.title}</span>
                      </h4>
                    </div>

                    <div className="mt-3 flex items-end justify-between border-t border-hairline pt-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="numerals text-[16.5px] font-medium text-body">{formatINR(p.price)}</span>
                          {p.discountPercentage > 0 && (
                            <span className="numerals text-[11px] text-faint line-through">{formatINR(originalPrice)}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-success">✓ 05:00 AM Dawn Harvest</p>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        className="btn-solid px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.12em]"
                        title="Add to bag"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              </Card3D>
            );
          })}
        </div>
      </div>
    </section>
  );
}

