import React from 'react';

export const OrganicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-saka-stone">
      {/*
        Unified stone color background with subtle texture
      */}
      <div
        className="absolute inset-0 bg-[#B8B6B0]"
      />

      {/*
        Subtle atmospheric blobs for texture
      */}

      {/* Light variation */}
      <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#EBE9E4] opacity-15 blur-[120px] mix-blend-screen animate-float" />

      {/* Shadow variation */}
      <div className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#9E8E8E] opacity-20 blur-[120px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
};