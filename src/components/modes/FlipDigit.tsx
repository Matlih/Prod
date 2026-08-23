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
      : fontFamily === 'bebas'
      ? 'font-flip-bebas'
      : fontFamily === 'cinzel'
      ? 'font-flip-cinzel'
      : 'font-flip-serif';

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

      {/* 1. Static Top: shows currentDigit (new) top half */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center pointer-events-none z-0 bg-neutral-50 dark:bg-neutral-900 transition-colors duration-700"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <span
          className="font-bold tracking-tight tabular-nums transition-colors duration-700 drop-shadow-sm px-[0.03em]"
          style={{ color, lineHeight: 1 }}
        >
          {currentDigit}
        </span>
      </div>

      {/* 2. Static Bottom: shows prevDigit while flipping (stays undisturbed until covered), currentDigit when idle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden flex items-start justify-center pointer-events-none z-0 bg-neutral-50 dark:bg-neutral-900 transition-colors duration-700"
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
          {isFlipping ? prevDigit : currentDigit}
        </span>
      </div>

      {/* 3. The 3D Rotating Leaf (Unified Double-Sided Card) */}
      {isFlipping && (
        <div
          className="absolute top-0 left-0 right-0 h-1/2 z-20 pointer-events-none"
          style={{
            transformOrigin: '50% 100%',
            transformStyle: 'preserve-3d',
            animation: 'prodFlipLeaf 420ms cubic-bezier(0.37, 0, 0.63, 1) forwards',
          }}
        >
          {/* Front Face: Upper half of old digit (folds down 0deg -> -90deg) */}
          <div
            className="absolute inset-0 overflow-hidden flex items-start justify-center bg-neutral-50 dark:bg-neutral-900 transition-colors duration-700"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span
              className="font-bold tracking-tight tabular-nums drop-shadow-sm px-[0.03em]"
              style={{ color, lineHeight: 1 }}
            >
              {prevDigit}
            </span>
            <div
              className="absolute inset-0 bg-black/40 pointer-events-none"
              style={{
                animation: 'prodFlipFrontShadow 420ms cubic-bezier(0.37, 0, 0.63, 1) forwards',
              }}
            />
          </div>

          {/* Back Face: Lower half of new incoming digit (swings down -90deg -> -180deg to cover old bottom) */}
          <div
            className="absolute inset-0 overflow-hidden flex items-start justify-center bg-neutral-50 dark:bg-neutral-900 transition-colors duration-700"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
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
            <div
              className="absolute inset-0 bg-black/40 pointer-events-none"
              style={{
                animation: 'prodFlipBackShadow 420ms cubic-bezier(0.37, 0, 0.63, 1) forwards',
              }}
            />
          </div>
        </div>
      )}

      {/* Center Split Slit Line */}
      <div className="absolute top-1/2 left-0 right-0 h-[max(2px,0.32vh)] -translate-y-1/2 bg-neutral-50 dark:bg-neutral-900 pointer-events-none z-30 transition-colors duration-700" />
    </div>
  );
};
