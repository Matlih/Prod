import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings as SettingsIcon, Pin, RotateCcw, X, Moon, Sun, Trash2, Volume2, VolumeX, Bell, Zap, Waves } from 'lucide-react';
import { createPortal } from 'react-dom';

// --- Types & Constants ---
type Preset = '90/15' | '25/5' | 'custom' | string;
type TimerPhase = 'idle' | 'work' | 'break' | 'paused';
type AnimationStyle = '1' | '2' | '3' | '8';
type SoundType = 'chime' | 'digital' | 'bowl';

interface CustomPreset {
  id: string;
  name: string;
  workDuration: number;
  breakDuration: number;
}

interface ThemePalette {
  workLabel: string;
  restLabel: string;
  workTimer: string;
  restTimer: string;
  workAnimation: string;
  restAnimation: string;
}

interface ThemeColors {
  light: ThemePalette;
  dark: ThemePalette;
}

interface Settings {
  preset: Preset;
  workDuration: number;
  breakDuration: number;
  isDarkMode: boolean;
  animationStyle: AnimationStyle;
  savedPresets?: CustomPreset[];
  sound: SoundType;
  isMuted: boolean;
  themeColors?: ThemeColors;
}

const defaultSettings: Settings = {
  preset: '90/15',
  workDuration: 90,
  breakDuration: 15,
  isDarkMode: true,
  animationStyle: '1',
  savedPresets: [],
  sound: 'chime',
  isMuted: false,
  themeColors: {
    light: {
      workLabel: '#2563eb', // blue-600
      restLabel: '#f59e0b', // amber-500
      workTimer: '#2563eb', // blue-600
      restTimer: '#f59e0b', // amber-500
      workAnimation: '#2563eb',
      restAnimation: '#f59e0b',
    },
    dark: {
      workLabel: '#60a5fa', // blue-400
      restLabel: '#fbbf24', // amber-400
      workTimer: '#60a5fa', // blue-400
      restTimer: '#fbbf24', // amber-400
      workAnimation: '#60a5fa',
      restAnimation: '#fbbf24',
    }
  }
};

// --- Hooks ---
function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('prod-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultSettings, 
          ...parsed,
          themeColors: {
            light: { ...defaultSettings.themeColors?.light, ...parsed.themeColors?.light },
            dark: { ...defaultSettings.themeColors?.dark, ...parsed.themeColors?.dark }
          }
        };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('prod-settings', JSON.stringify(settings));
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  return { settings, setSettings };
}

function playSound(type: SoundType, isMuted: boolean) {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    
    if (type === 'chime') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2);
    } else if (type === 'digital') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'bowl') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4);
    }
  } catch (e) {
    console.error("Audio not supported or blocked");
  }
}

// --- Animation Components ---
const OutlineAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute inset-4 md:inset-8 pointer-events-none">
    <svg width="100%" height="100%" className="overflow-visible">
      <rect 
        x="0" y="0" width="100%" height="100%" rx="32" 
        fill="none" stroke="currentColor" strokeWidth="2" 
        className="opacity-10" 
      />
      <rect 
        x="0" y="0" width="100%" height="100%" rx="32" 
        fill="none" stroke="currentColor" strokeWidth="2" 
        pathLength="100"
        strokeDasharray="100" 
        strokeDashoffset={100 * (1 - progress)} 
        className="transition-all duration-1000 ease-linear opacity-50" 
      />
    </svg>
  </div>
);

const LineAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all duration-1000 ease-linear pointer-events-none" style={{ width: `${progress * 100}%` }} />
);

const WaterAnimation = ({ progress }: { progress: number }) => (
  <div className="absolute bottom-0 left-0 w-full bg-current opacity-10 transition-all duration-1000 ease-linear pointer-events-none" style={{ height: `${progress * 100}%` }} />
);

const PulseAnimation = ({ progress }: { progress: number }) => {
  const duration = 1 + (progress * 3);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div 
        className="w-[60vmin] h-[60vmin] rounded-full bg-current opacity-10 blur-[60px] animate-pulse"
        style={{
          animationDuration: `${duration}s`,
          transform: `scale(${0.7 + (progress * 0.5)})`
        }}
      />
    </div>
  );
};

// --- Main Component ---
const ColorPickerRow = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
    <span className="font-medium text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
    <div className="flex items-center space-x-2">
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-16 p-1 text-[10px] text-center rounded bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-1 focus:ring-neutral-500 outline-none uppercase font-mono"
      />
      <input 
        type="color" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
      />
    </div>
  </div>
);

export default function App() {
  const { settings, setSettings } = useSettings();
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [themeEditorMode, setThemeEditorMode] = useState<'light' | 'dark'>('dark');
  const [presetName, setPresetName] = useState('');
  const [presetWork, setPresetWork] = useState(60);
  const [presetBreak, setPresetBreak] = useState(10);
  
  const intervalRef = useRef<number | null>(null);
  const prevPhase = useRef<TimerPhase>('idle');

  const saveCustomPreset = () => {
    if (!presetName.trim()) return;
    const newPreset: CustomPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      workDuration: presetWork,
      breakDuration: presetBreak,
    };
    setSettings(s => ({
      ...s,
      savedPresets: [...(s.savedPresets || []), newPreset]
    }));
    setPresetName('');
  };

  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSettings(s => {
      const newPresets = (s.savedPresets || []).filter(p => p.id !== id);
      const newSettings = { ...s, savedPresets: newPresets };
      if (s.preset === id) {
        newSettings.preset = '90/15';
        newSettings.workDuration = 90;
        newSettings.breakDuration = 15;
      }
      return newSettings;
    });
  };

  // Sync initial time when settings change in idle state
  useEffect(() => {
    if (phase === 'idle') {
      setTimeLeft(settings.workDuration * 60);
    }
  }, [settings.workDuration, phase]);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) return 0;
      return prev - 1;
    });
  }, []);

  // Handle phase transitions when time reaches 0
  useEffect(() => {
    if (timeLeft === 0) {
      playSound(settings.sound, settings.isMuted);
      if (phase === 'work') {
        setPhase('break');
        setTimeLeft(settings.breakDuration * 60);
      } else if (phase === 'break') {
        setPhase('work');
        setTimeLeft(settings.workDuration * 60);
      }
    }
  }, [timeLeft, phase, settings.breakDuration, settings.workDuration]);

  // Interval manager
  useEffect(() => {
    if (phase === 'work' || phase === 'break') {
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [phase, tick]);

  const toggleTimer = () => {
    if (phase === 'idle') {
      setPhase('work');
    } else if (phase === 'work' || phase === 'break') {
      prevPhase.current = phase;
      setPhase('paused');
    } else if (phase === 'paused') {
      setPhase(prevPhase.current);
    }
  };

  const resetTimer = () => {
    setPhase('idle');
    setTimeLeft(settings.workDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tauri Picture in Picture / Always on Top logic
  const [isPinned, setIsPinned] = useState(false);

  const togglePip = async () => {
    try {
      // Dynamically import Tauri so it doesn't break if run in browser
      const { appWindow } = await import('@tauri-apps/api/window');
      const nextState = !isPinned;
      await appWindow.setAlwaysOnTop(nextState);
      setIsPinned(nextState);
    } catch (e) {
      console.warn('Tauri API not available (running in browser?)', e);
      alert('Pin to screen is only available in the desktop app.');
    }
  };

  // Resolve Custom Colors
  const activePalette = settings.themeColors ? (settings.isDarkMode ? settings.themeColors.dark : settings.themeColors.light) : undefined;
  
  const currentAnimationColor = activePalette ? (phase === 'work' ? activePalette.workAnimation : phase === 'break' ? activePalette.restAnimation : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentLabelColor = activePalette ? (phase === 'work' ? activePalette.workLabel : phase === 'break' ? activePalette.restLabel : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const currentTimerColor = activePalette ? (phase === 'work' ? activePalette.workTimer : phase === 'break' ? activePalette.restTimer : (settings.isDarkMode ? '#fafafa' : '#171717')) : undefined;
  const displayBgColor = () => {
    if (phase === 'work') return 'bg-blue-50/50 dark:bg-blue-900/10';
    if (phase === 'break') return 'bg-amber-50/50 dark:bg-amber-900/10';
    return 'bg-transparent';
  };

  // Calculate progress for animation
  const totalSeconds = phase === 'break' ? settings.breakDuration * 60 : settings.workDuration * 60;
  const progress = phase === 'idle' ? 1 : timeLeft / totalSeconds;

  return (
    <div 
      className={`flex flex-col items-center justify-center w-full h-screen relative overflow-hidden transition-colors duration-700 ${displayBgColor()}`}
      style={{ color: currentAnimationColor }}
    >
      
      {/* Background Animation */}
      {settings.animationStyle === '1' && <OutlineAnimation progress={progress} />}
      {settings.animationStyle === '2' && <LineAnimation progress={progress} />}
      {settings.animationStyle === '3' && <WaterAnimation progress={progress} />}
      {settings.animationStyle === '8' && <PulseAnimation progress={progress} />}

      {/* Clickable Background layer */}
      <div 
        className="absolute inset-0 z-0 cursor-pointer" 
        onClick={toggleTimer}
        title="Click to Play/Pause"
      />

      {/* Main UI */}
      <div className="flex flex-col items-center justify-center w-full h-full select-none z-10 relative pointer-events-none transition-transform duration-300 active:scale-[0.98]">
        
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

        {/* Controls Dock */}
        <div className="mt-[4vmin] md:mt-8 flex items-center space-x-4 opacity-15 hover:opacity-100 transition-opacity duration-300 text-neutral-900 dark:text-neutral-50 pointer-events-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); resetTimer(); }} 
            title="Reset Timer" 
            className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePip(); }} 
            title={isPinned ? "Unpin from screen" : "Pin to screen"} 
            className={`p-3 rounded-full transition ${isPinned ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
          >
            <Pin size={20} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} 
            title="Settings" 
            className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 text-neutral-900 dark:text-neutral-50">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative max-h-screen overflow-y-auto">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-light mb-8">Configuration</h2>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <span className="font-medium">Appearance</span>
                <button 
                  onClick={() => setSettings(s => ({ ...s, isDarkMode: !s.isDarkMode }))}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                  {settings.isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                  <span className="text-sm">{settings.isDarkMode ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              {/* Animation Styles */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <span className="font-medium text-sm text-neutral-500">Animation Style</span>
                <div className="grid grid-cols-2 gap-3">
                  {(['1', '2', '3', '8'] as AnimationStyle[]).map((styleId) => {
                    const labels = {
                      '1': 'Outline',
                      '2': 'Line',
                      '3': 'Water',
                      '8': 'Pulse'
                    };
                    return (
                      <button
                        key={styleId}
                        onClick={() => setSettings(s => ({ ...s, animationStyle: styleId }))}
                        className={`p-3 rounded-xl border transition ${settings.animationStyle === styleId ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                      >
                        {labels[styleId]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-3 pt-2">
                <span className="font-medium text-sm text-neutral-500">Rhythm Preset</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSettings(s => ({ ...s, preset: '90/15', workDuration: 90, breakDuration: 15 }))}
                    className={`p-3 rounded-xl border transition ${settings.preset === '90/15' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                  >
                    90/15 Ultradian
                  </button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, preset: '25/5', workDuration: 25, breakDuration: 5 }))}
                    className={`p-3 rounded-xl border transition ${settings.preset === '25/5' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                  >
                    25/5 Pomodoro
                  </button>
                  {(settings.savedPresets || []).map(p => (
                    <div key={p.id} className="relative group">
                      <button
                        onClick={() => setSettings(s => ({ ...s, preset: p.id, workDuration: p.workDuration, breakDuration: p.breakDuration }))}
                        className={`w-full p-3 rounded-xl border transition ${settings.preset === p.id ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                      >
                        {p.name}
                      </button>
                      <button 
                        onClick={(e) => deleteCustomPreset(p.id, e)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Preset"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Builder */}
              <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-neutral-500">Create Custom Preset</span>
                </div>
                
                <div>
                  <label className="block text-xs mb-1 opacity-70">Preset Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Deep Focus"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition outline-none"
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs mb-1 opacity-70">Deep Work (min)</label>
                    <input 
                      type="number" 
                      value={presetWork}
                      onChange={(e) => setPresetWork(Number(e.target.value) || 1)}
                      className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs mb-1 opacity-70">Rest (min)</label>
                    <input 
                      type="number" 
                      value={presetBreak}
                      onChange={(e) => setPresetBreak(Number(e.target.value) || 1)}
                      className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={saveCustomPreset}
                  disabled={!presetName.trim()}
                  className="w-full p-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium disabled:opacity-50 transition"
                >
                  Save Preset
                </button>
              </div>

              {/* Sound & Mute */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-neutral-500">Sound Alert</span>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, isMuted: !s.isMuted }))}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                  >
                    {settings.isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['chime', 'digital', 'bowl'] as SoundType[]).map((snd) => (
                    <button
                      key={snd}
                      onClick={() => {
                        setSettings(s => ({ ...s, sound: snd }));
                        playSound(snd, settings.isMuted);
                      }}
                      className={`flex justify-center items-center p-3 rounded-xl border transition ${settings.sound === snd ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700'} ${settings.isMuted ? 'opacity-50' : ''}`}
                      title={snd}
                    >
                      {snd === 'chime' && <Bell size={20} />}
                      {snd === 'digital' && <Zap size={20} />}
                      {snd === 'bowl' && <Waves size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Colors */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-neutral-500">Theme Colors</span>
                  <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setThemeEditorMode('light')}
                      className={`p-1 rounded-md transition ${themeEditorMode === 'light' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400'}`}
                    >
                      <Sun size={14} />
                    </button>
                    <button 
                      onClick={() => setThemeEditorMode('dark')}
                      className={`p-1 rounded-md transition ${themeEditorMode === 'dark' ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400'}`}
                    >
                      <Moon size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-3">
                  <ColorPickerRow 
                    label="Deep Work Label" 
                    value={settings.themeColors?.[themeEditorMode]?.workLabel || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], workLabel: val } } }))} 
                  />
                  <ColorPickerRow 
                    label="Rest Label" 
                    value={settings.themeColors?.[themeEditorMode]?.restLabel || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], restLabel: val } } }))} 
                  />
                  <ColorPickerRow 
                    label="Work Timer" 
                    value={settings.themeColors?.[themeEditorMode]?.workTimer || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], workTimer: val } } }))} 
                  />
                  <ColorPickerRow 
                    label="Rest Timer" 
                    value={settings.themeColors?.[themeEditorMode]?.restTimer || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], restTimer: val } } }))} 
                  />
                  <ColorPickerRow 
                    label="Work Animation" 
                    value={settings.themeColors?.[themeEditorMode]?.workAnimation || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], workAnimation: val } } }))} 
                  />
                  <ColorPickerRow 
                    label="Rest Animation" 
                    value={settings.themeColors?.[themeEditorMode]?.restAnimation || ''} 
                    onChange={(val) => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: { ...s.themeColors![themeEditorMode], restAnimation: val } } }))} 
                  />
                  <button 
                    onClick={() => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: defaultSettings.themeColors![themeEditorMode] } }))}
                    className="w-full mt-3 p-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Restore Defaults
                  </button>
                </div>
              </div>

              {/* Version Label */}
              <div className="pt-6 pb-2 text-center">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-widest uppercase">Prod v1.1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
