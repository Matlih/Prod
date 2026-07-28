import React, { useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { useTimer } from './hooks/useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { ControlsDock } from './components/ControlsDock';
import { SettingsModal } from './components/SettingsModal';
import { OutlineAnimation, LineAnimation, WaterAnimation, PulseAnimation } from './components/animations/Animations';
import { X } from 'lucide-react';

export default function App() {
  const { settings, setSettings } = useSettings();
  const { phase, timeLeft, toggleTimer, resetTimer } = useTimer(settings);
  const [showSettings, setShowSettings] = useState(false);

  // Resolve Custom Colors
  const activePalette = settings.themeColors ? (settings.isDarkMode ? settings.themeColors.dark : settings.themeColors.light) : undefined;
  
  const currentAnimationColor = activePalette ? (phase === 'work' ? activePalette.workAnimation : phase === 'break' ? activePalette.restAnimation : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentLabelColor = activePalette ? (phase === 'work' ? activePalette.workLabel : phase === 'break' ? activePalette.restLabel : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentTimerColor = activePalette ? (phase === 'work' ? activePalette.workTimer : phase === 'break' ? activePalette.restTimer : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;

  // Calculate progress for animation
  const totalSeconds = phase === 'break' ? settings.breakDuration * 60 : settings.workDuration * 60;
  const progress = phase === 'idle' ? 1 : timeLeft / totalSeconds;

  return (
    <div 
      className={`group flex flex-col items-center justify-center w-full h-screen relative overflow-hidden transition-colors duration-700 rounded-xl border border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900`}
      style={{ color: currentAnimationColor }}
    >
      
      {/* Drag Region Handle */}
      <div data-tauri-drag-region className="absolute top-0 left-0 right-0 h-6 cursor-grab z-50" />
      
      {/* Close Button (Dynamic Import with Caching is better, but doing it raw here is fine since it's a one-off close) */}
      <button 
        onClick={async () => {
          if (window.__TAURI__) {
            const { appWindow } = await import('@tauri-apps/api/window');
            appWindow.close();
          }
        }} 
        className="absolute top-2 right-2 p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition z-50"
      >
        <X size={14} />
      </button>
      
      {/* Background Animation */}
      {settings.animationStyle === '1' && <OutlineAnimation progress={progress} />}
      {settings.animationStyle === '2' && <LineAnimation progress={progress} />}
      {settings.animationStyle === '3' && <WaterAnimation progress={progress} />}
      {settings.animationStyle === '8' && <PulseAnimation progress={progress} />}

      {/* Clickable Background layer */}
      <div 
        className={`absolute inset-0 z-0 cursor-pointer transition-colors duration-700 ${
          phase === 'work' ? 'bg-blue-50 dark:bg-blue-900/20' : 
          phase === 'break' ? 'bg-amber-50 dark:bg-amber-900/20' : 
          'bg-transparent'
        }`} 
        onClick={toggleTimer}
        title="Click to Play/Pause"
      />

      {/* Main UI */}
      <div className="flex flex-col items-center justify-center w-full h-full select-none z-10 relative pointer-events-none transition-transform duration-300 active:scale-[0.98]">
        
        <TimerDisplay 
          phase={phase} 
          timeLeft={timeLeft} 
          currentLabelColor={currentLabelColor} 
          currentTimerColor={currentTimerColor} 
        />

        <ControlsDock 
          onReset={resetTimer} 
          onSettingsClick={() => setShowSettings(true)} 
        />
        
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          settings={settings} 
          setSettings={setSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}
