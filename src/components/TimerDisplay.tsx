import React from 'react';
import { TimerPhase, TimerStatus } from '../types';

interface TimerDisplayProps {
  phase: TimerPhase;
  status: TimerStatus;
  timeLeft: number;
  currentLabelColor?: string;
  currentTimerColor?: string;
}

export const TimerDisplay = ({ phase, status, timeLeft, currentLabelColor, currentTimerColor }: TimerDisplayProps) => {
  const formatTime = (seconds: number) => {
    const ceilSeconds = Math.ceil(seconds);
    const m = Math.floor(ceilSeconds / 60);
    const s = ceilSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        className="text-[4vmin] md:text-sm font-medium tracking-widest uppercase mb-[2vmin] md:mb-4 opacity-70 transition-colors duration-700"
        style={{ color: currentLabelColor }}
      >
        {status === 'idle' ? 'Ready' : status === 'paused' ? 'Paused' : phase === 'work' ? 'Deep Work' : 'Rest'}
      </div>
      
      <div 
        className="text-[25vmin] font-light tracking-tighter tabular-nums transition-colors duration-700 drop-shadow-sm leading-none"
        style={{ color: currentTimerColor }}
      >
        {formatTime(timeLeft)}
      </div>
    </>
  );
};
