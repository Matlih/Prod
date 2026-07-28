import { SoundType } from '../types';

let globalAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export function initAudio() {
  try {
    getAudioContext();
  } catch (e) {
    // Ignore error if audio isn't supported
  }
}

export function playSound(type: SoundType, isMuted: boolean) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
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
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
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
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
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
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
  } catch (e) {
    console.error("Audio not supported or blocked");
  }
}
