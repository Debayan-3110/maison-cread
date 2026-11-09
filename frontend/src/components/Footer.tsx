import React from 'react';
import { ArrowUpRight, ShieldCheck, Cookie } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Footer() {
  const { openLegalPolicy, openCookiePreferences } = useShop();

  const columns = [
    {
      title: 'Maison',
      links: [
        { label: 'Our Story', href: '#' },
        { label: 'Authentication Guarantee', onClick: () => openLegalPolicy('terms') },
        { label: 'Sustainability & Ethics', href: '#' },
        { label: 'Careers', href: '#' },
      ],
    },
    {
      title: 'Client Care',
      links: [
        { label: 'Shipping & Delivery', onClick: () => openLegalPolicy('terms') },
        { label: 'Returns & Open Box (OBD)', onClick: () => openLegalPolicy('returns') },
        { label: 'Track an Order', href: '#' },
        { label: 'Contact Concierge', href: '#' },
      ],
    },
    {
      title: 'Compliance & Rights',
      links: [
        { label: 'Privacy Policy (DPDP / GDPR)', onClick: () => openLegalPolicy('privacy') },
        { label: 'Terms & Conditions', onClick: () => openLegalPolicy('terms') },
        { label: 'Cookie Storage Policy', onClick: () => openLegalPolicy('cookies') },
        { label: 'Open Box Delivery Protocol', onClick: () => openLegalPolicy('returns') },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-hairline bg-canvas text-body phone-lg:mt-20 3xl:mt-24">
      {/* Newsletter — editorial band */}
      <div className="border-b border-hairline">
        <div className="shell grid grid-cols-1 items-end gap-6 py-10 phone-lg:gap-8 phone-lg:py-12 lg:grid-cols-12 3xl:py-14">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">The Dispatch</p>
            <h3 className="title-editorial text-[24px] phone:text-[26px] phone-xl:text-[30px] sm:text-[38px] max-w-xl text-balance 3xl:text-[42px]">
              A quiet letter on new arrivals, restocks and private viewings.
            </h3>
          </div>
          <form
            className="lg:col-span-5 flex w-full items-center gap-2 border-b border-hairline pb-3 focus-within:border-body transition-colors phone-lg:gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              aria-label="Email address"
              className="flex-1 bg-transparent text-sm text-body placeholder:text-faint outline-none py-2"
            />
            <button
              type="submit"
              className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-body"
            >
              Subscribe
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Link columns */}
      <div className="shell grid grid-cols-2 gap-6 py-10 phone-lg:gap-8 phone-lg:py-12 md:grid-cols-12 3xl:py-16">
        <div className="col-span-2 md:col-span-5">
          <p className="font-display text-[22px] leading-none tracking-tight phone-xl:text-[26px]">Maison Cread</p>
          <p className="mt-4 text-sm text-quiet max-w-xs leading-relaxed">
            A curated house of technology, timepieces and objects — authenticated, insured and
            delivered with care.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet">
              <ShieldCheck className="h-3 w-3 text-[#007BA7]" />
              DPDP Act 2023 & GDPR Compliant
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet">
              Insured Open Box Delivery
            </span>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="md:col-span-2">
            <p className="eyebrow mb-5">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.onClick ? (
                    <button
                      type="button"
                      onClick={link.onClick}
                      className="text-left text-sm link-quiet hover:text-body transition-colors"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href} className="text-sm link-quiet">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-1" />
      </div>

      {/* Legal bar */}
      <div className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 flex flex-col sm:flex-row items-center justify-between gap-4 phone-lg:pb-6">
          <p className="text-[11px] text-faint text-center sm:text-left">
            © {new Date().getFullYear()} ShopCread (Maison Cread). Consumer Protection (E-Commerce) Rules 2020.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 phone-lg:gap-6">
            <button
              type="button"
              onClick={() => openLegalPolicy('terms')}
              className="text-[11px] link-quiet hover:text-body transition-colors"
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => openLegalPolicy('privacy')}
              className="text-[11px] link-quiet hover:text-body transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => openLegalPolicy('cookies')}
              className="text-[11px] link-quiet hover:text-body transition-colors"
            >
              Cookie Policy
            </button>
            <button
              type="button"
              onClick={() => openLegalPolicy('returns')}
              className="text-[11px] link-quiet hover:text-body transition-colors"
            >
              Returns & OBD
            </button>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="inline-flex items-center gap-1 text-[11px] text-[#007BA7] hover:underline transition-colors"
            >
              <Cookie className="h-3 w-3" />
              Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

