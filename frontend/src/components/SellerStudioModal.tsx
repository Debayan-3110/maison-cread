import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { createSellerProduct, fetchSellerInventory, updateSellerProductStock, uploadToCloudinary } from '../services/api';
import { formatRupees } from '../utils/commerce';
import {
  X,
  Package,
  Sparkles,
  Plus,
  CheckCircle,
  Thermometer,
  Clock,
  ShieldCheck,
  Heart,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Box,
  Truck,
  UploadCloud
} from 'lucide-react';

const PRESET_IMAGE_TEMPLATES = [
  {
    name: 'Red Roses Bouquet',
    category: 'fresh-flowers',
    url: 'https://images.unsplash.com/photo-1548094967-e25a127d1f6d?w=800&auto=format&fit=crop&q=80',
    title: 'Ecuadorian Grand Velvet Red Roses',
    brand: 'Maison Floral Atelier',
    freshness: '12 Days Hydrated Vase Life',
    temp: '0-2°C Continuous Cold Chain'
  },
  {
    name: 'French Lavender',
    category: 'fresh-flowers',
    url: 'https://images.unsplash.com/photo-1596988527597-4f04ed876ec6?w=800&auto=format&fit=crop&q=80',
    title: 'Provence Organic Wild Blue Lavender',
    brand: 'Provence Alpine Slopes',
    freshness: '14 Days Aromatic Bloom',
    temp: '1.4°C Cold Chain'
  },
  {
    name: 'Alphonso Mangoes',
    category: 'organic-fruits',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
    title: 'Ratnagiri GI Alphonso Mangoes Crate',
    brand: 'Devgad Organic Groves',
    freshness: 'Peak Brix 21° Sweetness',
    temp: '2-4°C Cellar Temperature'
  },
  {
    name: 'Wild Blueberries',
    category: 'organic-fruits',
    url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80',
    title: 'Nilgiri Alpine Wild Blueberries Tub',
    brand: 'Nilgiri Berry Collective',
    freshness: '7 Days Silvery Bloom',
    temp: '0-2°C Cryo-Padded'
  },
  {
    name: 'King Salmon',
    category: 'fresh-fish',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
    title: 'Wild Alaskan King Salmon Fillet',
    brand: 'Alaskan Cold Waters',
    freshness: '48h Flash-Iced Catch',
    temp: '0-1°C Slurry Iced'
  },
  {
    name: 'Tiger Prawns',
    category: 'fresh-fish',
    url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80',
    title: 'Sundarbans Jumbo Wild Tiger Prawns',
    brand: 'Sundarbans Estuary Catch',
    freshness: '48h Ocean-to-Gate',
    temp: '0-1.4°C Cold-Chain Sealed'
  }
];

const PACKAGING_PROTOCOLS = [
  'Thermal Insulated Eco-Shield Container',
  'Cold-Chain Cryo Gel Mat (0-2°C Continuous)',
  'Stem Hydration Gel Capsule / Seal',
  'Zero-Impact Shock Padded Interior',
  'Oxygen-Purged Nitrogen Seal',
  'Tamper-Evident Security Hologram'
];

export default function SellerStudioModal() {
  const {
    isSellerStudioOpen,
    setIsSellerStudioOpen,
    addSellerProduct,
    showToast
  } = useShop();

  const [activeTab, setActiveTab] = useState<'create' | 'inventory'>('create');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<{ totalProducts: number; totalInventoryUnits: number }>({
    totalProducts: 0,
    totalInventoryUnits: 0
  });

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('fresh-flowers');
  const [brand, setBrand] = useState('Maison Partner Atelier');
  const [priceInr, setPriceInr] = useState<number | string>(899);
  const [mrpInr, setMrpInr] = useState<number | string>(1099);
  const [stock, setStock] = useState<number>(35);
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(PRESET_IMAGE_TEMPLATES[0].url);
  const [freshnessWindow, setFreshnessWindow] = useState('7 Days Peak Freshness Window');
  const [storageTemp, setStorageTemp] = useState('1.4°C Continuous Cold Chain (0–2°C)');
  const [harvestTime, setHarvestTime] = useState('Today 05:00 AM (Dawn Harvest)');
  const [selectedPackaging, setSelectedPackaging] = useState<string[]>([
    'Thermal Insulated Eco-Shield Container',
    'Cold-Chain Cryo Gel Mat (0-2°C Continuous)',
    'Zero-Impact Shock Padded Interior',
    'Tamper-Evident Security Hologram'
  ]);
  const [orphanagePledge, setOrphanagePledge] = useState(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Load inventory when switching to inventory tab
  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const data = await fetchSellerInventory();
      if (data) {
        setInventoryItems(data.recentListings || []);
        setInventoryStats({
          totalProducts: data.totalProducts || 0,
          totalInventoryUnits: data.totalInventoryUnits || 0
        });
      }
    } catch (err) {
      console.warn('Failed to load inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (isSellerStudioOpen && activeTab === 'inventory') {
      loadInventory();
    }
  }, [isSellerStudioOpen, activeTab]);

  if (!isSellerStudioOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_IMAGE_TEMPLATES[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setThumbnail(preset.url);
    setBrand(preset.brand);
    setFreshnessWindow(preset.freshness);
    setStorageTemp(preset.temp);
    showToast(`Loaded preset template: ${preset.name}`, 'info');
  };

  const togglePackaging = (protocol: string) => {
    setSelectedPackaging((prev) =>
      prev.includes(protocol) ? prev.filter((p) => p !== protocol) : [...prev, protocol]
    );
  };

  const handleStockUpdate = async (productId: number, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await updateSellerProductStock(productId, newStock, 'Updated Just Now');
      setInventoryItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, stock: newStock } : item))
      );
      showToast(`Stock updated to ${newStock} units`, 'success');
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      showToast('Please enter a valid product title (min 3 chars).', 'error');
      return;
    }
    if (!thumbnail.startsWith('http')) {
      showToast('Please provide a valid image URL starting with http/https.', 'error');
      return;
    }
    const numPrice = Number(priceInr);
    if (!numPrice || numPrice <= 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        brand: brand.trim() || 'Maison Partner Atelier',
        price: numPrice,
        mrp: Number(mrpInr) || numPrice * 1.15,
        discountPercentage: mrpInr ? Math.round(((Number(mrpInr) - numPrice) / Number(mrpInr)) * 100) : 0,
        stock: Number(stock) || 25,
        description: description.trim() || `Finest curated ${title}. Handled with certified packaging and continuous cold chain.`,
        thumbnail: thumbnail.trim(),
        images: [thumbnail.trim()],
        packagingProtocol: selectedPackaging,
        freshnessWindow,
        storageTemp,
        harvestTimestamp: harvestTime,
        surplusPledge: orphanagePledge
          ? 'Unsold evening harvest surplus donated to partner children’s sanctuary'
          : null
      };

      const res = await createSellerProduct(payload);
      if (res && res.success) {
        addSellerProduct(res.product);
        // Switch to inventory to view the new product
        setActiveTab('inventory');
        loadInventory();
        // Reset form
        setTitle('');
        setDescription('');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to publish product. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-scrim/80 backdrop-blur-md"
        onClick={() => setIsSellerStudioOpen(false)}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-premium relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-hairline bg-canvas text-left shadow-2xl"
      >
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-panel/80 px-6 py-4.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-accent">Maison Artisan Studio</span>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                  Verified Seller Portal
                </span>
              </div>
              <h3 className="title-editorial text-[19px] sm:text-[22px]">
                Product Listing & Fresh Inventory Control
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsSellerStudioOpen(false)}
            className="btn-ghost h-9 w-9 rounded-full p-0 text-quiet hover:text-body"
            aria-label="Close studio"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-panel/40 px-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-all ${
              activeTab === 'create'
                ? 'border-accent text-accent'
                : 'border-transparent text-quiet hover:text-body'
            }`}
          >
            <Plus className="h-4 w-4" />
            List New Product & Harvest Batch
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`ml-6 flex items-center gap-2 border-b-2 py-3 text-[13px] font-medium transition-all ${
              activeTab === 'inventory'
                ? 'border-accent text-accent'
                : 'border-transparent text-quiet hover:text-body'
            }`}
          >
            <Layers className="h-4 w-4" />
            Live Inventory & Quality Tracking
            {inventoryStats.totalProducts > 0 && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">
                {inventoryStats.totalProducts}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="thin-scroll flex-1 overflow-y-auto p-6 sm:p-8">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Preset Quick Loader */}
              <div className="rounded-[16px] border border-hairline bg-panel/50 p-4">
                <p className="eyebrow flex items-center gap-1.5 text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Load High-Trust Presets (Verified Photography)
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESET_IMAGE_TEMPLATES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[11.5px] font-medium text-quiet transition-all hover:border-accent hover:text-body"
                    >
                      <span>{preset.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[14.5px] font-semibold uppercase tracking-wider text-body">
                  1. Product & Sourcing Details
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-quiet">
                      Product Title <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Royal Kashmiri Saffron Strawberries (500g)"
                      className="input mt-1.5 w-full text-[13.5px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet">
                      Category <span className="text-accent">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input mt-1.5 w-full text-[13.5px]"
                    >
                      <option value="fresh-flowers">Fresh Flowers & Botanicals</option>
                      <option value="organic-fruits">Organic Fruits</option>
                      <option value="fresh-fish">Fresh Wild Catch & Seafood</option>
                      <option value="clothes">Luxury Clothes & Couture</option>
                      <option value="fragrances">Artisanal Fragrances</option>
                      <option value="beauty">Skincare & Wellness</option>
                      <option value="furniture">Curated Furniture</option>
                      <option value="groceries">Fine Groceries & Pantry</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet">
                      Estate / Farm / Origin Brand
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Wayanad Rainforest Groves"
                      className="input mt-1.5 w-full text-[13.5px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-quiet">
                    Editorial Description & Tasting / Care Notes
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Hand-harvested at sunrise, certified chemical-free, packaged with bio-insulation."
                    className="input mt-1.5 w-full text-[13px]"
                  />
                </div>
              </div>

              {/* 2. Pricing & Live Inventory */}
              <div className="space-y-4 border-t border-hairline pt-6">
                <h4 className="text-[14.5px] font-semibold uppercase tracking-wider text-body">
                  2. Pricing & Initial Inventory Units
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[12px] font-medium text-quiet">
                      Selling Price (₹ INR) <span className="text-accent">*</span>
                    </label>
                    <input
                      type="number"
                      value={priceInr}
                      onChange={(e) => setPriceInr(e.target.value)}
                      className="input mt-1.5 w-full text-[14px]"
                      required
                    />
                    <p className="mt-1 text-[11px] text-faint">
                      Natively priced in Indian Rupees (INR)
                    </p>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet">
                      MRP / Original Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={mrpInr}
                      onChange={(e) => setMrpInr(e.target.value)}
                      className="input mt-1.5 w-full text-[14px]"
                    />
                    <p className="mt-1 text-[11px] text-success">
                      {mrpInr && Number(mrpInr) > Number(priceInr)
                        ? `Save ${Math.round(((Number(mrpInr) - Number(priceInr)) / Number(mrpInr)) * 100)}%`
                        : 'No discount applied'}
                    </p>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet">
                      Initial Inventory Units <span className="text-accent">*</span>
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="input mt-1.5 w-full text-[14px]"
                      min="1"
                      required
                    />
                    <p className="mt-1 text-[11px] text-faint">Live available stock</p>
                  </div>
                </div>
              </div>

              {/* 3. Freshness Assurance & Packaging Protocol (Core Requirement) */}
              <div className="space-y-4 border-t border-hairline pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14.5px] font-semibold uppercase tracking-wider text-body">
                      3. Freshness Assurance & White-Glove Packaging
                    </h4>
                    <p className="text-[12px] text-quiet">
                      Provides customer transparency on harvest timestamps and certified cold-chain care.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[10.5px] font-semibold text-accent">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Maison Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-[12px] font-medium text-quiet flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      Harvest / Published Timestamp
                    </label>
                    <input
                      type="text"
                      value={harvestTime}
                      onChange={(e) => setHarvestTime(e.target.value)}
                      className="input mt-1.5 w-full text-[12.5px]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      Peak Freshness Window
                    </label>
                    <select
                      value={freshnessWindow}
                      onChange={(e) => setFreshnessWindow(e.target.value)}
                      className="input mt-1.5 w-full text-[12.5px]"
                    >
                      <option value="48-Hour Cold Harvest Window">48-Hour Cold Harvest Window</option>
                      <option value="7 Days Peak Freshness Window">7 Days Peak Freshness Window</option>
                      <option value="12-14 Days Hydrated Bloom">12-14 Days Hydrated Bloom</option>
                      <option value="24 Months Sealed Potency">24 Months Sealed Potency</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-quiet flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-accent" />
                      Cold-Chain Temperature
                    </label>
                    <select
                      value={storageTemp}
                      onChange={(e) => setStorageTemp(e.target.value)}
                      className="input mt-1.5 w-full text-[12.5px]"
                    >
                      <option value="1.4°C Continuous Cold Chain (0–2°C)">1.4°C Continuous Cold Chain (0–2°C)</option>
                      <option value="0-1°C Slurry Iced Cold-Chain">0-1°C Slurry Iced Cold-Chain</option>
                      <option value="4-6°C Cellar Climate Regulated">4-6°C Cellar Climate Regulated</option>
                      <option value="Ambient Climate Controlled (18-22°C)">Ambient Controlled (18-22°C)</option>
                    </select>
                  </div>
                </div>

                {/* Packaging Protocols Checklist */}
                <div>
                  <label className="text-[12px] font-medium text-quiet">
                    Certified Packaging & Handling Safeguards (Select Applied Measures)
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {PACKAGING_PROTOCOLS.map((protocol) => {
                      const isSelected = selectedPackaging.includes(protocol);
                      return (
                        <div
                          key={protocol}
                          onClick={() => togglePackaging(protocol)}
                          className={`flex cursor-pointer items-center justify-between rounded-[12px] border p-3 transition-all ${
                            isSelected
                              ? 'border-accent bg-accent-soft/40 text-body shadow-sm'
                              : 'border-hairline bg-panel text-quiet hover:border-body'
                          }`}
                        >
                          <span className="text-[12.5px] font-medium">{protocol}</span>
                          <CheckCircle
                            className={`h-4 w-4 ${
                              isSelected ? 'text-accent' : 'text-faint opacity-40'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Orphanage Surplus Welfare Pledge */}
                <div className="flex items-center justify-between rounded-[14px] border border-accent/30 bg-accent-soft/30 p-4">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-[13px] font-medium text-body">
                        Zero-Waste Community Welfare Pledge
                      </p>
                      <p className="text-[11.5px] text-quiet">
                        Pledge unsold evening floral arrangements and surplus fresh produce to partner children’s sanctuaries for free.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={orphanagePledge}
                    onChange={(e) => setOrphanagePledge(e.target.checked)}
                    className="h-5 w-5 cursor-pointer accent-accent"
                  />
                </div>
              </div>

              {/* 4. Product Visual Studio */}
              <div className="space-y-4 border-t border-hairline pt-6">
                <h4 className="text-[14.5px] font-semibold uppercase tracking-wider text-body">
                  4. High-Resolution Visual
                </h4>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[12px] font-medium text-quiet">
                      Direct Image URL (Verified Photography) <span className="text-accent">*</span>
                    </label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="input w-full text-[13px]"
                      required
                    />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-hairline bg-panel px-3 py-1.5 text-[11.5px] font-medium text-body hover:border-accent transition-colors">
                        <UploadCloud className="h-3.5 w-3.5 text-accent" />
                        <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image to Cloudinary'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage(true);
                            try {
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const base64 = reader.result as string;
                                const res = await uploadToCloudinary(base64, 'shopcread/products');
                                if (res && res.secure_url) {
                                  setThumbnail(res.secure_url);
                                  showToast('Image uploaded & cached on Cloudinary CDN!', 'success');
                                }
                              };
                              reader.readAsDataURL(file);
                            } catch (err: any) {
                              showToast(`Upload failed: ${err.message}`, 'error');
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                        />
                      </label>
                      {thumbnail.includes('res.cloudinary.com') && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                          <CheckCircle className="h-3 w-3" />
                          Stored on Cloudinary CDN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-quiet">
                      Paste a verified URL or upload any photo directly to Cloudinary storage.
                    </p>
                  </div>

                  {/* Live Preview Card */}
                  <div className="flex flex-col items-center justify-center rounded-[14px] border border-hairline bg-recess p-3">
                    <p className="eyebrow mb-2">Live Card Preview</p>
                    <div className="relative aspect-square w-32 overflow-hidden rounded-[10px] bg-panel shadow-sm">
                      <img
                        src={thumbnail}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1548094967-e25a127d1f6d?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <p className="mt-2 truncate text-center text-[11px] font-medium text-body max-w-[130px]">
                      {title || 'Product Title'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-hairline pt-6">
                <button
                  type="button"
                  onClick={() => setIsSellerStudioOpen(false)}
                  className="btn-outline px-5 py-2.5 text-[12.5px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-solid flex items-center gap-2 px-6 py-2.5 text-[12.5px] font-medium uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Publishing to Catalog...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Publish to Live Inventory
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Live Inventory Tab */
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-[16px] border border-hairline bg-panel p-4">
                  <p className="eyebrow">Catalog Items</p>
                  <p className="title-editorial mt-1 text-[24px] text-body">{inventoryStats.totalProducts}</p>
                  <p className="mt-1 text-[11.5px] text-success">Active & Searchable</p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-panel p-4">
                  <p className="eyebrow">Inventory In Stock</p>
                  <p className="title-editorial mt-1 text-[24px] text-body">{inventoryStats.totalInventoryUnits}</p>
                  <p className="mt-1 text-[11.5px] text-quiet">Total Available Units</p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-panel p-4">
                  <p className="eyebrow">Cold-Chain Status</p>
                  <p className="title-editorial mt-1 text-[24px] text-accent">1.4°C</p>
                  <p className="mt-1 text-[11.5px] text-success">100% Quality Audited</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14.5px] font-semibold uppercase tracking-wider text-body">
                    Active Catalog Listings & Live Stock Control
                  </h4>
                  <button
                    onClick={loadInventory}
                    className="btn-ghost flex items-center gap-1.5 text-[12px] text-quiet"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${inventoryLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {inventoryLoading ? (
                  <div className="py-12 text-center text-quiet">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent" />
                    <p className="mt-2 text-[13px]">Synchronizing live inventory...</p>
                  </div>
                ) : inventoryItems.length === 0 ? (
                  <div className="rounded-[16px] border border-hairline bg-panel/40 py-12 text-center">
                    <Box className="mx-auto h-8 w-8 text-faint" />
                    <p className="mt-2 text-[14px] font-medium text-body">No products listed yet</p>
                    <p className="text-[12px] text-quiet">Switch to the creation tab to publish your first batch.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {inventoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-[14px] border border-hairline bg-panel p-4 transition-all hover:border-body sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-14 w-14 shrink-0 rounded-[10px] object-cover bg-recess"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1548094967-e25a127d1f6d?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="eyebrow text-accent">{item.category}</span>
                              <span className="text-[10.5px] text-faint">({item.sku})</span>
                            </div>
                            <h5 className="truncate text-[14px] font-medium text-body">
                              {item.title}
                            </h5>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-quiet">
                              <span>Origin: {item.brand || 'Maison Partner'}</span>
                              <span>•</span>
                              <span className="text-success">
                                {item.specs?.['Harvested / Published'] || 'Dawn Harvest'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stock Adjuster */}
                        <div className="flex shrink-0 items-center justify-between sm:justify-end gap-4 border-t border-hairline sm:border-t-0 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="numerals text-[15px] font-medium text-body">
                              {formatRupees(item.price * 83.5)}
                            </p>
                            <p className="text-[11px] font-medium text-quiet">
                              Stock: <span className="text-body font-semibold">{item.stock}</span> units
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-recess p-1">
                            <button
                              onClick={() => handleStockUpdate(item.id, item.stock, -5)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-quiet hover:bg-panel hover:text-body"
                              title="Decrease stock by 5"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleStockUpdate(item.id, item.stock, 10)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-accent hover:bg-panel"
                              title="Replenish stock by 10"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleStockUpdate(item.id, item.stock, 50)}
                              className="rounded px-2 py-1 text-[11px] font-semibold text-success hover:bg-panel"
                              title="Replenish batch by 50"
                            >
                              +50
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function roundUsd(inr: number): string {
  return (inr / 83.5).toFixed(2);
}

