import React from 'react';
import { TimerPhase } from '../types';

interface TimerDisplayProps {
  phase: TimerPhase;
  timeLeft: number;
  currentLabelColor?: string;
  currentTimerColor?: string;
}

export const TimerDisplay = ({ phase, timeLeft, currentLabelColor, currentTimerColor }: TimerDisplayProps) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        className="text-[4vmin] md:text-sm font-medium tracking-widest uppercase mb-[2vmin] md:mb-4 opacity-70 transition-colors duration-700"
        style={{ color: currentLabelColor }}
      >
        {phase === 'idle' ? 'Ready' : phase === 'paused' ? 'Paused' : phase === 'work' ? 'Deep Work' : 'Rest'}
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
