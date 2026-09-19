import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerPhase, TimerStatus, Settings, SessionRecoveryState } from '../types';
import { playSound, initAudio } from '../utils/audio';
import { useSessionRecovery } from './useSessionRecovery';

export function useTimer(settings: Settings) {
  const [phase, setPhase] = useState<TimerPhase>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [currentTotalDuration, setCurrentTotalDuration] = useState(settings.workDuration * 60);
  
  const targetEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { saveSession, clearSession } = useSessionRecovery();

  // Sync initial time when settings change in idle state
  useEffect(() => {
    if (status === 'idle') {
      const duration = Math.max(1, settings.workDuration * 60);
      setTimeLeft(duration);
      setCurrentTotalDuration(duration);
      targetEndTimeRef.current = null;
      setPhase('work');
    }
  }, [settings.workDuration, status]);

  // Extract primitives for useCallback deps to prevent timer stalling
  const workDurationSecs = Math.max(1, settings.workDuration * 60);
  const breakDurationSecs = Math.max(1, settings.breakDuration * 60);
  const sound = settings.sound;
  const isMuted = settings.isMuted;

  const tick = useCallback(() => {
    if (!targetEndTimeRef.current) return;
    
    const now = Date.now();
    const remainingMs = targetEndTimeRef.current - now;
    
    if (remainingMs <= 0) {
      setTimeLeft(0);
      playSound(sound, isMuted);
      
      // Phase transition
      if (phase === 'work') {
        setPhase('break');
        setCurrentTotalDuration(breakDurationSecs);
        setTimeLeft(breakDurationSecs);
        targetEndTimeRef.current = Date.now() + (breakDurationSecs * 1000);
      } else {
        setPhase('work');
        setCurrentTotalDuration(workDurationSecs);
        setTimeLeft(workDurationSecs);
        targetEndTimeRef.current = Date.now() + (workDurationSecs * 1000);
      }
    } else {
      setTimeLeft(remainingMs / 1000);
    }
  }, [phase, workDurationSecs, breakDurationSecs, sound, isMuted]);

  useEffect(() => {
    if (status === 'running') {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + (timeLeft * 1000);
      }
      intervalRef.current = window.setInterval(tick, 100);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (status === 'paused') {
        targetEndTimeRef.current = null; // Clear target so it recalculates remaining when resumed
      }
    }
    
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [status, tick]);

  // Auto-save effect
  useEffect(() => {
    if (status !== 'idle') {
      saveSession({
        mode: 'prod',
        status: status,
        timeLeft: timeLeft,
        totalDuration: currentTotalDuration,
        phase: phase
      });
    }
  }, [status, timeLeft, phase, currentTotalDuration]);

  const toggleTimer = useCallback(() => {
    if (status === 'idle') {
      initAudio(); // Unlock audio context on user gesture
      setStatus('running');
    } else if (status === 'running') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('running');
    }
  }, [status]);

  const resetTimer = useCallback(() => {
    setStatus('idle');
    setPhase('work');
    targetEndTimeRef.current = null;
    const duration = Math.max(1, settings.workDuration * 60);
    setTimeLeft(duration);
    setCurrentTotalDuration(duration);
    clearSession();
  }, [settings.workDuration]);

  const restoreTimer = useCallback((state: SessionRecoveryState) => {
    setStatus('paused'); // Always restore as paused (frozen in time)
    setPhase(state.phase || 'work');
    setTimeLeft(state.timeLeft);
    setCurrentTotalDuration(state.totalDuration);
    targetEndTimeRef.current = null;
  }, []);

  return { phase, status, timeLeft, currentTotalDuration, toggleTimer, resetTimer, restoreTimer };
}
