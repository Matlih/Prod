import React, { useState, useEffect, useRef } from 'react';
import { FlipFont } from '../../types';

interface FlipDigitProps {
  digit: string;
  fontSize: string;
  color?: string;
  fontFamily?: FlipFont;
}

export const FlipDigit = ({ digit, fontSize, color, fontFamily = 'bodoni' }: FlipDigitProps) => {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const fontClass =
    fontFamily === 'jakarta'
      ? 'font-flip-jakarta'
      : fontFamily === 'mono'
      ? 'font-flip-mono'
      : fontFamily === 'digital'
      ? 'font-flip-digital'
      : 'font-flip-bodoni';

  useEffect(() => {
    if (digit !== currentDigit) {
      setPrevDigit(currentDigit);
      setCurrentDigit(digit);
      setIsFlipping(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsFlipping(false);
        setPrevDigit(digit);
      }, 430);
    }
  }, [digit, currentDigit]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${fontClass} font-bold leading-none select-none shrink-0`}
      style={{
        perspective: '1000px',
        fontSize,
      }}
    >
      {/* Invisible placeholder for natural layout dimensions */}
      <span className="invisible opacity-0 px-[0.03em] pointer-events-none tabular-nums font-bold" style={{ lineHeight: 1 }}>
        {digit}
      </span>

      {/* 1. Static Top: shows currentDigit top half */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center pointer-events-none"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <span
          className="font-bold tracking-tight tabular-nums transition-colors duration-700 drop-shadow-sm px-[0.03em]"
          style={{ color, lineHeight: 1 }}
        >
          {currentDigit}
        </span>
      </div>

      {/* 2. Static Bottom: emptied during flip to eliminate double-exposure stutter */}
      {!isFlipping && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center pointer-events-none"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span
            className="font-bold tracking-tight tabular-nums transition-colors duration-700 drop-shadow-sm px-[0.03em]"
            style={{
              color,
              lineHeight: 1,
              transform: 'translateY(-50%)',
            }}
          >
            {currentDigit}
          </span>
        </div>
      )}

      {/* 3. Top Flap: notebook flip down showing prevDigit top half */}
      {isFlipping && (
        <div
          className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center z-20"
          style={{
            transformOrigin: '50% 100%',
            animation: 'prodFlipTop 220ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
            backfaceVisibility: 'hidden',
          }}
        >
          <span
            className="font-bold tracking-tight tabular-nums drop-shadow-sm px-[0.03em]"
            style={{ color, lineHeight: 1 }}
          >
            {prevDigit}
          </span>
        </div>
      )}

      {/* 4. Bottom Flap: notebook flip down revealing currentDigit bottom half */}
      {isFlipping && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center z-20"
          style={{
            transformOrigin: '50% 0%',
            animation: 'prodFlipBottom 220ms cubic-bezier(0, 0, 0.2, 1) 200ms forwards',
            transform: 'rotateX(90deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          <span
            className="font-bold tracking-tight tabular-nums drop-shadow-sm px-[0.03em]"
            style={{
              color,
              lineHeight: 1,
              transform: 'translateY(-50%)',
            }}
          >
            {currentDigit}
          </span>
        </div>
      )}

      {/* Center Split Slit Line */}
      <div className="absolute top-1/2 left-0 right-0 h-[max(2px,0.35vh)] -translate-y-1/2 bg-neutral-50 dark:bg-neutral-900 pointer-events-none z-30 transition-colors duration-700" />
    </div>
  );
};
