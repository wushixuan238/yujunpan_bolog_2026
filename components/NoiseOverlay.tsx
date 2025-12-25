import React from 'react';

export const NoiseOverlay: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none overflow-hidden">
      {/* 
         Original V1 Noise Settings:
         - Opacity: 0.15 (The "Golden Standard" for web grain - visible but not distracting)
         - baseFrequency: 0.65 (Soft, organic grain size, not too sharp)
         - Removed: feColorMatrix (No more high contrast/heavy grit)
      */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay">
        <svg className="h-full w-full">
          <filter id="noiseFilter">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.65" 
              numOctaves="3" 
              stitchTiles="stitch" 
            />
            {/* Contrast boost removed to restore softness */}
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
    </div>
  );
};