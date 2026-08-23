import React, { useState, useEffect } from 'react';
import { FlipDisplay } from './FlipDisplay';
import { FlipFont } from '../../types';

interface ClockModeProps {
  showSeconds?: boolean;
  clockIs24Hour?: boolean;
  clockTimeZone?: string;
  currentLabelColor?: string;
  currentTimerColor?: string;
  fontFamily?: FlipFont;
}

export const ClockMode = ({
  showSeconds = false,
  clockIs24Hour = false,
  clockTimeZone,
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

  // Format time according to timeZone & hour format
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: clockTimeZone || undefined,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: !clockIs24Hour,
    hourCycle: clockIs24Hour ? 'h23' : 'h12',
  });

  const parts = timeFormatter.formatToParts(time);
  const hourPart = parts.find(p => p.type === 'hour')?.value || '00';
  const minPart = parts.find(p => p.type === 'minute')?.value || '00';
  const secPart = parts.find(p => p.type === 'second')?.value || '00';
  const dayPeriodPart = parts.find(p => p.type === 'dayPeriod')?.value;

  const hoursStr = hourPart.padStart(2, '0');
  const minutesStr = minPart.padStart(2, '0');
  const secondsStr = secPart.padStart(2, '0');
  const ampm = clockIs24Hour ? undefined : (dayPeriodPart ? dayPeriodPart.toUpperCase() : undefined);

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: clockTimeZone || undefined,
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
