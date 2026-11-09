import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

// Cloudinary client instance configured with user's cloud name or environment variable
export const CLOUDINARY_CLOUD_NAME = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME)
  ? String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME).trim()
  : 'c40zxlko';

export const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true,
  },
});

/**
 * Creates an optimized CloudinaryImage with auto-format, auto-quality,
 * and smart content-aware auto-gravity cropping.
 */
export function buildOptimizedCloudinaryImage(
  publicId: string = 'cld-sample-5',
  width: number = 500,
  height: number = 500
) {
  return cld
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));
}

