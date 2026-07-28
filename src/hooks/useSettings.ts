import { useState, useEffect } from 'react';
import { Settings } from '../types';

export const defaultSettings: Settings = {
  preset: '90/15',
  workDuration: 90,
  breakDuration: 15,
  isDarkMode: true,
  animationStyle: '1',
  savedPresets: {},
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('prod-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle migration from Array to Map for savedPresets
        let migratedPresets = parsed.savedPresets || {};
        if (Array.isArray(parsed.savedPresets)) {
          migratedPresets = {};
          parsed.savedPresets.forEach((p: any) => {
            if (p.id) migratedPresets[p.id] = p;
          });
        }
        return { 
          ...defaultSettings, 
          ...parsed,
          savedPresets: migratedPresets,
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
