import { SessionRecoveryState } from '../types';

const STORAGE_KEY = 'prod-recovery';

export function useSessionRecovery() {
  const saveSession = (state: SessionRecoveryState) => {
    // Only save running or paused sessions. Don't save idle sessions.
    if (state.status === 'idle') {
      clearSession();
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save recovery session", e);
    }
  };

  const loadSession = (): SessionRecoveryState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SessionRecoveryState;
      }
    } catch (e) {
      console.warn("Failed to load recovery session", e);
    }
    return null;
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear recovery session", e);
    }
  };

  return { saveSession, loadSession, clearSession };
}
