
export class AudioController {
  private static ctx: AudioContext | null = null;
  private static ufoOsc: OscillatorNode | null = null;
  private static ufoLfo: OscillatorNode | null = null;

  static init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  static playGrab() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  static playSuccess() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(880, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  static playMistake() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  static startUfoLoop() {
    this.init();
    if (!this.ctx || this.ufoOsc) return;

    // FM Synthesis for warbly sci-fi sound
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();

    modulator.frequency.value = 8; // Warble speed
    modGain.gain.value = 100; // Depth

    carrier.frequency.value = 200; // Base pitch

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    mainGain.gain.value = 0.025; // Background volume

    carrier.start();
    modulator.start();

    this.ufoOsc = carrier;
    this.ufoLfo = modulator;
  }

  static stopUfoLoop() {
    if (this.ufoOsc) {
        try {
            this.ufoOsc.stop();
            this.ufoOsc.disconnect();
        } catch(e) {}
        this.ufoOsc = null;
    }
    if (this.ufoLfo) {
        try {
            this.ufoLfo.stop();
            this.ufoLfo.disconnect();
        } catch(e) {}
        this.ufoLfo = null;
    }
  }
}
