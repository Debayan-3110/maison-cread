import React, { useState } from 'react';
import { useShop } from '../context/ShopContext.tsx';
import { formatINR } from '../utils/commerce';
import { X, Star, Heart, Minus, Plus, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

const sizes = ['Standard', 'Extended', 'Gift wrapped'];

function ModalContent({ product, setQuickViewProduct }) {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    allProducts,
    setIsCartOpen,
    setIsCheckoutOpen,
  } = useShop();

  const isWishlisted = isInWishlist(product.id);
  const originalPrice = product.price / (1 - product.discountPercentage / 100);
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];

  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedImage, selectedSize);
    setQuickViewProduct(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="backdrop-in fixed inset-0 bg-scrim backdrop-blur-[3px]" onClick={() => setQuickViewProduct(null)} />

      <div className="card-premium modal-in relative z-10 my-8 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden">
        <button
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close quick view"
          className="btn-ghost absolute right-4 top-4 z-20 h-9 w-9 rounded-full bg-panel/80 p-0 backdrop-blur"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>

        <div className="thin-scroll overflow-y-auto">
          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-2 md:gap-12">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="frame-still relative flex h-72 items-center justify-center p-6 sm:h-96">
                <div className="texture-lines absolute inset-0 opacity-50" />
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="relative max-h-full max-w-full object-contain transition-opacity duration-500"
                />
                {product.discountPercentage > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                    {Math.round(product.discountPercentage)}% less
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="scrollbar-none flex items-center gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      aria-label={`View image ${idx + 1}`}
                      className={`frame-still h-16 w-16 shrink-0 p-1 transition-all duration-300 ${
                        selectedImage === img ? 'border-body/50' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-accent" />
                <p className="eyebrow capitalize">{product.brand || product.category}</p>
              </div>

              <h2 className="title-editorial mt-4 text-[30px] sm:text-[34px]">{product.title}</h2>

              <div className="mt-4 flex items-center gap-4 text-[12px] text-quiet">
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  {product.rating} rating
                </span>
                <span className="h-3 w-px bg-hairline" />
                <span className="capitalize">{product.category}</span>
              </div>

              <p className="mt-6 text-[13.5px] leading-[1.8] text-quiet">{product.description}</p>

              <div className="mt-7 flex items-end gap-4">
                <span className="numerals font-display text-[34px] leading-none text-body">{formatINR(product.price)}</span>
                {product.discountPercentage > 0 && (
                  <span className="numerals pb-1 text-[13px] text-faint line-through">{formatINR(originalPrice)}</span>
                )}
              </div>

              {/* Presentation */}
              <div className="mt-8">
                <p className="eyebrow">Presentation</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={selectedSize === size ? 'chip-active' : 'chip'}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-7 flex items-center gap-5">
                <p className="eyebrow">Quantity</p>
                <div className="flex items-center rounded-full border border-hairline">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="p-2.5 text-quiet transition-colors hover:text-body"
                  >
                    <Minus className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                  <span className="numerals w-8 text-center text-[13px] text-body">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="p-2.5 text-quiet transition-colors hover:text-body"
                  >
                    <Plus className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => addToCart(product, quantity, selectedImage, selectedSize)} className="btn-solid flex-1 uppercase tracking-[0.14em]">
                  Add to bag
                </button>
                <button onClick={handleBuyNow} className="btn-line flex-1 uppercase tracking-[0.14em]">
                  Buy now
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <button
                onClick={() => toggleWishlist(product)}
                className="mt-4 inline-flex items-center justify-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-quiet transition-colors hover:text-body"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-accent text-accent' : ''}`} strokeWidth={1.5} />
                {isWishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>

              <ul className="mt-8 space-y-3 border-t border-hairline pt-5 text-[12px] text-quiet">
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.5} /> Authenticated in-house before dispatch
                </li>
                <li className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-accent" strokeWidth={1.5} /> Insured delivery, signature on arrival
                </li>
                <li className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-accent" strokeWidth={1.5} /> Thirty-day returns, no questions asked
                </li>
              </ul>
            </div>
          </div>

          {/* Related */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-hairline p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <p className="eyebrow">You may also consider</p>
                <ArrowRight className="h-4 w-4 text-faint" strokeWidth={1.5} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {relatedProducts.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => setQuickViewProduct(rel)}
                    className="group text-left"
                  >
                    <div className="frame-still flex h-24 items-center justify-center p-2">
                      <img
                        src={rel.thumbnail}
                        alt={rel.title}
                        className="max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2.5 truncate text-[12.5px] text-body">{rel.title}</p>
                    <p className="numerals mt-0.5 text-[12px] text-quiet">{formatINR(rel.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductModal() {
  const { quickViewProduct, setQuickViewProduct } = useShop();

  if (!quickViewProduct) return null;

  return <ModalContent key={quickViewProduct.id} product={quickViewProduct} setQuickViewProduct={setQuickViewProduct} />;
}