import React from 'react';

export const OrganicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-saka-stone">
      {/* 
        Restored V1 Gradient:
        - from-saka-stone (Top Left)
        - via-neutral (Middle bridge to smooth the transition)
        - to-saka-deep-red (Bottom Right)
        This creates that natural "dip" into color without looking harsh.
      */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#B8B6B0] via-[#9E8E8E] to-[#5C2E2C] opacity-90"
      />

      {/* 
        Restored V1 Atmospheric Blobs:
        Soft, large, and barely there. Just enough to break the perfect linearity.
      */}
      
      {/* Light Source (Top Left) */}
      <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#EBE9E4] opacity-20 blur-[120px] mix-blend-screen animate-float" />
      
      {/* Deep Shadow (Bottom Right) */}
      <div className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#3D1E1D] opacity-40 blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
};