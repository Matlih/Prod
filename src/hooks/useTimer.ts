import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerPhase, Settings } from '../types';
import { playSound } from '../utils/audio';

export function useTimer(settings: Settings) {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  
  const targetEndTimeRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<TimerPhase>('idle');
  const intervalRef = useRef<number | null>(null);

  // Sync initial time when settings change in idle state
  useEffect(() => {
    if (phase === 'idle') {
      setTimeLeft(settings.workDuration * 60);
      targetEndTimeRef.current = null;
    }
  }, [settings.workDuration, phase]);

  const tick = useCallback(() => {
    if (!targetEndTimeRef.current) return;
    
    const now = Date.now();
    const remainingMs = targetEndTimeRef.current - now;
    
    if (remainingMs <= 0) {
      setTimeLeft(0);
      playSound(settings.sound, settings.isMuted);
      
      // Phase transition
      if (phase === 'work') {
        setPhase('break');
        const duration = settings.breakDuration * 60;
        setTimeLeft(duration);
        targetEndTimeRef.current = Date.now() + (duration * 1000);
      } else if (phase === 'break') {
        setPhase('work');
        const duration = settings.workDuration * 60;
        setTimeLeft(duration);
        targetEndTimeRef.current = Date.now() + (duration * 1000);
      }
    } else {
      setTimeLeft(Math.ceil(remainingMs / 1000));
    }
  }, [phase, settings]);

  useEffect(() => {
    if (phase === 'work' || phase === 'break') {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + (timeLeft * 1000);
      }
      intervalRef.current = window.setInterval(tick, 100); // 100ms for fast UI responsiveness when unminimizing
    } else {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      if (phase === 'paused') {
        targetEndTimeRef.current = null; // Clear target so it recalculates remaining when resumed
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
      prevPhaseRef.current = phase;
      setPhase('paused');
    } else if (phase === 'paused') {
      setPhase(prevPhaseRef.current);
    }
  };

  const resetTimer = () => {
    setPhase('idle');
    targetEndTimeRef.current = null;
    setTimeLeft(settings.workDuration * 60);
  };

  return { phase, timeLeft, toggleTimer, resetTimer };
}
