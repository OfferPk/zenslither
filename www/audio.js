/**
 * ZenSlither - Procedural Japanese Silk & Koto Acoustic Sound Synthesizer
 * Pure Web Audio API - Zero External Audio Files
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('zenslither_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('zenslither_sound', String(this.enabled));
    } catch (e) {}
  }

  toggleSound() {
    this.enabled = !this.enabled;
    this.saveSettings();
    if (this.enabled) {
      this.playTap();
    }
    return this.enabled;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Resonant Japanese Koto string pluck when placing a loop line
   */
  playLine() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Pentatonic note selection: D4, F4, G4, A4, C5
    const freqs = [293.66, 349.23, 392.00, 440.00, 523.25];
    const baseFreq = freqs[Math.floor(Math.random() * freqs.length)];

    // Fundamental silk string
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, t);

    gain1.gain.setValueAtTime(0.28, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Harmonic shimmer (2nd harmonic)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2, t);

    gain2.gain.setValueAtTime(0.12, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.15);
  }

  /**
   * Crisp dry bamboo tick when placing an 'x' cross
   */
  playCross() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Soft clear / erase tap
   */
  playClear() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.05);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Simple UI tap
   */
  playTap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Gentle chime when a cell clue becomes satisfied
   */
  playClueChime() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [659.25, 880.0]; // E5, A5 chime

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);

      gain.gain.setValueAtTime(0.16, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.28);
    });
  }

  /**
   * Celebratory Japanese pentatonic victory arpeggio on loop completion
   */
  playVictory() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Traditional Insen / Hirajoshi pentatonic flourish
    const notes = [
      293.66, // D4
      329.63, // E4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00  // A5
    ];

    const t = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.24, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.6);
    });
  }
}

const sounds = new SoundManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager, sounds };
}
