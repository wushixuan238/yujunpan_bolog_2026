import React from 'react';

export const OrganicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-saka-stone">
      {/*
        Clean white background
      */}
      <div
        className="absolute inset-0 bg-white"
      />
    </div>
  );
};