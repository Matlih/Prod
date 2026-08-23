import React from 'react';
import { FlipDigit } from './FlipDigit';
import { FlipFont } from '../../types';

interface FlipDisplayProps {
  hours?: string;
  minutes: string;
  seconds?: string;
  ampm?: string;
  color?: string;
  subColor?: string;
  fontFamily?: FlipFont;
}

export const FlipDisplay = ({
  hours,
  minutes,
  seconds,
  ampm,
  color,
  subColor,
  fontFamily = 'bodoni',
}: FlipDisplayProps) => {
  const hasHours = hours !== undefined;
  const hasSeconds = seconds !== undefined;
  const unitCount = (hasHours ? 1 : 0) + 1 + (hasSeconds ? 1 : 0);

  const isWideFont = fontFamily === 'digital' || fontFamily === 'mono';
  const isTallFont = fontFamily === 'bebas';
  const isMediumFont = fontFamily === 'jakarta' || fontFamily === 'cinzel';

  // Proportional dual-axis scaling tailored to glyph aspect ratios
  const computedFontSize = isTallFont
    ? unitCount >= 3
      ? 'min(15vw, 45vh)'
      : unitCount === 2
      ? 'min(23vw, 52vh)'
      : 'min(40vw, 60vh)'
    : isWideFont
    ? unitCount >= 3
      ? 'min(9.6vw, 34vh)'
      : unitCount === 2
      ? 'min(17.5vw, 46vh)'
      : 'min(30vw, 52vh)'
    : isMediumFont
    ? unitCount >= 3
      ? 'min(11.5vw, 38vh)'
      : unitCount === 2
      ? 'min(20vw, 48vh)'
      : 'min(35vw, 56vh)'
    : unitCount >= 3
    ? 'min(13.5vw, 42vh)'
    : unitCount === 2
    ? 'min(18.5vw, 44vh)'
    : 'min(36vw, 55vh)';

  const computedGap = isTallFont
    ? unitCount >= 3
      ? 'min(2.5vw, 3.5vh)'
      : 'min(4vw, 5vh)'
    : isWideFont
    ? unitCount >= 3
      ? 'min(1.8vw, 2.5vh)'
      : 'min(3.5vw, 4vh)'
    : isMediumFont
    ? unitCount >= 3
      ? 'min(2.5vw, 3.2vh)'
      : 'min(4vw, 4.8vh)'
    : unitCount >= 3
    ? 'min(3.5vw, 4.5vh)'
    : 'min(4vw, 5vh)';

  const renderDigitGroup = (val: string, groupKey: string) => {
    const chars = val.split('');
    return (
      <div key={groupKey} className="inline-flex items-center justify-center gap-[0.04em] shrink-0">
        {chars.map((char, index) => (
          <FlipDigit
            key={`${groupKey}-${index}`}
            digit={char}
            fontSize={computedFontSize}
            color={color}
            fontFamily={fontFamily}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes prodFlipLeaf {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-180deg);
          }
        }
        @keyframes prodFlipFrontShadow {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.4;
          }
        }
        @keyframes prodFlipBackShadow {
          0% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      <div 
        className="flex items-center justify-center flex-nowrap whitespace-nowrap select-none max-w-full"
        style={{ gap: computedGap }}
      >
        {ampm && (
          <span
            className="font-medium uppercase tracking-wider self-center opacity-70 transition-colors duration-700 mr-[0.5vw]"
            style={{ 
              color: subColor || color,
              fontSize: 'min(2.5vw, 4vh)'
            }}
          >
            {ampm}
          </span>
        )}

        {hours !== undefined && renderDigitGroup(hours, 'hours')}
        {renderDigitGroup(minutes, 'minutes')}
        {seconds !== undefined && renderDigitGroup(seconds, 'seconds')}
      </div>
    </>
  );
};
