import React, { useState } from 'react';
import { RotateCcw, Pin, Settings as SettingsIcon } from 'lucide-react';

interface ControlsDockProps {
  onReset: () => void;
  onSettingsClick: () => void;
}

// Module-level cache for dynamic import to prevent Promise spam
let tauriWindowApi: any = null;

export const ControlsDock = ({ onReset, onSettingsClick }: ControlsDockProps) => {
  const [isPinned, setIsPinned] = useState(false);

  const togglePip = async () => {
    try {
      if (window.__TAURI__) {
        if (!tauriWindowApi) {
          tauriWindowApi = await import('@tauri-apps/api/window');
        }
        const nextState = !isPinned;
        await tauriWindowApi.appWindow.setAlwaysOnTop(nextState);
        setIsPinned(nextState);
      } else {
        alert('Pin to screen is only available in the desktop app.');
      }
    } catch (e) {
      console.warn('Tauri API not available (running in browser?)', e);
    }
  };

  return (
    <div className="mt-[4vmin] md:mt-8 flex items-center gap-[clamp(8px,4vmin,16px)] opacity-15 hover:opacity-100 transition-opacity duration-300 text-neutral-900 dark:text-neutral-50 pointer-events-auto">
      <button 
        onClick={(e) => { e.stopPropagation(); onReset(); }} 
        title="Reset Timer" 
        className="p-[clamp(6px,3vmin,12px)] rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition flex items-center justify-center"
      >
        <RotateCcw className="w-[clamp(12px,6vmin,20px)] h-[clamp(12px,6vmin,20px)]" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); togglePip(); }} 
        title={isPinned ? "Unpin from screen" : "Pin to screen"} 
        className={`p-[clamp(6px,3vmin,12px)] rounded-full transition flex items-center justify-center ${isPinned ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
      >
        <Pin className="w-[clamp(12px,6vmin,20px)] h-[clamp(12px,6vmin,20px)]" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onSettingsClick(); }} 
        title="Settings" 
        className="p-[clamp(6px,3vmin,12px)] rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition flex items-center justify-center"
      >
        <SettingsIcon className="w-[clamp(12px,6vmin,20px)] h-[clamp(12px,6vmin,20px)]" />
      </button>
    </div>
  );
};
