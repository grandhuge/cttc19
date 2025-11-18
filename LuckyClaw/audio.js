// (v24) Audio Engine Module

export class AudioEngine {
    constructor(settingsRef) {
        this.settings = settingsRef; 
        
        this.audioCtx = null;
        this.masterGain = null; 
        this.bgmGain = null;
        this.sfxGain = null;
        this.isUnlocked = false;
        this.isMuted = false; 
        this.bgmNodes = []; 
        this.bgmLoopTimer = null; 
        
        // (v24) DOM elements are now passed in, not queried here
        this.dom = {};
    }
    
    // (v24) New method to link DOM elements
    linkDOMElements(dom) {
        this.dom = {
            iconUnmuted: dom.iconUnmuted,
            iconMuted: dom.iconMuted,
            toggleSoundBgm: dom.toggleSoundBgm,
            toggleSoundSfx: dom.toggleSoundSfx
        };
    }

    unlock() {
        if (this.isUnlocked || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.isUnlocked = true;
        this.startBGM();
        console.log("Audio Unlocked");
    }

    init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);
            
            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.connect(this.masterGain); 
            
            this.bgmGain = this.audioCtx.createGain();
            this.bgmGain.connect(this.masterGain); 
            
            console.log("AudioEngine Initialized");
            return true;
        } catch (e) {
            console.error("Web Audio API not supported", e);
            return false;
        }
    }

    startBGM() {
        if (!this.audioCtx || !this.settings.bgm || this.bgmNodes.length > 0) return;
        if (!this.isUnlocked) return; 

        const notes = [130.81, 155.56, 196.00, 155.56]; // C3, Eb3, G3, Eb3
        let noteIndex = 0;
        const noteDuration = 0.25; 

        const playNote = () => {
            if (!this.settings.bgm) { 
                this.stopBGM();
                return;
            }

            const note = notes[noteIndex % notes.length];
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(this.bgmGain);
            
            osc.type = 'triangle'; 
            osc.frequency.value = note;
            
            const now = this.audioCtx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + noteDuration * 0.1); // Fade in
            gain.gain.linearRampToValueAtTime(0, now + noteDuration); // Fade out

            osc.start(now);
            osc.stop(now + noteDuration);
            
            this.bgmNodes.push(osc); 
            
            noteIndex++;
            
            if (this.bgmNodes.length > 20) {
                this.bgmNodes.shift();
            }

            this.bgmLoopTimer = setTimeout(playNote, noteDuration * 1000);
        };

        playNote();
        this.setBGMVolume(0.2); 
    }
    
    stopBGM() {
        if (this.bgmLoopTimer) {
            clearTimeout(this.bgmLoopTimer); 
            this.bgmLoopTimer = null;
        }
        this.bgmNodes.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.bgmNodes = []; 
        this.setBGMVolume(0); 
    }

    toggleMute(forceState = null) {
        if (!this.audioCtx) return;
        
        this.isMuted = (forceState !== null) ? forceState : !this.isMuted;
        
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioCtx.currentTime);
        
        this.dom.iconUnmuted.classList.toggle('hidden', this.isMuted);
        this.dom.iconMuted.classList.toggle('hidden', !this.isMuted);
        
        if (this.isMuted) {
            this.dom.toggleSoundBgm.checked = false;
            this.dom.toggleSoundSfx.checked = false;
            this.settings.bgm = false;
            this.settings.sfx = false;
            this.stopBGM();
            this.setSFXVolume(0);
        } else if (!this.isMuted && this.settings.bgm) { 
             this.startBGM();
        }

        return this.isMuted;
    }

    setBGMVolume(level) {
        if (!this.audioCtx || !this.bgmGain) return;
        if (!this.settings.bgm) level = 0;
        
        const targetLevel = (level <= 0) ? 0.0001 : level;
        this.bgmGain.gain.exponentialRampToValueAtTime(targetLevel, this.audioCtx.currentTime + 0.5);
    }
    
    setSFXVolume(level) {
         if (!this.audioCtx || !this.sfxGain) return;
         this.sfxGain.gain.value = level;
    }

    play(soundName) {
        if (!this.isUnlocked || !this.settings.sfx || !this.audioCtx) return;
        
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        switch(soundName) {
            case 'coin_insert': 
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            
            case 'button_press': 
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            
            case 'grab_engage': 
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'claw_impact': 
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.5, now); // Loud!
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
                
            case 'claw_fail': 
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'shuffle':
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.2, now);
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'fanfare': 
                const freqs = [523, 659, 783, 1046]; // C5, E5, G5, C6
                freqs.forEach((freq, i) => {
                    const o = this.audioCtx.createOscillator();
                    const g = this.audioCtx.createGain();
                    o.connect(g);
                    g.connect(this.sfxGain);
                    o.type = 'square';
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.2, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                    o.start(now + i * 0.1);
                    o.stop(now + i * 0.1 + 0.2);
                });
                break;
        }
    }
    
    loops = {};
    playLoop(soundName) {
        if (!this.isUnlocked || !this.settings.sfx || this.loops[soundName] || !this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (soundName === 'claw_move') {
            osc.type = 'sawtooth';
            osc.frequency.value = 80;
            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 0.1);
            osc.start();
            this.loops[soundName] = { osc, gain };
        }
    }
    
    stopLoop(soundName) {
        if (!this.isUnlocked || !this.loops[soundName] || !this.audioCtx) return;
        
        const { osc, gain } = this.loops[soundName];
        const now = this.audioCtx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.stop(now + 0.2);
        delete this.loops[soundName];
    }
}