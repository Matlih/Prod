export type Preset = '90/15' | '25/5' | 'custom' | string;
export type TimerPhase = 'idle' | 'work' | 'break' | 'paused';
export type AnimationStyle = '1' | '2' | '3' | '8';
export type SoundType = 'chime' | 'digital' | 'bowl';

export interface CustomPreset {
  id: string;
  name: string;
  workDuration: number;
  breakDuration: number;
}

export interface ThemePalette {
  workLabel: string;
  restLabel: string;
  workTimer: string;
  restTimer: string;
  workAnimation: string;
  restAnimation: string;
}

export interface ThemeColors {
  light: ThemePalette;
  dark: ThemePalette;
}

export interface Settings {
  preset: Preset;
  workDuration: number;
  breakDuration: number;
  isDarkMode: boolean;
  animationStyle: AnimationStyle;
  savedPresets?: Record<string, CustomPreset>;
  sound: SoundType;
  isMuted: boolean;
  themeColors?: ThemeColors;
}
