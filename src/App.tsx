import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from './hooks/useSettings';
import { useTimer } from './hooks/useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { ControlsDock } from './components/ControlsDock';
import { SettingsModal } from './components/SettingsModal';
import { OutlineAnimation, LineAnimation, WaterAnimation, PulseAnimation } from './components/animations/Animations';
import { X } from 'lucide-react';

export default function App() {
  const { settings, setSettings } = useSettings();
  const { phase, status, timeLeft, currentTotalDuration, toggleTimer, resetTimer } = useTimer(settings);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize Pin State on boot
  useEffect(() => {
    const initPinState = async () => {
      if (window.__TAURI__ && settings.isPinned !== undefined) {
        try {
          const { appWindow } = await import('@tauri-apps/api/window');
          await appWindow.setAlwaysOnTop(settings.isPinned);
        } catch (e) {
          console.warn("Failed to set pin state", e);
        }
      }
    };
    initPinState();
  }, []);

  // Deterministic Sizing Engine
  const userBoundsRef = useRef<{ size?: any; position?: any } | null>(null);

  useEffect(() => {
    if (!window.__TAURI__) return;
    
    const runEngine = async () => {
      try {
        const { appWindow, LogicalSize, currentMonitor } = await import('@tauri-apps/api/window');
        
        const isDefaultState = phase === 'work' && !showSettings;
        
        if (isDefaultState) {
          // 1. We are in the Default State
          await appWindow.setFullscreen(false);
          
          if (userBoundsRef.current) {
            // We just returned from a non-default state. Restore the user's custom bounds.
            if (userBoundsRef.current.size) await appWindow.setSize(userBoundsRef.current.size);
            if (userBoundsRef.current.position) await appWindow.setPosition(userBoundsRef.current.position);
            userBoundsRef.current = null; // Clear the cache
          }
          return;
        }
        
        // 2. We are entering a non-default state
        // If we haven't cached the default bounds yet, do it NOW before altering the window.
        if (!userBoundsRef.current) {
          userBoundsRef.current = {
            size: await appWindow.outerSize(),
            position: await appWindow.outerPosition()
          };
        }
        
        // 3. Apply the Hierarchy of Needs
        if (phase === 'break' && settings.strictMode) {
          if (settings.zenModeScale === '100') {
             await appWindow.setFullscreen(true);
          } else {
             await appWindow.setFullscreen(false);
             const monitor = await currentMonitor();
             if (monitor) {
                const width = Math.min(1200, monitor.size.width * 0.8);
                const height = Math.min(800, monitor.size.height * 0.8);
                await appWindow.setSize(new LogicalSize(width, height));
                await appWindow.center();
             } else {
                await appWindow.setSize(new LogicalSize(800, 600));
                await appWindow.center();
             }
          }
        } else if (showSettings) {
          await appWindow.setFullscreen(false);
          // Settings Modal open: expand to fit settings
          const currentSize = await appWindow.outerSize();
          const factor = await appWindow.scaleFactor();
          const width = currentSize.width / factor;
          const height = currentSize.height / factor;
          
          if (width < 450 || height < 650) {
            await appWindow.setSize(new LogicalSize(Math.max(width, 450), Math.max(height, 650)));
            // Removed appWindow.center() so it expands in place
          }
        }
      } catch (e) {
        console.warn("Deterministic sizing engine failed", e);
      }
    };
    
    runEngine();
  }, [phase, showSettings, settings.strictMode]);

  // Resolve Custom Colors
  const activePalette = settings.themeColors ? (settings.isDarkMode ? settings.themeColors.dark : settings.themeColors.light) : undefined;
  
  const currentAnimationColor = activePalette ? (phase === 'work' ? activePalette.workAnimation : phase === 'break' ? activePalette.restAnimation : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentLabelColor = activePalette ? (phase === 'work' ? activePalette.workLabel : phase === 'break' ? activePalette.restLabel : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentTimerColor = activePalette ? (phase === 'work' ? activePalette.workTimer : phase === 'break' ? activePalette.restTimer : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;

  // Calculate progress for animation
  const progress = status === 'idle' ? 1 : timeLeft / currentTotalDuration;

  return (
    <div 
      className={`group flex flex-col items-center justify-center w-full h-screen relative overflow-hidden transition-colors duration-700 rounded-xl border border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900`}
      style={{ color: currentAnimationColor }}
    >
      
      {/* Clickable Background layer */}
      <div 
        className={`absolute inset-0 z-0 cursor-pointer transition-colors duration-700 ${
          status === 'idle' ? 'bg-transparent' :
          phase === 'work' ? 'bg-blue-50 dark:bg-blue-900/20' : 
          'bg-amber-50 dark:bg-amber-900/20'
        }`}  
        onClick={toggleTimer}
        title="Click to Play/Pause"
      />

      {/* Drag Region Handle */}
      <div data-tauri-drag-region className="absolute top-0 left-0 right-0 h-6 cursor-grab z-50" />
      
      {/* Close Button */}
      <button 
        onClick={async () => {
          if (window.__TAURI__) {
            try {
              const { appWindow } = await import('@tauri-apps/api/window');
              appWindow.close().catch(() => {});
            } catch (err) {
              console.error("Failed to load Tauri window API", err);
            }
          }
        }} 
        className="absolute top-2 right-2 p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition z-50"
      >
        <X size={14} />
      </button>
      
      {/* Background Animation (Z-index 0, but rendered after background so it sits on top) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {settings.animationStyle === '1' && <OutlineAnimation progress={progress} status={status} />}
        {settings.animationStyle === '2' && <LineAnimation progress={progress} status={status} />}
        {settings.animationStyle === '3' && <WaterAnimation progress={progress} status={status} />}
        {settings.animationStyle === '8' && <PulseAnimation progress={progress} status={status} />}
      </div>

      {/* Main UI */}
      <div className="flex flex-col items-center justify-center w-full h-full select-none z-10 relative pointer-events-none transition-transform duration-300 active:scale-[0.98]">
        
        <TimerDisplay 
          phase={phase} 
          status={status}
          timeLeft={timeLeft} 
          currentLabelColor={currentLabelColor} 
          currentTimerColor={currentTimerColor} 
        />

        <ControlsDock 
          onReset={resetTimer} 
          onSettingsClick={() => setShowSettings(true)} 
          isPinned={!!settings.isPinned}
          onTogglePin={async (pinned) => {
            setSettings(s => ({ ...s, isPinned: pinned }));
            if (window.__TAURI__) {
              try {
                const { appWindow } = await import('@tauri-apps/api/window');
                await appWindow.setAlwaysOnTop(pinned);
              } catch (e) {
                console.warn("Failed to pin", e);
              }
            }
          }}
        />
        
      </div>

      {/* Thumb Grip Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition duration-300 z-50 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        onPointerDown={async (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          target.setPointerCapture(e.pointerId);
          
          if (window.__TAURI__) {
            try {
              const { appWindow, LogicalSize } = await import('@tauri-apps/api/window');
              let isResizing = false;
              
              const onPointerMove = (moveEvent: PointerEvent) => {
                if (isResizing) return;
                isResizing = true;
                requestAnimationFrame(() => {
                  const newWidth = Math.max(150, Math.round(moveEvent.clientX));
                  const newHeight = Math.max(100, Math.round(moveEvent.clientY));
                  appWindow.setSize(new LogicalSize(newWidth, newHeight)).finally(() => {
                    isResizing = false;
                  });
                });
              };
              
              const onPointerUp = (upEvent: PointerEvent) => {
                target.releasePointerCapture(upEvent.pointerId);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
              };
              
              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
            } catch (err) { console.warn(err); }
          }
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
           <path d="M 10 1 Q 10 10 1 10" />
        </svg>
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
