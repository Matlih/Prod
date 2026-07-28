import React from 'react';

export const OutlineAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute inset-4 md:inset-8 pointer-events-none">
    <svg width="100%" height="100%" className="overflow-visible">
      <rect 
        x="0" y="0" width="100%" height="100%" rx="32" 
        fill="none" stroke="currentColor" strokeWidth="2" 
        className="opacity-10" 
      />
      <rect 
        x="0" y="0" width="100%" height="100%" rx="32" 
        fill="none" stroke="currentColor" strokeWidth="2" 
        pathLength="100"
        strokeDasharray="100" 
        strokeDashoffset={100 * (1 - progress)} 
        className="transition-all duration-1000 ease-linear opacity-50" 
      />
    </svg>
  </div>
);

export const LineAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all duration-1000 ease-linear pointer-events-none" style={{ width: `${progress * 100}%` }} />
);

export const WaterAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute bottom-0 left-0 w-full bg-current opacity-10 transition-all duration-1000 ease-linear pointer-events-none" style={{ height: `${progress * 100}%` }} />
);

export const PulseAnimation = ({ progress }: { progress: number }) => {
  const duration = 1 + (progress * 3);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div 
        className="w-[60vmin] h-[60vmin] rounded-full bg-current opacity-10 blur-[60px] animate-pulse"
        style={{
          animationDuration: `${duration}s`,
          transform: `scale(${0.7 + (progress * 0.5)})`
        }}
      />
    </div>
  );
};
