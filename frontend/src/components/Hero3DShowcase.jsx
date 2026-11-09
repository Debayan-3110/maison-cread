import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Sparkles, Rotate3d, Layers, Maximize2 } from 'lucide-react';
import { getSafeImageUrl, handleImageError } from '../utils/imageFallback';

/**
 * Hero3DShowcase
 * ==============
 * High-performance, physics-driven 3D luxury product showcase plate.
 * Features:
 * - Real-time perspective 3D card tilt with spring dampening
 * - Multi-layered Z-depth parallax (ambient grid, floating product, dynamic specular glare)
 * - Intelligent studio edge blending & radial vignette to eliminate harsh rectangular image edges
 * - Interactive 3D Orbit / Angle inspector
 * - Lightweight 3D floating ambient particle field (GPU canvas)
 */
export default function Hero3DShowcase({ product, onQuickView }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isOrbitMode, setIsOrbitMode] = useState(false);
  const [manualRotate, setManualRotate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Multi-image support
  const images = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return [product.thumbnail];
  }, [product]);

  const currentImage = images[selectedImageIndex] || product?.thumbnail;

  // Spring physics for mouse tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 220, mass: 0.6 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D rotations based on normalized mouse coords [-0.5, 0.5]
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-18, 18]);

  // Parallax shifts for depth layers
  const productTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [-12, 12]);
  const productTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [-10, 10]);
  const bgTranslateX = useTransform(smoothMouseX, [-0.5, 0.5], [14, -14]);
  const bgTranslateY = useTransform(smoothMouseY, [-0.5, 0.5], [14, -14]);

  // Specular glare position (percentage across surface)
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], [15, 85]);
  const glareOpacity = useTransform(smoothMouseX, [-0.5, 0, 0.5], [0.45, 0.15, 0.45]);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY, isDragging]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isOrbitMode) {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  // Drag orbit handlers
  const handleMouseDown = (e) => {
    if (!isOrbitMode) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, rx: manualRotate.x, ry: manualRotate.y };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setManualRotate({
        x: Math.max(-35, Math.min(35, dragStartRef.current.rx - dy * 0.4)),
        y: Math.max(-45, Math.min(45, dragStartRef.current.ry + dx * 0.4)),
      });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // 3D Ambient Particle Starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 32 }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * 400 + 50,
      size: Math.random() * 1.8 + 0.6,
      baseAlpha: Math.random() * 0.4 + 0.15,
      speedZ: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const fov = 250;
      const cx = width / 2;
      const cy = height / 2;

      for (let p of particles) {
        p.z -= p.speedZ;
        if (p.z <= 10) {
          p.z = 450;
          p.x = (Math.random() - 0.5) * width;
          p.y = (Math.random() - 0.5) * height;
        }

        const scale = fov / (fov + p.z);
        const sx = cx + p.x * scale;
        const sy = cy + p.y * scale;
        const radius = Math.max(0.6, p.size * scale);
        const alpha = Math.min(0.65, p.baseAlpha * scale * 1.8);

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 129, 63, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      style={{ perspective: '1200px' }}
      className={`relative aspect-[4/5] w-full select-none rounded-[20px] transition-all duration-700 ${
        isOrbitMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* 3D Motion Stage */}
      <motion.div
        style={{
          rotateX: isOrbitMode ? manualRotate.x : rotateX,
          rotateY: isOrbitMode ? manualRotate.y : rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.025 : 1,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="relative h-full w-full rounded-[20px] border border-hairline/80 bg-gradient-to-b from-panel via-canvas to-recess/80 p-5 shadow-lift backdrop-blur-md phone-lg:p-8 sm:p-9"
      >
        {/* Layer 1: 3D Ambient Particle Starfield (Z: -30px) */}
        <canvas
          ref={canvasRef}
          style={{ transform: 'translateZ(-30px)' }}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60 mix-blend-screen"
        />

        {/* Layer 2: 3D Isometric Holographic Floor Grid (Z: -20px) */}
        <motion.div
          style={{
            x: bgTranslateX,
            y: bgTranslateY,
            transform: 'translateZ(-20px)',
          }}
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] opacity-40"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-accent)_0%,transparent_70%)] opacity-20 blur-xl" />
          <svg className="h-full w-full stroke-body/10 [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_75%)]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-3d-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-3d-grid)" />
          </svg>
        </motion.div>

        {/* Floating Top 3D Holographic Badges (Z: +80px) */}
        <div
          style={{ transform: 'translateZ(80px)' }}
          className="pointer-events-none absolute inset-x-5 top-5 z-20 flex items-center justify-between phone-lg:inset-x-7 phone-lg:top-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-panel/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3 animate-pulse text-accent" />
            3D Studio Edition
          </span>

          <span className="rounded-full border border-hairline/60 bg-panel/80 px-2.5 py-1 text-[9.5px] uppercase tracking-[0.14em] text-quiet backdrop-blur">
            Lot #{product?.id ? String(product.id).padStart(3, '0') : '045'}
          </span>
        </div>

        {/* Layer 3: 3D Floating Product Stage with Studio Lighting (Z: +55px) */}
        <motion.div
          style={{
            x: productTranslateX,
            y: productTranslateY,
            transform: 'translateZ(55px)',
          }}
          className="relative flex h-full w-full flex-col items-center justify-center pt-4"
        >
          {/* Circular 3D Floating Shadow on the floor */}
          <motion.div
            animate={{
              scale: isHovered ? [1, 1.08, 1] : 1,
              opacity: isHovered ? 0.35 : 0.22,
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="pointer-events-none absolute bottom-8 h-12 w-3/4 rounded-[100%] bg-onyx blur-2xl dark:bg-black/80"
          />

          {/* 3D Elevated Halo Glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
          </div>

          {/* The Hero Product Image with Soft Studio Blend & Edge Falloff */}
          <button
            onClick={() => onQuickView && onQuickView(product)}
            className="group relative flex h-full w-full items-center justify-center focus:outline-none"
            aria-label={`Inspect ${product?.title}`}
          >
            <div className="relative flex h-[85%] w-[94%] items-center justify-center overflow-hidden rounded-[16px] shadow-sm">
              <motion.img
                key={currentImage}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                src={getSafeImageUrl(currentImage, product?.category)}
                alt={product?.title || 'Featured 3D Product'}
                onError={(e) => handleImageError(e, product?.category)}
                className="h-full w-full object-cover object-center filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.22)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            </div>
          </button>
        </motion.div>

        {/* Multi-angle Gallery Thumbnail Strip (if multiple images exist) */}
        {images.length > 1 && (
          <div
            style={{ transform: 'translateZ(90px)' }}
            className="absolute bottom-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-hairline/80 bg-panel/90 p-1 shadow-quiet backdrop-blur"
          >
            {images.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(idx);
                }}
                className={`h-7 w-7 overflow-hidden rounded-full border transition-all ${
                  selectedImageIndex === idx
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={`Angle ${idx + 1}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Bottom Actions Bar (Z: +85px) */}
        <div
          style={{ transform: 'translateZ(85px)' }}
          className="absolute inset-x-5 bottom-4 z-20 flex items-center justify-between phone-lg:inset-x-7 phone-lg:bottom-5"
        >
          <button
            onClick={() => onQuickView && onQuickView(product)}
            className="group/btn flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-quiet transition-colors hover:text-body"
          >
            <span>View the piece</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" strokeWidth={1.5} />
          </button>

          {/* 3D Orbit Drag Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOrbitMode((prev) => !prev);
              if (isOrbitMode) {
                setManualRotate({ x: 0, y: 0 });
                mouseX.set(0);
                mouseY.set(0);
              }
            }}
            title={isOrbitMode ? 'Reset to Mouse Track' : 'Enable 3D Drag Orbit'}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-all ${
              isOrbitMode
                ? 'border-accent bg-accent text-on-solid shadow-sm'
                : 'border-hairline bg-panel/80 text-quiet hover:border-body hover:text-body'
            }`}
          >
            <Rotate3d className={`h-3 w-3 ${isOrbitMode ? 'animate-spin' : ''}`} />
            <span>{isOrbitMode ? 'Orbit Active' : '3D Orbit'}</span>
          </button>
        </div>

        {/* Layer 4: Dynamic Specular Lighting Glare (Z: +110px) */}
        <motion.div
          style={{
            transform: 'translateZ(110px)',
            opacity: isHovered ? glareOpacity : 0,
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle 280px at ${gx}% ${gy}%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.08) 50%, transparent 80%)`
            ),
          }}
          className="pointer-events-none absolute inset-0 z-40 rounded-[20px] transition-opacity duration-300"
        />

        {/* Subtle Chamfer Highlight Rim */}
        <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/15 dark:ring-white/10" />
      </motion.div>
    </div>
  );
}

