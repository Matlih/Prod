import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from './hooks/useSettings';
import { useTimer } from './hooks/useTimer';
import { useCountdown } from './hooks/useCountdown';
import { TimerDisplay } from './components/TimerDisplay';
import { ClockMode } from './components/modes/ClockMode';
import { CountdownMode } from './components/modes/CountdownMode';
import { ControlsDock } from './components/ControlsDock';
import { SettingsModal } from './components/SettingsModal';
import { OutlineAnimation, LineAnimation, WaterAnimation, PulseAnimation } from './components/animations/Animations';
import { X } from 'lucide-react';
import { SessionRecoveryState } from './types';
import { useSessionRecovery } from './hooks/useSessionRecovery';

export default function App() {
  const { settings, setSettings } = useSettings();
  const activeMode = settings.widgetMode || 'prod';

  const { phase, status: prodStatus, timeLeft: prodTimeLeft, currentTotalDuration, toggleTimer, resetTimer, restoreTimer } = useTimer(settings);

  const rawCountdownSeconds = (
    (settings.countdownHours !== undefined || settings.countdownMinutes !== undefined || settings.countdownSeconds !== undefined)
      ? ((settings.countdownHours || 0) * 3600) + ((settings.countdownMinutes || 0) * 60) + (settings.countdownSeconds || 0)
      : (settings.countdownDuration ? settings.countdownDuration * 60 : 900)
  );

  const countdownTotalSeconds = rawCountdownSeconds <= 0 ? 10 : rawCountdownSeconds;

  const { status: countdownStatus, timeLeft: countdownTimeLeft, toggleCountdown, resetCountdown, restoreCountdown } = useCountdown(
    countdownTotalSeconds,
    settings.sound,
    settings.isMuted
  );

  const [showSettings, setShowSettings] = useState(false);
  const [recoverySession, setRecoverySession] = useState<SessionRecoveryState | null>(null);
  const [recoveryPrompt, setRecoveryPrompt] = useState({ title: '', yes: '', no: '' });
  const { loadSession, clearSession } = useSessionRecovery();

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setRecoverySession(session);
      
      const prompts = [
        { title: "Resume previous session?", yes: "Continue", no: "Discard" },
        { title: "You left a timer running.", yes: "Pick up where I left off", no: "Start over" },
        { title: "Ready to jump back in?", yes: "Restore", no: "Start fresh" }
      ];
      setRecoveryPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    }
  }, []);

  const handleRestore = () => {
    if (!recoverySession) return;
    
    // Switch to the correct mode if we aren't in it
    if (recoverySession.mode !== activeMode) {
      setSettings(prev => ({ ...prev, widgetMode: recoverySession.mode }));
    }

    if (recoverySession.mode === 'prod') {
      restoreTimer(recoverySession);
    } else if (recoverySession.mode === 'countdown') {
      restoreCountdown(recoverySession);
    }
    setRecoverySession(null);
  };

  const handleDiscard = () => {
    clearSession();
    setRecoverySession(null);
  };


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

  // Stop and Reset timers on mode switch
  const prevModeRef = useRef(activeMode);
  useEffect(() => {
    if (prevModeRef.current !== activeMode) {
      resetTimer();
      resetCountdown();
      prevModeRef.current = activeMode;
    }
  }, [activeMode, resetTimer, resetCountdown]);

  // Deterministic Sizing Engine
  const userBoundsRef = useRef<{ size?: any; position?: any } | null>(null);

  useEffect(() => {
    if (!window.__TAURI__) return;
    
    const runEngine = async () => {
      try {
        const { appWindow, LogicalSize, currentMonitor } = await import('@tauri-apps/api/window');
        const isFs = await appWindow.isFullscreen();
        
        const isDefaultState = (activeMode !== 'prod' || phase === 'work') && !showSettings && !recoverySession;
        
        if (isDefaultState) {
          // If in fullscreen, stay in fullscreen
          if (settings.isFullscreen || isFs) {
            return;
          }
          
          if (userBoundsRef.current) {
            // Restore user's custom bounds
            if (userBoundsRef.current.size) await appWindow.setSize(userBoundsRef.current.size);
            if (userBoundsRef.current.position) await appWindow.setPosition(userBoundsRef.current.position);
            userBoundsRef.current = null;
          }
          return;
        }
        
        // 2. We are entering a non-default state
        if (!userBoundsRef.current && !isFs) {
          userBoundsRef.current = {
            size: await appWindow.outerSize(),
            position: await appWindow.outerPosition()
          };
        }
        
        // 3. Apply the Hierarchy of Needs
        if (activeMode === 'prod' && phase === 'break' && settings.strictMode) {
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
        } else if (showSettings || recoverySession) {
          // If already in fullscreen, keep fullscreen!
          if (isFs || settings.isFullscreen) {
            return;
          }
          // Settings/Recovery Modal open in windowed mode: expand to fit if small
          const currentSize = await appWindow.outerSize();
          const factor = await appWindow.scaleFactor();
          const width = currentSize.width / factor;
          const height = currentSize.height / factor;
          
          if (width < 500 || height < 680) {
            await appWindow.setSize(new LogicalSize(Math.max(width, 500), Math.max(height, 680)));
          }
        }
      } catch (e) {
        console.warn("Deterministic sizing engine failed", e);
      }
    };
    
    runEngine();
  }, [phase, showSettings, recoverySession, settings.strictMode, activeMode, settings.zenModeScale, settings.isFullscreen]);

  // Resolve Custom Colors
  const activePalette = settings.themeColors ? (settings.isDarkMode ? settings.themeColors.dark : settings.themeColors.light) : undefined;
  
  const currentAnimationColor = activePalette ? (phase === 'work' ? activePalette.workAnimation : phase === 'break' ? activePalette.restAnimation : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentLabelColor = activePalette ? (phase === 'work' ? activePalette.workLabel : phase === 'break' ? activePalette.restLabel : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentTimerColor = activePalette ? (phase === 'work' ? activePalette.workTimer : phase === 'break' ? activePalette.restTimer : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;

  // Calculate progress for animation
  const progress = prodStatus === 'idle' ? 1 : prodTimeLeft / currentTotalDuration;

  const clickTimerRef = useRef<number | null>(null);

  const toggleFullscreen = async () => {
    if (window.__TAURI__) {
      try {
        const { appWindow } = await import('@tauri-apps/api/window');
        const currentFs = await appWindow.isFullscreen();
        const nextFs = !currentFs;
        
        if (nextFs) {
          // Cache window bounds before entering fullscreen
          userBoundsRef.current = {
            size: await appWindow.outerSize(),
            position: await appWindow.outerPosition()
          };
          await appWindow.setFullscreen(true);
        } else {
          await appWindow.setFullscreen(false);
          if (userBoundsRef.current) {
            if (userBoundsRef.current.size) await appWindow.setSize(userBoundsRef.current.size);
            if (userBoundsRef.current.position) await appWindow.setPosition(userBoundsRef.current.position);
            userBoundsRef.current = null;
          }
        }
        setSettings(s => ({ ...s, isFullscreen: nextFs }));
      } catch (e) {
        console.warn("Fullscreen toggle failed", e);
      }
    }
  };

  // Restore fullscreen on initial startup if persisted
  useEffect(() => {
    if (settings.isFullscreen && window.__TAURI__) {
      import('@tauri-apps/api/window').then(({ appWindow }) => {
        appWindow.setFullscreen(true).catch(() => {});
      });
    }
  }, []);

  // Global F11 listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackgroundSingleClick = () => {
    if (activeMode === 'clock') return;
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      if (activeMode === 'prod') {
        toggleTimer();
      } else if (activeMode === 'countdown') {
        toggleCountdown();
      }
    }, 220);
  };

  const handleBackgroundDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    toggleFullscreen();
  };

  const handleReset = () => {
    if (activeMode === 'prod') {
      return resetTimer;
    } else if (activeMode === 'countdown') {
      return resetCountdown;
    }
    return undefined;
  };

  return (
    <div 
      className={`group flex flex-col items-center justify-center w-full h-screen relative overflow-hidden transition-colors duration-700 rounded-xl border border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900`}
      style={{ color: currentAnimationColor }}
    >
      
      {/* Clickable Background layer */}
      <div 
        className={`absolute inset-0 z-0 ${activeMode !== 'clock' ? 'cursor-pointer' : 'cursor-default'} transition-colors duration-700 ${
          activeMode === 'prod'
            ? prodStatus === 'idle' ? 'bg-transparent' : phase === 'work' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
            : 'bg-transparent'
        }`}  
        onClick={handleBackgroundSingleClick}
        onDoubleClick={handleBackgroundDoubleClick}
        title={activeMode !== 'clock' ? "Click to Play/Pause, Double-click for Fullscreen" : "Double-click for Fullscreen"}
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
        className="absolute top-0 right-0 w-8 h-8 flex items-start justify-end p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition z-50"
      >
        <X size={12} />
      </button>
      
      {/* Background Animation - Prod Mode Only */}
      {activeMode === 'prod' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {settings.animationStyle === '1' && <OutlineAnimation progress={progress} status={prodStatus} />}
          {settings.animationStyle === '2' && <LineAnimation progress={progress} status={prodStatus} />}
          {settings.animationStyle === '3' && <WaterAnimation progress={progress} status={prodStatus} />}
          {settings.animationStyle === '8' && <PulseAnimation progress={progress} status={prodStatus} />}
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-col items-center justify-center w-full h-full select-none z-10 relative pointer-events-none transition-transform duration-300 active:scale-[0.98]">
        
        {activeMode === 'prod' && (
          <TimerDisplay 
            phase={phase} 
            status={prodStatus}
            timeLeft={prodTimeLeft} 
            currentLabelColor={currentLabelColor} 
            currentTimerColor={currentTimerColor} 
          />
        )}

        {activeMode === 'clock' && (
          <ClockMode 
            showSeconds={settings.showSeconds}
            clockIs24Hour={settings.clockIs24Hour}
            clockTimeZone={settings.clockTimeZone}
            currentLabelColor={currentLabelColor}
            currentTimerColor={currentTimerColor}
            fontFamily={settings.flipFont}
          />
        )}

        {activeMode === 'countdown' && (
          <CountdownMode 
            status={countdownStatus}
            timeLeft={countdownTimeLeft}
            showSeconds={settings.showSeconds ?? true}
            currentLabelColor={currentLabelColor}
            currentTimerColor={currentTimerColor}
            fontFamily={settings.flipFont}
          />
        )}

        <ControlsDock 
          onReset={handleReset()} 
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

      {/* Recovery Session Modal */}
      {recoverySession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {recoveryPrompt.title}
            </h2>
            <div className="flex space-x-4">
              <button 
                onClick={handleRestore}
                className="px-5 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium hover:opacity-90 transition"
              >
                {recoveryPrompt.yes}
              </button>
              <button 
                onClick={handleDiscard}
                className="px-5 py-2.5 rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                {recoveryPrompt.no}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
