import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  SearchX,
  ArrowUpDown,
  Lock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatINR } from '../utils/commerce';

const sortOptions = [
  { value: 'featured', label: 'Featured Pieces' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Most admired' },
  { value: 'discount', label: 'Best value' },
];

export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    eyebrow: string;
    icon: string;
    description: string;
    isAdult?: boolean;
    subcategories?: { id: string; label: string }[];
  }
> = {
  all: {
    label: 'All Departments',
    eyebrow: 'Maison Sovereign Portfolio',
    icon: '✨',
    description: 'Curated luxury across all 11 distinct departments and 1,200+ authenticated pieces in INR.',
  },
  fashion: {
    label: 'Fashion & Apparels',
    eyebrow: 'Haute Couture & Bespoke Tailoring',
    icon: '👗',
    description: 'Separated Men & Women collections from wedding lehengas and Banarasi silk sarees to Savile Row Giza cotton tailoring.',
    subcategories: [
      { id: 'all', label: 'All Apparels' },
      { id: 'dresses', label: 'Dresses & Gowns' },
      { id: 'sarees', label: 'Sarees & Handlooms' },
      { id: 'kurtas', label: 'Kurtas & Ethnic Sets' },
      { id: 'lehengas', label: 'Lehengas & Bridal' },
      { id: 'shirts', label: 'Bespoke Shirts' },
      { id: 'suits', label: 'Suits & Blazers' },
      { id: 'jeans', label: 'Selvedge Denim' },
      { id: 'trousers', label: 'Tailored Trousers' },
      { id: 'winterwear', label: 'Coats & Cashmere' },
      { id: 'footwear', label: 'Goodyear & Footwear' },
      { id: 'bags', label: 'Leather Bags & Clutches' },
      { id: 'accessories', label: 'Watches & Accessories' },
    ],
  },
  beauty: {
    label: 'Beauty & Personal Care',
    eyebrow: 'Artisanal Wellness & Alchemy',
    icon: '💄',
    description: 'Separated Men & Women wellness, cold-pressed Kumkumadi Ayurvedic fluids, French perfumes, and precision grooming.',
    subcategories: [
      { id: 'all', label: 'All Beauty' },
      { id: 'skincare', label: 'Skincare & Elixirs' },
      { id: 'fragrance', label: 'French Parfums & Oud' },
      { id: 'haircare', label: 'Hair Care & Oils' },
      { id: 'shaving', label: 'Safety Razors & Shave' },
      { id: 'beard-care', label: 'Beard Oils & Balms' },
      { id: 'makeup', label: 'Luminous Silk & Matte' },
      { id: 'bath-body', label: 'Himalayan Bath & Body' },
    ],
  },
  electronics: {
    label: 'Electronics',
    eyebrow: 'Flagship Technology & Hi-Fi',
    icon: '📱',
    description: 'Titanium smartphones, M3 laptops, beryllium noise-cancelling audio, 61MP cinema cameras, and pro gaming.',
    subcategories: [
      { id: 'all', label: 'All Electronics' },
      { id: 'smartphones', label: 'Flagship Smartphones' },
      { id: 'laptops', label: 'Laptops & Ultrabooks' },
      { id: 'audio', label: 'Hi-Fi Audio & ANC' },
      { id: 'smartwatches', label: 'Titanium Smartwatches' },
      { id: 'cameras', label: 'Cinema Cameras & Lenses' },
      { id: 'gaming', label: 'OLED Consoles & Keyboards' },
      { id: 'drones', label: '4K Aerial Drones' },
    ],
  },
  'home-apparels': {
    label: 'Home Apparels',
    eyebrow: 'Textile Sanctuaries & Bedding',
    icon: '🛏️',
    description: '1000-thread Egyptian cotton sheets, Belgian flax duvet suites, blackout velvet drapes, and hand-knotted Kashmiri rugs.',
    subcategories: [
      { id: 'all', label: 'All Home Apparels' },
      { id: 'bedsheets', label: '1000 TC Egyptian Bedding' },
      { id: 'duvets', label: 'Goose Down Duvets' },
      { id: 'curtains', label: 'Heavy Velvet Curtains' },
      { id: 'towels', label: 'Turkish Spa Towels' },
      { id: 'rugs', label: 'Kashmiri Hand-Knotted Rugs' },
      { id: 'cushions', label: 'Crewel Embroidered Cushions' },
      { id: 'dining', label: 'Block-Printed Table Suites' },
    ],
  },
  appliances: {
    label: 'Appliances',
    eyebrow: 'Smart Home & Culinary Systems',
    icon: '🍳',
    description: 'Smart French-door inverter refrigeration, 10.5kg steam washers, 19-bar bean-to-cup espresso, and air fryers.',
    subcategories: [
      { id: 'all', label: 'All Appliances' },
      { id: 'refrigeration', label: 'Smart Refrigerators' },
      { id: 'washing', label: 'Steam Washers' },
      { id: 'air-conditioning', label: '5-Star Split ACs' },
      { id: 'espresso', label: '19-Bar Espresso Machines' },
      { id: 'cooking', label: 'Convection & Air Fryers' },
      { id: 'kitchen', label: 'Curved Glass Chimneys' },
      { id: 'cleaning', label: 'LiDAR Robot Vacuums' },
    ],
  },
  toys: {
    label: 'Toys & Games',
    eyebrow: 'STEM, Robotics & Discovery',
    icon: '🧸',
    description: 'Programmable modular robotics, 3200-piece architectural bricks, weighted rosewood Staunton chess, and RC trucks.',
    subcategories: [
      { id: 'all', label: 'All Toys & Games' },
      { id: 'robotics', label: 'Modular STEM Robotics' },
      { id: 'building', label: 'Architectural Brick Sets' },
      { id: 'chess', label: 'Rosewood Chess Sets' },
      { id: 'rc', label: 'Brushless 4WD RC Vehicles' },
      { id: 'telescopes', label: 'Refractor Telescopes' },
      { id: 'board-games', label: 'Strategy Board Games' },
      { id: 'montessori', label: 'Montessori Wooden Puzzles' },
    ],
  },
  books: {
    label: 'Books & Literature',
    eyebrow: 'Timeless Epics & Rare Editions (0% GST)',
    icon: '📚',
    description: '10-volume unabridged Sanskrit Mahabharata, Booker Prize classics, gilded leatherbound finance, and Folio editions.',
    subcategories: [
      { id: 'all', label: 'All Books' },
      { id: 'epics', label: 'Indian Epics & Mythology' },
      { id: 'fiction', label: 'Literary & Global Fiction' },
      { id: 'wealth', label: 'Business & Finance' },
      { id: 'history', label: 'History & Democracy' },
      { id: 'classics', label: 'Gilded Leatherbound Classics' },
      { id: 'sci-fi', label: 'Folio Sci-Fi & Speculative' },
    ],
  },
  sports: {
    label: 'Sports & Fitness',
    eyebrow: 'Championship Athletic Gear',
    icon: '🏏',
    description: 'English willow Grade 1+ cricket bats, high-modulus Japanese badminton, FIFA match balls, and quick-adjust dumbbells.',
    subcategories: [
      { id: 'all', label: 'All Sports' },
      { id: 'cricket', label: 'Grade 1+ English Willow Bats' },
      { id: 'badminton', label: 'High-Modulus Carbon Rackets' },
      { id: 'football', label: 'FIFA Pro Match Balls' },
      { id: 'tennis', label: 'Tournament Tennis Rackets' },
      { id: 'gym', label: 'Quick-Adjust Dumbbells' },
      { id: 'cardio', label: 'Motorized Treadmills & Bikes' },
      { id: 'yoga', label: 'Natural Tree Rubber Yoga Mats' },
    ],
  },
  food: {
    label: 'Gourmet & Organic Food',
    eyebrow: 'Single-Estate Harvests & Pantry',
    icon: '☕',
    description: 'Araku Valley shade-grown Arabica, first-flush Castleton Darjeeling, single-origin cacao, and Kashmiri Mongra saffron.',
    subcategories: [
      { id: 'all', label: 'All Gourmet Food' },
      { id: 'coffee', label: 'Araku Valley Arabica' },
      { id: 'tea', label: 'Castleton First-Flush Tea' },
      { id: 'saffron', label: 'Kashmiri Mongra Saffron' },
      { id: 'chocolate', label: 'Single-Origin Cacao' },
      { id: 'honey', label: 'Wild Forest Raw Honey' },
      { id: 'oils', label: 'Cold-Pressed Virgin Oils' },
      { id: 'dry-fruits', label: 'Mamra Almonds & Pistachios' },
    ],
  },
  worship: {
    label: 'Sacred & Worship Essentials',
    eyebrow: 'Divine Vedic Sanctuaries',
    icon: '🪔',
    description: 'Hand-engraved pure brass pooja thalis, cast brass Ganesha & Ashtalakshmi murtis, akhand diyas, and Mysore sandalwood.',
    subcategories: [
      { id: 'all', label: 'All Sacred Essentials' },
      { id: 'thalis', label: 'Solid Brass Pooja Thalis' },
      { id: 'murtis', label: 'Handcrafted Brass Deities' },
      { id: 'diyas', label: 'Borosilicate Akhand Diyas' },
      { id: 'incense', label: 'Mysore Sandal Agarbatti' },
      { id: 'havan', label: 'Copper Havan Kund Sets' },
      { id: 'malas', label: 'Certified Rudraksha Malas' },
      { id: 'lamps', label: 'Kerala Peacock Vilakku' },
    ],
  },
  'liquor-tobacco': {
    label: 'Liquor & Tobacco',
    eyebrow: 'The Sovereign Cellar (18+ Statutory Gate)',
    icon: '🍷',
    isAdult: true,
    description: 'Single malt scotch, Japanese whiskies, vintage French champagnes, Indian single malts, and hand-rolled Cuban cigars.',
    subcategories: [
      { id: 'all', label: 'All Cellar & Tobacco' },
      { id: 'whisky', label: 'Single Malt Scotch & Japanese' },
      { id: 'cognac', label: 'Hennessy XO & Cognac' },
      { id: 'champagne', label: 'Dom Pérignon Vintage' },
      { id: 'wine', label: 'Sassicaia & Fine Wines' },
      { id: 'gin', label: 'Artisanal Indian Craft Gins' },
      { id: 'beer', label: 'Small-Batch Craft Beers' },
      { id: 'cigar', label: 'Cohiba & Cuban Cigars' },
      { id: 'accessories', label: 'Spanish Cedar Humidors' },
    ],
  },
};

const getCategoryLabel = (cat: string) =>
  CATEGORY_CONFIG[cat.toLowerCase()]?.label || cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
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
    selectedSubcategory,
    setSelectedSubcategory,
    categoryGender,
    setCategoryGender,
    liquorOriginFilter,
    setLiquorOriginFilter,
    isAgeVerified,
    setIsAgeGateOpen,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    maxPriceFilter,
    setMaxPriceFilter,
    totalCount = 0,
    hasMore = false,
    loadMore,
    loadAll,
    loadingMore = false,
  } = useShop();

  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const currentConfig = CATEGORY_CONFIG[selectedCategory.toLowerCase()] || {
    label: getCategoryLabel(selectedCategory),
    eyebrow: 'Curated Department',
    icon: '📦',
    description: 'Authenticated luxury pieces in INR with statutory dual GST tax invoices.',
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setCategoryGender('all');
    setLiquorOriginFilter('all');
    setMaxPriceFilter(300000);
  };

  const handleCategorySelect = (cat: string) => {
    if (cat === 'liquor-tobacco' && !isAgeVerified) {
      setIsAgeGateOpen(true);
      return;
    }
    setSelectedCategory(cat);
  };

  return (
    <section id="catalog-section" className="shell py-10 phone-lg:py-12 sm:py-16 3xl:py-20">
      {/* 1. Main Department Navigation Bar (All 11 Separated Sections) */}
      <div className="mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-quiet">
              11 Separated Departments • 1,220+ Client-Grade Listings in INR (₹)
            </span>
          </div>
          <span className="text-[11px] font-mono text-faint hidden sm:inline">
            Statutory Dual GST: CGST (9%) + SGST (9%)
          </span>
        </div>

        {/* Scrollable Department Carousel / Pills */}
        <div className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 py-3">
          {categories.map((cat: string) => {
            const conf = CATEGORY_CONFIG[cat.toLowerCase()];
            const isSelected = selectedCategory === cat;
            const isAdultGated = conf?.isAdult;

            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`group relative flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                  isSelected
                    ? 'bg-solid text-on-solid shadow-md ring-2 ring-accent/30'
                    : 'border border-hairline bg-panel text-quiet hover:border-quiet hover:text-body'
                }`}
              >
                <span className="text-sm">{conf?.icon || '📦'}</span>
                <span>{conf?.label || getCategoryLabel(cat)}</span>

                {isAdultGated && (
                  <span
                    className={`ml-1 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-black/20 text-on-solid'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <Lock className="h-2.5 w-2.5" /> 18+
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Department Spotlight Banner */}
      <div className="rounded-3xl border border-hairline bg-panel p-5 phone-lg:p-8 mb-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between relative z-10">
          <div className="min-w-0 max-w-3xl">
            <div className="flex items-center gap-2.5 text-accent font-semibold text-xs uppercase tracking-wider mb-2">
              <span className="text-base">{currentConfig.icon}</span>
              <span>{currentConfig.eyebrow}</span>
              {currentConfig.isAdult && (
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold font-mono">
                  18+ Verified Active
                </span>
              )}
            </div>

            <h2 className="title-editorial text-[28px] phone-lg:text-[34px] sm:text-[42px] text-body leading-tight">
              {currentConfig.label}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-quiet leading-relaxed">
              {currentConfig.description}
            </p>

            {searchQuery && (
              <p className="mt-3 text-xs text-quiet font-mono">
                Matching keyword: <span className="text-accent font-bold">“{searchQuery}”</span>
              </p>
            )}
          </div>

          {/* Pieces Counter & Refine Control */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <span className="rounded-full bg-recess border border-hairline px-3.5 py-1.5 font-mono text-[11px] font-bold text-body">
              {totalCount > 0 ? `${products.length} of ${totalCount.toLocaleString()} SKUs` : `${products.length} SKUs`}
            </span>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="chip text-xs"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span>Refine Price &amp; Sort</span>
            </button>

            <div className="flex items-center rounded-full border border-hairline bg-canvas p-1">
              <button
                onClick={() => setLayoutMode('grid')}
                aria-label="Grid view"
                className={`rounded-full p-1.5 transition-colors ${
                  layoutMode === 'grid' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                aria-label="List view"
                className={`rounded-full p-1.5 transition-colors ${
                  layoutMode === 'list' ? 'bg-solid text-on-solid' : 'text-quiet hover:text-body'
                }`}
              >
                <List className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Specialized Department Sub-Segment Bars (Like Amazon & Flipkart) */}
        
        {/* 3A. FASHION: Male vs Female Segmentation */}
        {selectedCategory === 'fashion' && (
          <div className="mt-6 pt-5 border-t border-hairline space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-quiet">
                Select Department:
              </span>
              <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-recess p-1">
                {[
                  { id: 'all', label: 'All Fashion', icon: '✨' },
                  { id: 'female', label: "Women's Collection (Female)", icon: '👗' },
                  { id: 'male', label: "Men's Collection (Male)", icon: '👔' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setCategoryGender(g.id as any);
                      setSelectedSubcategory('all');
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      categoryGender === g.id
                        ? 'bg-solid text-on-solid shadow-sm'
                        : 'text-quiet hover:text-body'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Apparels Categorized Sub-Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-faint">Apparels:</span>
              {(currentConfig.subcategories || []).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-medium border transition-all ${
                    selectedSubcategory === sub.id
                      ? 'border-accent bg-accent/15 text-accent font-semibold'
                      : 'border-hairline bg-canvas text-quiet hover:text-body'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3B. BEAUTY: Male Grooming vs Women's Beauty Segmentation */}
        {selectedCategory === 'beauty' && (
          <div className="mt-6 pt-5 border-t border-hairline space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-quiet">
                Select Department:
              </span>
              <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-recess p-1">
                {[
                  { id: 'all', label: 'All Beauty & Wellness', icon: '✨' },
                  { id: 'female', label: "Women's Beauty & Makeup", icon: '💄' },
                  { id: 'male', label: "Men's Grooming & Shaving", icon: '🧔' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setCategoryGender(g.id as any);
                      setSelectedSubcategory('all');
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      categoryGender === g.id
                        ? 'bg-solid text-on-solid shadow-sm'
                        : 'text-quiet hover:text-body'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Beauty Categories */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-faint">Categories:</span>
              {(currentConfig.subcategories || []).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-medium border transition-all ${
                    selectedSubcategory === sub.id
                      ? 'border-accent bg-accent/15 text-accent font-semibold'
                      : 'border-hairline bg-canvas text-quiet hover:text-body'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3C. LIQUOR & TOBACCO: Imported vs Domestic Craft Segmentation */}
        {selectedCategory === 'liquor-tobacco' && (
          <div className="mt-6 pt-5 border-t border-hairline space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-quiet">
                Cellar Provenance:
              </span>
              <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-recess p-1">
                {[
                  { id: 'all', label: 'All Cellar & Tobacco', icon: '🍷' },
                  { id: 'imported', label: 'Imported Luxury Spirits & Cuban Cigars', icon: '✈️' },
                  { id: 'domestic', label: 'Domestic Single Malts & Craft Gins', icon: '🇮🇳' },
                ].map((orig) => (
                  <button
                    key={orig.id}
                    onClick={() => {
                      setLiquorOriginFilter(orig.id as any);
                      setSelectedSubcategory('all');
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      liquorOriginFilter === orig.id
                        ? 'bg-solid text-on-solid shadow-sm'
                        : 'text-quiet hover:text-body'
                    }`}
                  >
                    <span>{orig.icon}</span>
                    <span>{orig.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cellar Types */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-faint">Cellar Wings:</span>
              {(currentConfig.subcategories || []).map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-medium border transition-all ${
                    selectedSubcategory === sub.id
                      ? 'border-accent bg-accent/15 text-accent font-semibold'
                      : 'border-hairline bg-canvas text-quiet hover:text-body'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3D. OTHER DEPARTMENTS: Subcategory Quick Chips */}
        {selectedCategory !== 'fashion' &&
          selectedCategory !== 'beauty' &&
          selectedCategory !== 'liquor-tobacco' &&
          currentConfig.subcategories && (
            <div className="mt-5 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-faint">Wing:</span>
              {currentConfig.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-medium border transition-all ${
                    selectedSubcategory === sub.id
                      ? 'border-accent bg-accent/15 text-accent font-semibold'
                      : 'border-hairline bg-canvas text-quiet hover:text-body'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* 4. Refine & Filters Slide-Down Panel */}
      {showFilters && (
        <div className="card-premium menu-in mb-8 grid grid-cols-1 gap-6 p-6 md:grid-cols-2 bg-panel">
          <div>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Budget Ceiling (INR)</p>
              <span className="numerals font-bold text-sm text-body">{formatINR(maxPriceFilter)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="300000"
              step="500"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              aria-label="Maximum price in INR"
              className="mt-4 w-full accent-accent"
            />
            <div className="mt-2 flex justify-between text-[11px] font-mono text-faint">
              <span>{formatINR(500)}</span>
              <span>{formatINR(150000)}</span>
              <span>{formatINR(300000)}</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">Sort Collection</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3">
              <ArrowUpDown className="h-4 w-4 text-quiet" strokeWidth={1.5} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="w-full cursor-pointer bg-transparent text-xs font-semibold text-body outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-panel text-body">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 5. Error View */}
      {error && (
        <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <p className="text-sm font-semibold text-rose-500">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-line mt-4">
            Retry Connection
          </button>
        </div>
      )}

      {/* 6. Loading Skeletons */}
      {loading && (
        <div
          className={
            layoutMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 4xl:grid-cols-5'
              : 'space-y-4'
          }
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="card-premium flex h-[22rem] flex-col gap-4 p-4 bg-panel">
              <div className="skeleton h-56 w-full rounded-xl" />
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton mt-auto h-5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* 7. Empty State */}
      {!loading && products.length === 0 && (
        <div className="card-premium mx-auto my-12 max-w-md p-8 text-center bg-panel">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-recess">
            <SearchX className="h-6 w-6 text-accent" strokeWidth={1.5} />
          </div>
          <h3 className="title-editorial mt-5 text-[24px]">No Matching Pieces Found</h3>
          <p className="mt-2 text-xs leading-relaxed text-quiet">
            No active listings match your current subcategory or price criteria in this department. Try resetting filters to view all listings.
          </p>
          <button onClick={resetFilters} className="btn-solid mt-6 uppercase tracking-wider text-xs">
            Reset All Refinements
          </button>
        </div>
      )}

      {/* 8. Products Grid / List */}
      {!loading && products.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={
            layoutMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 4xl:grid-cols-5'
              : 'space-y-4'
          }
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={itemVariants} className="h-full">
              <ProductCard product={product} layout={layoutMode} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 9. Pagination: Load More & Show All */}
      {!loading && hasMore && (
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 pb-6">
          {loadMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn-solid flex items-center gap-2.5 px-8 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg hover:opacity-95 transition-all"
            >
              {loadingMore ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Loading more listings...</span>
                </>
              ) : (
                <span>
                  Discover more ({products.length} of {totalCount.toLocaleString()})
                </span>
              )}
            </button>
          )}
          {loadAll && (
            <button
              onClick={loadAll}
              disabled={loadingMore}
              className="btn-line flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-panel"
            >
              Show all {totalCount.toLocaleString()} department pieces
            </button>
          )}
        </div>
      )}
    </section>
  );
}
