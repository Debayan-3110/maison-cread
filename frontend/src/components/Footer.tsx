import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const columns = [
  {
    title: 'Maison',
    links: ['Our Story', 'Authentication', 'Sustainability', 'Careers'],
  },
  {
    title: 'Client Care',
    links: ['Shipping & Delivery', 'Returns & Exchange', 'Track an Order', 'Contact Concierge'],
  },
  {
    title: 'Services',
    links: ['Private Appointments', 'Gift Registry', 'Corporate Gifting', 'Trade-In Programme'],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline bg-canvas text-body">
      {/* Newsletter — editorial band */}
      <div className="border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-4">The Dispatch</p>
            <h3 className="title-editorial text-[30px] sm:text-[38px] max-w-xl text-balance">
              A quiet letter on new arrivals, restocks and private viewings.
            </h3>
          </div>
          <form
            className="lg:col-span-5 flex items-center gap-3 border-b border-hairline pb-3 focus-within:border-body transition-colors"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-12 gap-10">
        <div className="col-span-2 md:col-span-5">
          <p className="font-display text-[26px] leading-none tracking-tight">Maison Cread</p>
          <p className="mt-4 text-sm text-quiet max-w-xs leading-relaxed">
            A curated house of technology, timepieces and objects — authenticated, insured and
            delivered with care.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet">
              Secure payments
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-quiet">
              Insured delivery
            </span>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="md:col-span-2">
            <p className="eyebrow mb-5">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm link-quiet">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-1" />
      </div>

      {/* Legal bar */}
      <div className="border-t border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-faint">
            © {new Date().getFullYear()} Maison Cread. All rights reserved.
          </p>
          <div className="flex items-center gap-7">
            {['Terms', 'Privacy', 'Cookies', 'Accessibility'].map((item) => (
              <a key={item} href="#" className="text-[11px] link-quiet">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

