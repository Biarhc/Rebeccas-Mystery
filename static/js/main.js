/**
 * Audio Synthesis Manager
 * Generates custom atmospheric melodic tones, typewriter clicks, and rewind sound fx without copyrighted assets
 */
class SynthesizedAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.initialized = true;
      }
    }
  }

  playBlipSound() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320 + Math.random() * 40, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  playChoiceSound() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playInspectSound() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.2); // E5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playGlitchSound() {
    if (!this.ctx) return;
    try {
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? "sawtooth" : "sine";
        osc.frequency.setValueAtTime(800 - i * 150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 1.8);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.0);
      }
    } catch (e) {}
  }

  /* Sons ambientes procedurais da Saint Claire (vento suave e sino misterioso) */
  playTitleChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Acorde suave místico em E menor (E4, G4, B4, D5) com harmônicos puros
      const freqs = [329.63, 392.00, 493.88, 587.33];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
        
        const startTime = this.ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 3.0);
      });
    } catch (e) {}
  }

  startAmbience() {
    if (!this.ctx || this.isMuted || this.ambienceRunning) return;
    try {
      this.ambienceRunning = true;
      // Gerador de ruído rosa suave para vento nos corredores
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.025;
      }

      this.whiteNoise = this.ctx.createBufferSource();
      this.whiteNoise.buffer = noiseBuffer;
      this.whiteNoise.loop = true;

      // Filtro passa-baixa para o som ficar como vento aconchegante e distante
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.ambienceGain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 3);

      this.whiteNoise.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);
      this.whiteNoise.start();
    } catch (e) {}
  }

  stopAmbience() {
    if (this.ambienceGain && this.ctx) {
      try {
        this.ambienceGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (this.whiteNoise) {
            this.whiteNoise.stop();
            this.whiteNoise.disconnect();
          }
          this.ambienceRunning = false;
        }, 900);
      } catch (e) {}
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbience();
    } else {
      this.startAmbience();
    }
    return this.isMuted;
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", async () => {
  const audioManager = new SynthesizedAudio();
  
  // Enable Audio Context on first user click
  const unlockAudio = () => {
    audioManager.init();
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio);
  window.addEventListener("keydown", unlockAudio);

  const game = new window.GameController();
  game.audio = audioManager;
  window.gameInstance = game;
  await game.init();
});
