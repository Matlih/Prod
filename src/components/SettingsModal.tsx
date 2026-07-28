import React, { useState } from 'react';
import { X, Moon, Sun, Volume2, VolumeX, Bell, Zap, Waves } from 'lucide-react';
import { Settings, SoundType, CustomPreset, AnimationStyle, ThemePalette } from '../types';
import { playSound } from '../utils/audio';
import { defaultSettings } from '../hooks/useSettings';

interface SettingsModalProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onClose: () => void;
}

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

export const SettingsModal = ({ settings, setSettings, onClose }: SettingsModalProps) => {
  const [themeEditorMode, setThemeEditorMode] = useState<'light' | 'dark'>('dark');
  const [presetName, setPresetName] = useState('');
  const [presetWorkStr, setPresetWorkStr] = useState('60');
  const [presetBreakStr, setPresetBreakStr] = useState('10');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 text-neutral-900 dark:text-neutral-50">
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative max-h-[85vh] overflow-y-auto">
        <button 
          onClick={onClose}
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

          {/* Presets */}
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

          {/* Theme Colors - DRY REFACTOR */}
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
              <ColorPickerRow label="Deep Work Label" value={settings.themeColors?.[themeEditorMode]?.workLabel || ''} onChange={(val) => updateThemeColor('workLabel', val)} />
              <ColorPickerRow label="Rest Label" value={settings.themeColors?.[themeEditorMode]?.restLabel || ''} onChange={(val) => updateThemeColor('restLabel', val)} />
              <ColorPickerRow label="Work Timer" value={settings.themeColors?.[themeEditorMode]?.workTimer || ''} onChange={(val) => updateThemeColor('workTimer', val)} />
              <ColorPickerRow label="Rest Timer" value={settings.themeColors?.[themeEditorMode]?.restTimer || ''} onChange={(val) => updateThemeColor('restTimer', val)} />
              <ColorPickerRow label="Work Animation" value={settings.themeColors?.[themeEditorMode]?.workAnimation || ''} onChange={(val) => updateThemeColor('workAnimation', val)} />
              <ColorPickerRow label="Rest Animation" value={settings.themeColors?.[themeEditorMode]?.restAnimation || ''} onChange={(val) => updateThemeColor('restAnimation', val)} />
              <button 
                onClick={() => setSettings(s => ({ ...s, themeColors: { ...s.themeColors!, [themeEditorMode]: defaultSettings.themeColors![themeEditorMode] } }))}
                className="w-full mt-3 p-2 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                Restore Defaults
              </button>
            </div>
          </div>

          <div className="pt-6 pb-2 text-center">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium tracking-widest uppercase">Prod v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
