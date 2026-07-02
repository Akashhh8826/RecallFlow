/**
 * RecallFlow Web Audio API Sound System
 * Synthesizes high-quality audio effects (UI clicks, task completions, chimes)
 * and ambient study soundscapes (Rainfall, Forest Wind, Binaural Beats, Deep Brown Noise)
 * entirely client-side without external asset dependencies.
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.globalVolume = 0.5;
        this.isMuted = false;
        
        // Ambient Soundscape state
        this.activeSoundscape = null; // 'rain' | 'wind' | 'beats' | 'noise'
        this.ambientGainNode = null;
        this.soundscapeNodes = [];
        this.isPlayingAmbient = false;
        this.ambientVolume = 0.4;

        // Ticking state
        this.isTickingEnabled = false;
        this.tickOscillator = null;

        // Auto-initialize on first user interaction
        this.bindInteractionInit();
    }

    initContext() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : this.globalVolume;
            this.masterGain.connect(this.ctx.destination);

            // Initialize ambient gain node
            this.ambientGainNode = this.ctx.createGain();
            this.ambientGainNode.gain.value = this.ambientVolume;
            this.ambientGainNode.connect(this.masterGain);
        } catch (e) {
            console.error("Web Audio Context could not start", e);
        }
    }

    bindInteractionInit() {
        const initTrigger = () => {
            this.initContext();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        // Listen to common user inputs to warm up context
        ['click', 'keydown', 'touchstart', 'mouseover'].forEach(evt => {
            document.addEventListener(evt, initTrigger, { once: true, passive: true });
        });
    }

    setMuted(mute) {
        this.isMuted = mute;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(mute ? 0 : this.globalVolume, this.ctx?.currentTime || 0);
        }
    }

    setGlobalVolume(vol) {
        this.globalVolume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.globalVolume, this.ctx?.currentTime || 0);
        }
    }

    setAmbientVolume(vol) {
        this.ambientVolume = Math.max(0, Math.min(1, vol));
        if (this.ambientGainNode) {
            this.ambientGainNode.gain.setValueAtTime(this.ambientVolume, this.ctx?.currentTime || 0);
        }
    }

    // --- Synthesized SFX ---

    // Subtle modern click sound
    playClick() {
        this.initContext();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Pleasant card flipping sound
    playFlip() {
        this.initContext();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Satisfying check ding sound
    playCheck() {
        this.initContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        
        // Bell sound - pure sine with high harmonic content and delay
        const playTine = (freq, delay, dur, vol) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(vol, now + delay + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
            
            osc.start(now + delay);
            osc.stop(now + delay + dur);
        };

        playTine(987.77, 0, 0.35, 0.15); // B5
        playTine(1318.51, 0.05, 0.45, 0.1); // E6
    }

    // Beautiful accomplishment arpeggio (Quiz/Deck/Pomo Done)
    playSuccessChime() {
        this.initContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major chord)

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
            
            gain.gain.setValueAtTime(0, now + (idx * 0.08));
            gain.gain.linearRampToValueAtTime(0.15, now + (idx * 0.08) + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.08) + 0.5);
            
            osc.start(now + (idx * 0.08));
            osc.stop(now + (idx * 0.08) + 0.6);
        });
    }

    // Gentle focus alarm chimes
    playAlarmSound() {
        this.initContext();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const playBeep = (time) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
            
            osc.start(time);
            osc.stop(time + 0.5);
        };

        playBeep(now);
        playBeep(now + 0.5);
        playBeep(now + 1.0);
    }

    // Ticking metronome sound for timer
    playTimerTick() {
        this.initContext();
        if (!this.ctx || this.isMuted || !this.isTickingEnabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.015);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.025);
    }

    // --- Synthesized Ambient Generators ---

    // Noise buffer helper
    createNoiseBuffer(type) {
        if (!this.ctx) return null;
        const sampleRate = this.ctx.sampleRate;
        const bufferSize = 2 * sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'white') {
                output[i] = white;
            } else if (type === 'pink') {
                // Pink approximation (Pink noise filter roll-off)
                output[i] = (lastOut + (0.12 * white)) / 1.12;
                lastOut = output[i];
                output[i] *= 3.5;
            } else if (type === 'brown') {
                // Brown noise: cumulative integration
                output[i] = (lastOut + (0.025 * white)) / 1.025;
                lastOut = output[i];
                output[i] *= 5.0; // scale up volume
            }
        }
        return noiseBuffer;
    }

    // Stop currently running ambient loop nodes
    stopAmbient() {
        this.soundscapeNodes.forEach(node => {
            try { node.stop(); } catch (e) {}
        });
        this.soundscapeNodes = [];
        this.isPlayingAmbient = false;
        this.activeSoundscape = null;
    }

    // Play selected ambient soundscape
    playAmbient(type) {
        this.initContext();
        if (!this.ctx) return;

        this.stopAmbient();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.activeSoundscape = type;
        this.isPlayingAmbient = true;

        if (type === 'rain') {
            this.startRainSynth();
        } else if (type === 'wind') {
            this.startWindSynth();
        } else if (type === 'beats') {
            this.startBinauralBeats();
        } else if (type === 'noise') {
            this.startBrownNoise();
        }
    }

    // Rainfall Audio Synthesis
    startRainSynth() {
        const brownBuffer = this.createNoiseBuffer('brown');
        const whiteBuffer = this.createNoiseBuffer('white');
        if (!brownBuffer || !whiteBuffer) return;

        // Constant deep rumbling rain background
        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = brownBuffer;
        rainSource.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.value = 650;

        const rainGain = this.ctx.createGain();
        rainGain.gain.value = 0.95;

        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(this.ambientGainNode);

        // High frequency pitter-patter crackle sounds
        const crackleSource = this.ctx.createBufferSource();
        crackleSource.buffer = whiteBuffer;
        crackleSource.loop = true;

        const crackleFilter = this.ctx.createBiquadFilter();
        crackleFilter.type = 'bandpass';
        crackleFilter.frequency.value = 2200;
        crackleFilter.Q.value = 4.0;

        const crackleGain = this.ctx.createGain();
        crackleGain.gain.value = 0.08;

        crackleSource.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(this.ambientGainNode);

        // Periodically modulate crackle volume slightly to simulate varying rain density
        const rainModulator = this.ctx.createOscillator();
        rainModulator.frequency.value = 0.15; // Slow modulation (6s cycle)
        const modulatorGain = this.ctx.createGain();
        modulatorGain.gain.value = 0.04;

        rainModulator.connect(modulatorGain);
        modulatorGain.connect(crackleGain.gain);

        rainSource.start(0);
        crackleSource.start(0);
        rainModulator.start(0);

        this.soundscapeNodes.push(rainSource, crackleSource, rainModulator);
    }

    // Forest Wind & Soft Breeze Audio Synthesis
    startWindSynth() {
        const pinkBuffer = this.createNoiseBuffer('pink');
        if (!pinkBuffer) return;

        const windSource = this.ctx.createBufferSource();
        windSource.buffer = pinkBuffer;
        windSource.loop = true;

        // Bandpass filter to create resonant wind howling
        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 350;
        windFilter.Q.value = 2.5;

        const windGain = this.ctx.createGain();
        windGain.gain.value = 1.0;

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.ambientGainNode);

        // Slow LFO to sweep wind pitch/frequency (simulate gusting wind)
        const gustLfo = this.ctx.createOscillator();
        gustLfo.frequency.value = 0.08; // Very slow (12s cycle)
        
        const gustGain = this.ctx.createGain();
        gustGain.gain.value = 180; // modulate filter pitch by +/- 180 Hz

        gustLfo.connect(gustGain);
        gustGain.connect(windFilter.frequency);

        // Another slow LFO for volume modulation
        const volLfo = this.ctx.createOscillator();
        volLfo.frequency.value = 0.12; // 8s cycle
        
        const volLfoGain = this.ctx.createGain();
        volLfoGain.gain.value = 0.25;

        volLfo.connect(volLfoGain);
        volLfoGain.connect(windGain.gain);

        windSource.start(0);
        gustLfo.start(0);
        volLfo.start(0);

        this.soundscapeNodes.push(windSource, gustLfo, volLfo);
    }

    // Binaural Beats Alpha Wave Generation (Stereo split)
    startBinauralBeats() {
        // Binaural beats require two separate sound sources mapped to Left and Right channels
        const leftOsc = this.ctx.createOscillator();
        const rightOsc = this.ctx.createOscillator();
        
        leftOsc.type = 'sine';
        rightOsc.type = 'sine';

        // Frequency difference creates a 6 Hz Theta / Alpha boundary beat (ideal for learning/memory)
        leftOsc.frequency.value = 150;  // Left ear receives 150 Hz
        rightOsc.frequency.value = 156; // Right ear receives 156 Hz

        const leftGain = this.ctx.createGain();
        const rightGain = this.ctx.createGain();
        leftGain.gain.value = 0.6;
        rightGain.gain.value = 0.6;

        // Channel merger node
        const merger = this.ctx.createChannelMerger(2);

        leftOsc.connect(leftGain);
        rightOsc.connect(rightGain);

        leftGain.connect(merger, 0, 0);  // connect leftGain output 0 to merger input 0 (Left channel)
        rightGain.connect(merger, 0, 1); // connect rightGain output 0 to merger input 1 (Right channel)

        merger.connect(this.ambientGainNode);

        // Soft sub-bass brown noise layer to mask ambient distractions and warm up beats
        const noiseBuffer = this.createNoiseBuffer('brown');
        let subSource = null;
        if (noiseBuffer) {
            subSource = this.ctx.createBufferSource();
            subSource.buffer = noiseBuffer;
            subSource.loop = true;

            const subFilter = this.ctx.createBiquadFilter();
            subFilter.type = 'lowpass';
            subFilter.frequency.value = 120; // Only low rumble

            const subGain = this.ctx.createGain();
            subGain.gain.value = 0.8;

            subSource.connect(subFilter);
            subFilter.connect(subGain);
            subGain.connect(this.ambientGainNode);

            subSource.start(0);
            this.soundscapeNodes.push(subSource);
        }

        leftOsc.start(0);
        rightOsc.start(0);

        this.soundscapeNodes.push(leftOsc, rightOsc);
    }

    // Pure Deep Brown Noise Loop
    startBrownNoise() {
        const brownBuffer = this.createNoiseBuffer('brown');
        if (!brownBuffer) return;

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = brownBuffer;
        noiseSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;

        noiseSource.connect(filter);
        filter.connect(this.ambientGainNode);

        noiseSource.start(0);
        this.soundscapeNodes.push(noiseSource);
    }
}

// Global Instantiate
window.audioManager = new AudioManager();
