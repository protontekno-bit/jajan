/**
 * @fileoverview Web Audio API Synthesizer for Kitchen & Admin Order Alerts
 * Generates an authentic, crisp restaurant order chime directly via native browser
 * audio oscillators without relying on external MP3 downloads.
 */

let sharedAudioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

/**
 * Pre-unlocks audio context on initial user interaction (click/touch).
 */
export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

/**
 * Plays a clear 4-tone ascending bell chime: C5 -> E5 -> G5 -> C6
 * Designed for restaurant kitchen & cashier environments.
 * @returns {boolean} True if played successfully
 */
export const playNewOrderChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    const now = ctx.currentTime;
    // Harmonious melody notes in Hz (C5, E5, G5, C6)
    const notes = [
      { freq: 523.25, time: now + 0.0, dur: 0.35, gain: 0.35 },
      { freq: 659.25, time: now + 0.12, dur: 0.4, gain: 0.4 },
      { freq: 783.99, time: now + 0.24, dur: 0.45, gain: 0.45 },
      { freq: 1046.5, time: now + 0.38, dur: 0.8, gain: 0.5 },
    ];

    notes.forEach(({ freq, time, dur, gain: noteGain }) => {
      // Primary chime tone
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // Crisp yet warm bell tone
      osc.frequency.setValueAtTime(freq, time);

      // Bell envelope (quick attack, natural logarithmic decay)
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(noteGain, time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);

      // Subtle high harmonic for metallic resonance
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(freq * 2, time);

      harmonicGain.gain.setValueAtTime(0.001, time);
      harmonicGain.gain.linearRampToValueAtTime(noteGain * 0.2, time + 0.01);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.6);

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      harmonicOsc.start(time);
      harmonicOsc.stop(time + dur * 0.6);
    });

    return true;
  } catch (err) {
    console.warn('Audio chime notification failed:', err);
    return false;
  }
};
