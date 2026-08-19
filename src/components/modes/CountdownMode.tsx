import React from 'react';
import { TimerStatus, FlipFont } from '../../types';
import { FlipDisplay } from './FlipDisplay';

interface CountdownModeProps {
  status: TimerStatus;
  timeLeft: number;
  showSeconds?: boolean;
  currentLabelColor?: string;
  currentTimerColor?: string;
  fontFamily?: FlipFont;
}

export const CountdownMode = ({
  status,
  timeLeft,
  showSeconds = true,
  currentLabelColor,
  currentTimerColor,
  fontFamily,
}: CountdownModeProps) => {
  const ceilSeconds = Math.ceil(timeLeft);
  const hours = Math.floor(ceilSeconds / 3600);
  const minutes = Math.floor((ceilSeconds % 3600) / 60);
  const seconds = ceilSeconds % 60;

  const hoursStr = hours > 0 ? hours.toString().padStart(2, '0') : undefined;
  const minutesStr = (hours > 0 ? minutes : Math.floor(ceilSeconds / 60))
    .toString()
    .padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-100 group-hover:translate-y-0 scale-[1.28] translate-y-3 select-none w-full max-w-full px-2">
      {/* Label */}
      <div
        className="font-medium tracking-widest uppercase opacity-70 transition-colors duration-700 whitespace-nowrap text-center"
        style={{ 
          color: currentLabelColor,
          fontSize: 'min(2.6vw, 2.8vh)',
          marginBottom: 'min(1.5vw, 1.8vh)'
        }}
      >
        {status === 'idle' ? 'Ready' : status === 'paused' ? 'Paused' : 'Countdown'}
      </div>

      {/* Flip Clock Display */}
      <FlipDisplay
        hours={hoursStr}
        minutes={minutesStr}
        seconds={showSeconds ? secondsStr : undefined}
        color={currentTimerColor}
        subColor={currentLabelColor}
        fontFamily={fontFamily}
      />
    </div>
  );
};
