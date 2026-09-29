import React, { useState } from 'react';
import { useShop } from '../context/ShopContext.tsx';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  SearchX,
  ArrowUpDown,
} from 'lucide-react';
import { formatINR } from '../utils/commerce';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Most admired' },
  { value: 'discount', label: 'Best value' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 180, damping: 22 } },
};

export default function ProductGrid() {
  const {
    products,
    loading,
    error,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    maxPriceFilter,
    setMaxPriceFilter,
  } = useShop();

  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMaxPriceFilter(2500);
  };

  return (
    <section id="catalog-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Section heading */}
      <div className="flex flex-col gap-6 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-accent" />
            <p className="eyebrow">The catalogue</p>
          </div>
          <h2 className="title-editorial mt-4 text-[34px] sm:text-[42px]">
            <span className="capitalize">{selectedCategory.replace('-', ' ')}</span>
            <span className="ml-3 align-middle text-[13px] font-sans tracking-[0.18em] text-faint">
              {String(products.length).padStart(2, '0')} PIECES
            </span>
          </h2>
          {searchQuery && (
            <p className="mt-3 text-[13px] text-quiet">
              Results for <span className="text-body">“{searchQuery}”</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="chip"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            Refine
          </button>
          <div className="flex items-center rounded-full border border-hairline bg-panel p-1">
            <button
              onClick={() => setLayoutMode('grid')}
              aria-label="Grid view"
              className={`rounded-full p-1.5 transition-colors ${layoutMode === 'grid' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'}`}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              aria-label="List view"
              className={`rounded-full p-1.5 transition-colors ${layoutMode === 'list' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'}`}
            >
              <List className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="scrollbar-none -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((cat: string) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? 'chip-active shrink-0 capitalize' : 'chip shrink-0 capitalize'}
          >
            {cat.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Refine panel */}
      {showFilters && (
        <div className="card-premium menu-in mt-6 grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Budget ceiling</p>
              <span className="numerals text-[13px] text-body">{formatINR(maxPriceFilter)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="2500"
              step="20"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              aria-label="Maximum price"
              className="mt-4 w-full accent-accent"
            />
            <div className="mt-2 flex justify-between text-[11px] text-faint">
              <span>{formatINR(20)}</span>
              <span>{formatINR(2500)}</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">Sort</p>
            <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-hairline bg-panel px-3.5 py-2.5">
              <ArrowUpDown className="h-4 w-4 text-quiet" strokeWidth={1.5} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="w-full cursor-pointer bg-transparent text-[13px] text-body outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-10 rounded-[16px] border border-[#9B3B22]/25 bg-[#9B3B22]/8 p-8 text-center">
          <p className="text-[14px] text-[#9B3B22]">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-line mt-5">
            Retry
          </button>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className={layoutMode === 'grid' ? 'mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'mt-10 space-y-4'}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="card-premium flex h-[22rem] flex-col gap-4 p-3">
              <div className="skeleton h-52 w-full" />
              <div className="skeleton h-3 w-1/3" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton mt-auto h-5 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="card-premium mx-auto mt-14 max-w-md p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-hairline">
            <SearchX className="h-6 w-6 text-accent" strokeWidth={1.5} />
          </div>
          <h3 className="title-editorial mt-6 text-[24px]">Nothing matched</h3>
          <p className="mt-3 text-[13px] leading-relaxed text-quiet">
            Try widening your budget, clearing the search field, or browsing the full catalogue.
          </p>
          <button onClick={resetFilters} className="btn-solid mt-7 uppercase tracking-[0.14em]">
            Reset refinements
          </button>
        </div>
      )}

      {/* Products */}
      {!loading && products.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={
            layoutMode === 'grid'
              ? 'mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'mt-10 space-y-4'
          }
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants} className="h-full">
              <ProductCard product={product} layout={layoutMode} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}