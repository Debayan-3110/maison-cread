import React, { useMemo } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';

interface CloudinarySampleImageProps {
  publicId?: string;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

/**
 * Official Cloudinary React SDK Component
 * Utilizes @cloudinary/react AdvancedImage and @cloudinary/url-gen
 * with auto-format, auto-quality, and AI-powered autoGravity smart crop.
 */
export const CloudinarySampleImage: React.FC<CloudinarySampleImageProps> = ({
  publicId = 'cld-sample-5',
  width = 500,
  height = 500,
  className = 'rounded-xl object-cover shadow-sm',
  alt = 'Cloudinary Optimized Asset',
}) => {
  const cld = useMemo(() => new Cloudinary({ cloud: { cloudName: 'c40zxlko' } }), []);

  // Use sample image or uploaded asset via Cloudinary URL Gen
  const img = useMemo(() => {
    return cld
      .image(publicId)
      .format('auto') // Optimize delivery by resizing and applying auto-format and auto-quality
      .quality('auto')
      .resize(auto().gravity(autoGravity()).width(width).height(height)); // Transform the image: auto-crop to square aspect_ratio
  }, [cld, publicId, width, height]);

  return (
    <div className="relative inline-block overflow-hidden">
      <AdvancedImage cldImg={img} className={className} alt={alt} />
    </div>
  );
};

export default CloudinarySampleImage;

