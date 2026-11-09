import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  enableGlare?: boolean;
}

export default function Card3D({
  children,
  className = '',
  maxTilt = 8,
  enableGlare = true,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 240, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const glareX = useTransform(smoothX, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(smoothY, [-0.5, 0.5], [20, 80]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
      className={`relative h-full ${className}`}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-full w-full"
      >
        {children}

        {enableGlare && (
          <motion.div
            style={{
              opacity: isHovered ? 0.35 : 0,
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle 180px at ${gx}% ${gy}%, rgba(255, 255, 255, 0.45), transparent 75%)`
              ),
              transform: 'translateZ(40px)',
            }}
            className="pointer-events-none absolute inset-0 z-30 rounded-[16px] transition-opacity duration-300"
          />
        )}
      </motion.div>
    </div>
  );
}

