import React from 'react';
import { TimerStatus } from '../../types';

export const OutlineAnimation = ({ progress, status }: { progress: number, status: TimerStatus }) => (
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
        className="opacity-50" 
        style={{
          transitionProperty: 'stroke-dashoffset',
          transitionDuration: status === 'idle' ? '1000ms' : '100ms',
          transitionTimingFunction: 'linear'
        }}
      />
    </svg>
  </div>
);

export const LineAnimation = ({ progress, status }: { progress: number, status: TimerStatus }) => (
  <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 pointer-events-none" 
       style={{ 
         width: `${progress * 100}%`,
         transitionProperty: 'width',
         transitionDuration: status === 'idle' ? '1000ms' : '100ms',
         transitionTimingFunction: 'linear'
       }} 
  />
);

export const WaterAnimation = ({ progress, status }: { progress: number, status: TimerStatus }) => (
  <div className="absolute bottom-0 left-0 w-full bg-current opacity-10 pointer-events-none" 
       style={{ 
         height: `${progress * 100}%`,
         transitionProperty: 'height',
         transitionDuration: status === 'idle' ? '1000ms' : '100ms',
         transitionTimingFunction: 'linear'
       }} 
  />
);

export const PulseAnimation = ({ progress, status }: { progress: number, status: TimerStatus }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div 
        className="w-[60vmin] h-[60vmin] rounded-full bg-current opacity-10 blur-[60px] animate-pulse"
        style={{
          animationDuration: '3s',
          transform: `scale(${0.7 + (progress * 0.5)})`,
          transitionProperty: 'transform',
          transitionDuration: status === 'idle' ? '1000ms' : '100ms',
          transitionTimingFunction: 'linear'
        }}
      />
    </div>
  );
};
