import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Volume2, VolumeX, Bell, Zap, Waves, Clock, Hourglass } from 'lucide-react';
import { Settings, SoundType, CustomPreset, AnimationStyle, ThemePalette } from '../types';
import { playSound } from '../utils/audio';
import { defaultSettings } from '../hooks/useSettings';

interface SettingsModalProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onClose: () => void;
}

const ColorPickerRow = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => (
  <div className="flex items-center justify-between py-1.5 gap-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
    <span className="font-medium text-xs text-neutral-600 dark:text-neutral-400 shrink-0">{label}</span>
    <div className="flex items-center space-x-1.5 shrink-0">
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-[62px] p-1 text-[11px] text-center rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 focus:ring-1 focus:ring-neutral-500 outline-none uppercase font-mono"
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

export const SettingsModal = ({ settings, setSettings, onClose }: SettingsModalProps) => {
  const [themeEditorMode, setThemeEditorMode] = useState<'light' | 'dark'>('dark');
  const [presetName, setPresetName] = useState('');
  const [presetWorkStr, setPresetWorkStr] = useState('60');
  const [presetBreakStr, setPresetBreakStr] = useState('10');
  const [cdHoursStr, setCdHoursStr] = useState((settings.countdownHours ?? 0).toString());
  const [cdMinsStr, setCdMinsStr] = useState((settings.countdownMinutes ?? (settings.countdownDuration || 15)).toString());
  const [cdSecsStr, setCdSecsStr] = useState((settings.countdownSeconds ?? 0).toString());
  const originalSizeRef = useRef<any>(null);

  const normalizeAndSetCountdown = (hVal: number, mVal: number, sVal: number, enforceNonZero = false) => {
    let total = (hVal * 3600) + (mVal * 60) + sVal;
    if (enforceNonZero && total <= 0) {
      total = 10;
    }
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    setCdHoursStr(h.toString());
    setCdMinsStr(m.toString());
    setCdSecsStr(s.toString());
    setSettings(prev => ({
      ...prev,
      countdownHours: h,
      countdownMinutes: m,
      countdownSeconds: s,
    }));
  };

  const handleHoursChange = (val: string) => {
    setCdHoursStr(val);
    const h = parseInt(val, 10) || 0;
    const m = parseInt(cdMinsStr, 10) || 0;
    const s = parseInt(cdSecsStr, 10) || 0;
    setSettings(prev => ({
      ...prev,
      countdownHours: Math.max(0, h),
      countdownMinutes: Math.max(0, m),
      countdownSeconds: Math.max(0, s),
    }));
  };

  const handleMinutesChange = (val: string) => {
    setCdMinsStr(val);
    const m = parseInt(val, 10) || 0;
    const h = parseInt(cdHoursStr, 10) || 0;
    const s = parseInt(cdSecsStr, 10) || 0;
    if (m >= 60) {
      normalizeAndSetCountdown(h, m, s, false);
    } else {
      setSettings(prev => ({
        ...prev,
        countdownHours: Math.max(0, h),
        countdownMinutes: Math.max(0, m),
        countdownSeconds: Math.max(0, s),
      }));
    }
  };

  const handleSecondsChange = (val: string) => {
    setCdSecsStr(val);
    const s = parseInt(val, 10) || 0;
    const h = parseInt(cdHoursStr, 10) || 0;
    const m = parseInt(cdMinsStr, 10) || 0;
    if (s >= 60) {
      normalizeAndSetCountdown(h, m, s, false);
    } else {
      setSettings(prev => ({
        ...prev,
        countdownHours: Math.max(0, h),
        countdownMinutes: Math.max(0, m),
        countdownSeconds: Math.max(0, s),
      }));
    }
  };

  const handleBlurNormalize = () => {
    const h = parseInt(cdHoursStr, 10) || 0;
    const m = parseInt(cdMinsStr, 10) || 0;
    const s = parseInt(cdSecsStr, 10) || 0;
    normalizeAndSetCountdown(h, m, s, true);
  };

  useEffect(() => {
    // Sizing is now completely managed by the deterministic engine in App.tsx
  }, []);

  const saveCustomPreset = () => {
    if (!presetName.trim()) return;
    
    const workNum = parseInt(presetWorkStr, 10);
    const breakNum = parseInt(presetBreakStr, 10);
    
    if (isNaN(workNum) || workNum <= 0 || isNaN(breakNum) || breakNum <= 0) {
        alert("Please enter valid positive numbers for durations");
        return;
    }

    const newId = Date.now().toString();
    const newPreset: CustomPreset = {
      id: newId,
      name: presetName.trim(),
      workDuration: workNum,
      breakDuration: breakNum,
    };
    setSettings(s => ({
      ...s,
      savedPresets: { ...(s.savedPresets || {}), [newId]: newPreset }
    }));
    setPresetName('');
  };

  const deleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSettings(s => {
      const newPresets = { ...s.savedPresets };
      delete newPresets[id];
      const newSettings = { ...s, savedPresets: newPresets };
      if (s.preset === id) {
        newSettings.preset = '90/15';
        newSettings.workDuration = 90;
        newSettings.breakDuration = 15;
      }
      return newSettings;
    });
  };

  const updateThemeColor = (key: keyof ThemePalette, value: string) => {
    setSettings(s => ({
      ...s,
      themeColors: {
        ...s.themeColors!,
        [themeEditorMode]: { ...s.themeColors![themeEditorMode], [key]: value }
      }
    }));
  };

  const activeMode = settings.widgetMode || 'prod';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 text-neutral-900 dark:text-neutral-50">
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full max-w-[490px] relative max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-light mb-6">Configuration</h2>

        {/* Mode Selector Segmented Control */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
          <button
            onClick={() => setSettings(s => ({ ...s, widgetMode: 'prod' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition ${
              activeMode === 'prod'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Zap size={15} />
            <span>Prod</span>
          </button>
          <button
            onClick={() => setSettings(s => ({ ...s, widgetMode: 'clock' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition ${
              activeMode === 'clock'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock size={15} />
            <span>Clock</span>
          </button>
          <button
            onClick={() => setSettings(s => ({ ...s, widgetMode: 'countdown' }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition ${
              activeMode === 'countdown'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Hourglass size={15} />
            <span>Timer</span>
          </button>
        </div>

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

          {/* Clock & Countdown: Show Seconds Toggle */}
          {(activeMode === 'clock' || activeMode === 'countdown') && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div>
                <span className="font-medium block">Show Seconds</span>
                <span className="text-xs text-neutral-500">Display second numerals</span>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, showSeconds: !s.showSeconds }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.showSeconds ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 absolute top-1 transition-transform ${settings.showSeconds ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {/* Clock & Countdown: Typography Font Selection */}
          {(activeMode === 'clock' || activeMode === 'countdown') && (
            <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium block">Typography Font</span>
                  <span className="text-xs text-neutral-500">Numerals style</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bodoni', label: 'Bodoni (Default)', class: 'font-flip-bodoni' },
                  { id: 'jakarta', label: 'Plus Jakarta Sans', class: 'font-flip-jakarta' },
                  { id: 'mono', label: 'Space Mono', class: 'font-flip-mono' },
                  { id: 'digital', label: 'Digital Number', class: 'font-flip-digital' },
                ].map((fontOption) => (
                  <button
                    key={fontOption.id}
                    onClick={() => setSettings(s => ({ ...s, flipFont: fontOption.id as any }))}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-center transition ${(settings.flipFont || 'bodoni') === fontOption.id ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 shadow-sm' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}`}
                  >
                    <span className="text-[11px] text-neutral-500 font-sans">{fontOption.label}</span>
                    <span className={`text-base font-bold mt-0.5 ${fontOption.class} text-neutral-900 dark:text-white`}>07:35</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clock: 12-Hour / 24-Hour Format */}
          {activeMode === 'clock' && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div>
                <span className="font-medium block">Time Format</span>
                <span className="text-xs text-neutral-500">12-hour or 24-hour display</span>
              </div>
              <div className="flex bg-neutral-200 dark:bg-neutral-700 p-1 rounded-lg">
                <button 
                  onClick={() => setSettings(s => ({ ...s, clockIs24Hour: false }))}
                  className={`px-3 py-1 text-xs rounded-md transition ${!settings.clockIs24Hour ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  12h
                </button>
                <button 
                  onClick={() => setSettings(s => ({ ...s, clockIs24Hour: true }))}
                  className={`px-3 py-1 text-xs rounded-md transition ${settings.clockIs24Hour ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                  24h
                </button>
              </div>
            </div>
          )}

          {/* Countdown Duration Input: Hours, Minutes, Seconds */}
          {activeMode === 'countdown' && (
            <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-neutral-500">Timer Duration</span>
                <span className="text-[10px] text-neutral-400">Auto-converts 60+ min/sec</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1.5 opacity-70">Hours</label>
                  <input 
                    type="number"
                    min="0"
                    max="99"
                    value={cdHoursStr}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    onBlur={handleBlurNormalize}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white outline-none font-medium text-center"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1.5 opacity-70">Minutes</label>
                  <input 
                    type="number"
                    min="0"
                    value={cdMinsStr}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    onBlur={handleBlurNormalize}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white outline-none font-medium text-center"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1.5 opacity-70">Seconds</label>
                  <input 
                    type="number"
                    min="0"
                    value={cdSecsStr}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    onBlur={handleBlurNormalize}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white outline-none font-medium text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Prod Only: Strict Zen Mode */}
          {activeMode === 'prod' && (
            <div className="flex flex-col p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium block">Strict Zen Mode</span>
                  <span className="text-xs text-neutral-500">Auto-expands during breaks</span>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, strictMode: !s.strictMode }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.strictMode ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 absolute top-1 transition-transform ${settings.strictMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {settings.strictMode && (
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-500">Break Screen Cover</span>
                  <div className="flex bg-neutral-200 dark:bg-neutral-700 p-1 rounded-lg">
                    <button 
                      onClick={() => setSettings(s => ({ ...s, zenModeScale: '80' }))}
                      className={`px-3 py-1 text-xs rounded-md transition ${settings.zenModeScale === '80' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                    >
                      80% Cover
                    </button>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, zenModeScale: '100' }))}
                      className={`px-3 py-1 text-xs rounded-md transition ${settings.zenModeScale === '100' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                    >
                      100% Full
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prod Only: Animation Styles */}
          {activeMode === 'prod' && (
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="font-medium text-sm text-neutral-500">Animation Style</span>
              <div className="grid grid-cols-2 gap-3">
                {(['1', '2', '3', '8'] as AnimationStyle[]).map((styleId) => {
                  const labels = { '1': 'Outline', '2': 'Line', '3': 'Water', '8': 'Pulse' };
                  return (
                    <button
                      key={styleId}
                      onClick={() => setSettings(s => ({ ...s, animationStyle: styleId }))}
                      className={`p-3 rounded-xl border transition ${settings.animationStyle === styleId ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300'}`}
                    >
                      {labels[styleId]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prod Only: Presets */}
          {activeMode === 'prod' && (
            <div className="space-y-3 pt-2">
              <span className="font-medium text-sm text-neutral-500">Rhythm Preset</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings(s => ({ ...s, preset: '90/15', workDuration: 90, breakDuration: 15 }))}
                  className={`p-3 rounded-xl border transition ${settings.preset === '90/15' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300'}`}
                >
                  90/15 Ultradian
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, preset: '25/5', workDuration: 25, breakDuration: 5 }))}
                  className={`p-3 rounded-xl border transition ${settings.preset === '25/5' ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300'}`}
                >
                  25/5 Pomodoro
                </button>
                {Object.values(settings.savedPresets || {}).map(p => (
                  <div key={p.id} className="relative group/preset">
                    <button
                      onClick={() => setSettings(s => ({ ...s, preset: p.id, workDuration: p.workDuration, breakDuration: p.breakDuration }))}
                      className={`w-full p-3 rounded-xl border transition ${settings.preset === p.id ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300'}`}
                    >
                      {p.name}
                    </button>
                    <button 
                      onClick={(e) => deleteCustomPreset(p.id, e)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/preset:opacity-100 transition-opacity"
                      title="Delete Preset"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prod Only: Custom Builder */}
          {activeMode === 'prod' && (
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
                    value={presetWorkStr}
                    onChange={(e) => setPresetWorkStr(e.target.value)}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1 opacity-70">Rest (min)</label>
                  <input 
                    type="number" 
                    value={presetBreakStr}
                    onChange={(e) => setPresetBreakStr(e.target.value)}
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
          )}

          {/* Prod & Countdown: Sound & Mute */}
          {(activeMode === 'prod' || activeMode === 'countdown') && (
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
                    className={`flex justify-center items-center p-3 rounded-xl border transition ${settings.sound === snd ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:border-neutral-300'} ${settings.isMuted ? 'opacity-50' : ''}`}
                    title={snd}
                  >
                    {snd === 'chime' && <Bell size={20} />}
                    {snd === 'digital' && <Zap size={20} />}
                    {snd === 'bowl' && <Waves size={20} />}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-3.5">
              {activeMode === 'prod' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Work Column */}
                  <div className="bg-white/80 dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                    <div className="flex items-center space-x-2 pb-2 mb-1.5 border-b border-neutral-200/50 dark:border-neutral-700/50">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm" />
                      <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Work</span>
                    </div>
                    <div className="space-y-1">
                      <ColorPickerRow label="Label" value={settings.themeColors?.[themeEditorMode]?.workLabel || ''} onChange={(val) => updateThemeColor('workLabel', val)} />
                      <ColorPickerRow label="Digits" value={settings.themeColors?.[themeEditorMode]?.workTimer || ''} onChange={(val) => updateThemeColor('workTimer', val)} />
                      <ColorPickerRow label="Animation" value={settings.themeColors?.[themeEditorMode]?.workAnimation || ''} onChange={(val) => updateThemeColor('workAnimation', val)} />
                    </div>
                  </div>

                  {/* Rest Column */}
                  <div className="bg-white/80 dark:bg-neutral-800/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                    <div className="flex items-center space-x-2 pb-2 mb-1.5 border-b border-neutral-200/50 dark:border-neutral-700/50">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
                      <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Rest</span>
                    </div>
                    <div className="space-y-1">
                      <ColorPickerRow label="Label" value={settings.themeColors?.[themeEditorMode]?.restLabel || ''} onChange={(val) => updateThemeColor('restLabel', val)} />
                      <ColorPickerRow label="Digits" value={settings.themeColors?.[themeEditorMode]?.restTimer || ''} onChange={(val) => updateThemeColor('restTimer', val)} />
                      <ColorPickerRow label="Animation" value={settings.themeColors?.[themeEditorMode]?.restAnimation || ''} onChange={(val) => updateThemeColor('restAnimation', val)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-1">
                  <ColorPickerRow 
                    label={activeMode === 'clock' ? "Date / Header" : "Status Header"} 
                    value={settings.themeColors?.[themeEditorMode]?.workLabel || ''} 
                    onChange={(val) => {
                      updateThemeColor('workLabel', val);
                      updateThemeColor('restLabel', val);
                    }} 
                  />
                  <ColorPickerRow 
                    label="Digits & Time" 
                    value={settings.themeColors?.[themeEditorMode]?.workTimer || ''} 
                    onChange={(val) => {
                      updateThemeColor('workTimer', val);
                      updateThemeColor('restTimer', val);
                    }} 
                  />
                </div>
              )}
              <button 
                onClick={() => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: defaultSettings.themeColors![themeEditorMode] } }))}
                className="w-full mt-3 p-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                Restore Defaults
              </button>
            </div>
          </div>

          <div className="pt-6 pb-2 text-center">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-widest uppercase">Prod v3.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

