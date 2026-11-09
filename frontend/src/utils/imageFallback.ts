/**
 * Image Fallback Utility
 * Provides robust fallbacks for product images across the shop.
 */

export const CATEGORY_FALLBACKS: Record<string, string> = {
  clothes: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  'womens-clothing': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  'mens-clothing': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  furniture: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
  shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
  jewelry: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
  jewelery: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
  fragrances: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
  'organic-fruits': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
  'fresh-flowers': 'https://images.unsplash.com/photo-1548094967-e25a127d1f6d?w=800&auto=format&fit=crop&q=80',
  'fresh-fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80',
  miscellaneous: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
};

export function getProductFallbackImage(category?: string): string {
  if (!category) return CATEGORY_FALLBACKS.default;
  const key = category.toLowerCase().trim();
  return CATEGORY_FALLBACKS[key] || CATEGORY_FALLBACKS.default;
}

export function getSafeImageUrl(url: unknown, category?: string): string {
  if (typeof url !== 'string' || !url.trim().startsWith('http')) {
    return getProductFallbackImage(category);
  }
  const lower = url.toLowerCase();
  // Filter out known placeholder services or broken formats
  if (
    lower.includes('placehold.co') ||
    lower.includes('placeimg.com') ||
    lower.includes('example.com') ||
    lower.includes('via.placeholder')
  ) {
    return getProductFallbackImage(category);
  }
  return url;
}

export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  const fallback = getProductFallbackImage(category);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

export const CLOUDINARY_CLOUD_NAME = 'c40zxlko';

/**
 * Transforms any image URL into a Cloudinary edge-cached CDN URL with auto WebP/AVIF format and perceptual compression.
 */
export function getCloudinaryOptimizedImageUrl(url: unknown, width: number = 800, category?: string): string {
  const safe = getSafeImageUrl(url, category);
  if (!safe || !safe.startsWith('http')) return safe || getProductFallbackImage(category);
  if (safe.includes('res.cloudinary.com')) return safe;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/c_limit,f_auto,q_auto,w_${width}/${encodeURI(safe)}`;
}


