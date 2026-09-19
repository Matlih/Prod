import { useState, useEffect, useRef, useCallback } from 'react';
import { SoundType, TimerStatus, SessionRecoveryState } from '../types';
import { playSound, initAudio } from '../utils/audio';
import { useSessionRecovery } from './useSessionRecovery';

export function useCountdown(totalSeconds: number, sound: SoundType, isMuted: boolean) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(Math.max(1, totalSeconds));
  const targetEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { saveSession, clearSession } = useSessionRecovery();

  useEffect(() => {
    if (status === 'idle') {
      const durationSecs = Math.max(1, totalSeconds);
      setTimeLeft(durationSecs);
      targetEndTimeRef.current = null;
    }
  }, [totalSeconds, status]);

  const tick = useCallback(() => {
    if (!targetEndTimeRef.current) return;
    const now = Date.now();
    const remainingMs = targetEndTimeRef.current - now;

    if (remainingMs <= 0) {
      setTimeLeft(0);
      setStatus('idle');
      targetEndTimeRef.current = null;
      playSound(sound, isMuted);
    } else {
      setTimeLeft(remainingMs / 1000);
    }
  }, [sound, isMuted]);

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
        targetEndTimeRef.current = null;
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
        mode: 'countdown',
        status: status,
        timeLeft: timeLeft,
        totalDuration: totalSeconds
      });
    }
  }, [status, timeLeft, totalSeconds]);

  const toggleCountdown = useCallback(() => {
    if (status === 'idle') {
      initAudio();
      setStatus('running');
    } else if (status === 'running') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('running');
    }
  }, [status]);

  const resetCountdown = useCallback(() => {
    setStatus('idle');
    targetEndTimeRef.current = null;
    setTimeLeft(Math.max(1, totalSeconds));
    clearSession();
  }, [totalSeconds]);

  const restoreCountdown = useCallback((state: SessionRecoveryState) => {
    setStatus('paused'); // Always restore as paused
    setTimeLeft(state.timeLeft);
    targetEndTimeRef.current = null;
  }, []);

  return { status, timeLeft, toggleCountdown, resetCountdown, restoreCountdown };
}
