import React, { useState, useEffect } from 'react';
import { FlipDisplay } from './FlipDisplay';
import { FlipFont } from '../../types';

interface ClockModeProps {
  showSeconds?: boolean;
  clockIs24Hour?: boolean;
  currentLabelColor?: string;
  currentTimerColor?: string;
  fontFamily?: FlipFont;
}

export const ClockMode = ({
  showSeconds = false,
  clockIs24Hour = false,
  currentLabelColor,
  currentTimerColor,
  fontFamily,
}: ClockModeProps) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const hoursRaw = time.getHours();
  const hoursStr = clockIs24Hour
    ? hoursRaw.toString().padStart(2, '0')
    : (hoursRaw % 12 || 12).toString().padStart(2, '0');
  const minutesStr = time.getMinutes().toString().padStart(2, '0');
  const secondsStr = time.getSeconds().toString().padStart(2, '0');
  const ampm = clockIs24Hour ? undefined : (hoursRaw >= 12 ? 'PM' : 'AM');

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const formattedDate = time.toLocaleDateString(undefined, dateOptions);

  return (
    <div className="flex flex-col items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-100 group-hover:translate-y-0 scale-[1.28] translate-y-3 select-none w-full max-w-full px-2">
      {/* Date Header */}
      <div
        className="font-medium tracking-widest uppercase opacity-70 transition-colors duration-700 whitespace-nowrap text-center"
        style={{ 
          color: currentLabelColor,
          fontSize: 'min(2.6vw, 2.8vh)',
          marginBottom: 'min(1.5vw, 1.8vh)'
        }}
      >
        {formattedDate}
      </div>

      {/* Split Flap Clock Numbers */}
      <FlipDisplay
        hours={hoursStr}
        minutes={minutesStr}
        seconds={showSeconds ? secondsStr : undefined}
        ampm={ampm}
        color={currentTimerColor}
        subColor={currentLabelColor}
        fontFamily={fontFamily}
      />
    </div>
  );
};
