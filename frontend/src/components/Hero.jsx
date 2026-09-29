import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';
import { formatINR } from '../utils/commerce';

const indexWord = (n) => String(n).padStart(2, '0');

export default function Hero() {
  const { products, setQuickViewProduct, setSelectedCategory } = useShop();
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const featured = useMemo(() => {
    const pool = products && products.length ? products : [];
    if (!pool.length) return null;
    return [...pool].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [products]);

  const goToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Editorial copy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-accent" />
              <p className="eyebrow">Autumn Edit 2026</p>
            </div>

            <h1 className="title-editorial mt-7 text-[44px] sm:text-[62px] lg:text-[70px] text-balance">
              Considered objects for a life well <em className="font-display italic text-accent">equipped</em>.
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-[1.75] text-quiet sm:text-[16px]">
              A tightly edited selection of instruments, timepieces and everyday essentials —
              each one authenticated, insured in transit and backed by our house guarantee.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={goToCatalog} className="btn-solid group uppercase tracking-[0.14em]">
                Shop the collection
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => { setSelectedCategory('smartphones'); goToCatalog(); }}
                className="btn-line uppercase tracking-[0.14em]"
              >
                The phone edit
              </button>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-hairline pt-8 sm:grid-cols-4">
              {[
                ['Authentication', 'Every piece verified in-house'],
                ['Delivery', 'Insured, signature on arrival'],
                ['Returns', 'Thirty days, no questions'],
                ['Concierge', 'Advice before you commit'],
              ].map(([title, note]) => (
                <div key={title}>
                  <dt className="eyebrow">{title}</dt>
                  <dd className="mt-2 text-[12.5px] leading-relaxed text-quiet">{note}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Featured plate */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="frame-still relative aspect-[4/5] w-full p-8 sm:p-10">
                <div className="texture-lines absolute inset-0 opacity-60" />
                {featured ? (
                  <button
                    onClick={() => setQuickViewProduct(featured)}
                    className="group relative flex h-full w-full flex-col items-center justify-center"
                    aria-label={`View ${featured.title}`}
                  >
                    <img
                      src={featured.thumbnail}
                      alt={featured.title}
                      className="max-h-[70%] w-auto max-w-full object-contain transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                    <span className="absolute bottom-0 left-0 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-quiet transition-colors group-hover:text-body">
                      View the piece
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </span>
                  </button>
                ) : (
                  <div className="skeleton absolute inset-8" />
                )}
              </div>

              <div className="card-premium mt-5 flex items-end justify-between gap-5 p-5">
                <div className="min-w-0">
                  <p className="eyebrow">Private sale</p>
                  <p className="mt-2 truncate text-[14px] text-body">{featured ? featured.title : 'Selecting this week’s piece'}</p>
                  <p className="mt-1 numerals text-[13px] text-quiet">
                    {featured ? formatINR(featured.price) : formatINR(0)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="eyebrow">Ends in</p>
                  <p className="numerals mt-2 text-[15px] tracking-[0.08em] text-body">
                    {indexWord(timeLeft.hours)}
                    <span className="text-faint"> :</span>
                    {indexWord(timeLeft.minutes)}
                    <span className="text-faint"> :</span>
                    {indexWord(timeLeft.seconds)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee band */}
      <div className="overflow-hidden border-y border-hairline bg-canvas py-3.5">
        <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center gap-12">
              {[
                'Authenticated sourcing',
                'Insured worldwide delivery',
                'Thirty-day returns',
                'Two-year house warranty',
                'Trade-in programme',
                'Private client services',
              ].map((word) => (
                <span key={word} className="flex items-center gap-12 text-[11px] font-medium uppercase tracking-[0.24em] text-quiet">
                  {word}
                  <span className="h-1 w-1 rounded-full bg-accent" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}