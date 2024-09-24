import * as THREE from 'three';
import * as Tone from 'tone';

export default class TouchTheremin {
    constructor(cnvs) {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        this.canvas = cnvs;
        this.rows = isMobile ? 64 : 128;
        this.columns = isMobile ? 64 : 128;
        this.maxTouches = 10;
        this.animationFrameId = null;
        this.volumeLevel = -2;
        this.volumeNode = new Tone.Volume(this.volumeLevel).toDestination();
        this.effectInstances = {
            distortion: new Tone.Distortion(0.3).connect(this.volumeNode),
            delay: new Tone.FeedbackDelay(0.3, 0.4).connect(this.volumeNode),
            reverb: new Tone.Reverb(1.5).connect(this.volumeNode),
            chorus: new Tone.Chorus(2, 3, 0.7).connect(this.volumeNode)
        };
        this.activeEffectTypes = {
            distortion: false,
            delay: false,
            reverb: false,
            chorus: false
        };
        this.synths = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.grid = [];
        this.touchData = [];
        this.touchedCells = [];
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.init();
        this.addEventListeners();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            this.columns / -2, this.columns / 2,
            this.rows / 2, this.rows / -2,
            0.1, 1000
        );
        this.camera.position.z = 100;
        for (let i = 0; i < this.columns; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                const cell = this.createCell(i, j);
                this.grid[i][j] = cell;
                this.scene.add(cell);
            }
        }
        for (let i = 0; i < this.maxTouches; i++) {
            const synth = new Tone.Synth().connect(this.volumeNode);
            this.synths.push(synth);
        }
        this.animate();
    }

    setSynthType = (e) => {
        const type = e.target.value;
        const options = { };
        this.synths.forEach((synth, index) => this.stopSynth(index));
        this.synths.forEach((synth, index) => {
            synth.disconnect();
            let newSynth;
            switch (type) {
                case 'synth':
                    newSynth = new Tone.Synth(options).connect(this.volumeNode);
                    break;
                case 'am':
                    newSynth = new Tone.AMSynth(options).connect(this.volumeNode);
                    break;
                case 'fm':
                    newSynth = new Tone.FMSynth(options).connect(this.volumeNode);
                    break;
                case 'mono':
                    newSynth = new Tone.MonoSynth(options).connect(this.volumeNode);
                    break;
                case 'duo':
                    newSynth = new Tone.DuoSynth(options).connect(this.volumeNode);
                    break;
                case 'pluck':
                    newSynth = new Tone.PluckSynth(options).connect(this.volumeNode);
                    break;
                case 'membrane':
                    newSynth = new Tone.MembraneSynth(options).connect(this.volumeNode);
                    break;
                case 'metal':
                    newSynth = new Tone.MetalSynth(options).connect(this.volumeNode);
                    break;
                default:
                    console.warn(`Unsupported synth type: ${type}. Defaulting to Synth.`);
                    newSynth = new Tone.Synth(options).connect(this.volumeNode);
            }
            this.synths[index] = newSynth;
        });
        this.synths.forEach((synth, index) => this.stopSynth(index));
    }
    
    setOscillatorType(e) {
        let type = e.target.value || 'sine';
        this.synths.forEach((synth) => {
            if (synth.get().oscillator) {
                synth.set({ oscillator: { type } });
            } else {
                console.warn("Current synth doesn't support oscillator type change.");
            }
        });
    }

    setEnvelopeSettings(attack = null, decay = null, sustain = null, release = null) {
        this.synths.forEach((synth) => {
            if (attack === null && decay === null && sustain === null && release === null) {
                synth.set({
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
                });
            } else if (synth.get().envelope) {
                const currentEnvelope = synth.get().envelope;
                synth.set({
                    envelope: {
                        attack: attack !== null ? attack : currentEnvelope.attack,
                        decay: decay !== null ? decay : currentEnvelope.decay,
                        sustain: sustain !== null ? sustain : currentEnvelope.sustain,
                        release: release !== null ? release : currentEnvelope.release
                    }
                });
            } else {
                console.warn("Current synth doesn't support envelope settings.");
            }
        });
    }

    setEffects = (effects) => {
        effects.forEach((effect, index) => {
            switch (index) {
                case 0:
                    this.updateEffectState('distortion', effect.enabled, effect.amount, 'distortion');
                    break;
                case 1:
                    this.updateEffectState('delay', effect.enabled, { delayTime: effect.delayTime, feedback: effect.feedback }, 'delay');
                    break;
                case 2:
                    this.updateEffectState('reverb', effect.enabled, effect.decay, 'decay');
                    break;
                case 3:
                    this.updateEffectState('chorus', effect.enabled, { frequency: effect.frequency, delayTime: effect.delayTime, depth: effect.depth }, 'chorus');
                    break;
            }
        });
    }
    
    updateEffectState(effectType, enabled, params, paramKey) {
        if (enabled) {
            if (typeof params === 'object') {
                this.effectInstances[effectType].set(params);
            } else {
                this.effectInstances[effectType][paramKey] = parseFloat(params);
            }
            if (!this.activeEffectTypes[effectType]) {
                this.activeEffectTypes[effectType] = true;
                this.synths.forEach(synth => synth.connect(this.effectInstances[effectType]));
            }
        } else {
            if (this.activeEffectTypes[effectType]) {
                this.synths.forEach(synth => synth.disconnect(this.effectInstances[effectType]));
                this.activeEffectTypes[effectType] = false;
            }
        }
    }
    
    createCell(i, j) {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const cell = new THREE.Mesh(geometry, material);
        cell.position.set(i - this.columns / 2, j - this.rows / 2, 0);
        return cell;
    }

    clearTouches() {
        this.touchData = Array(this.maxTouches).fill(null);
    }

    addEventListeners() {
        this.canvas.addEventListener('touchstart', this.onTouchStart);
        this.canvas.addEventListener('touchmove', this.onTouchMove);
        this.canvas.addEventListener('touchend', this.onTouchEnd);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
    }

    onTouchStart(event) {
        event.preventDefault();
        this.handleTouches(event.touches);
    }

    onTouchMove(event) {
        event.preventDefault();
        this.handleTouches(event.touches);
    }

    onTouchEnd(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach((touch) => {
          const touchIndex = this.touchData.findIndex(data => data && data.identifier === touch.identifier);
          if (touchIndex !== -1) {
            this.stopSynth(touchIndex);
            this.touchData[touchIndex] = null;
          }
        });
        if (!this.touchData.some(data => data !== null)) {
          this.synths.forEach((synth, index) => {
            if (synth.isPlaying) {
              this.stopSynth(index);
            }
          });
        }
        this.touchedCells.forEach((cellKey) => {
          const [gridX, gridY] = cellKey.split('-').map(Number);
          this.fadeCell(gridX, gridY);
        });
        this.touchedCells = [];
    }

    onMouseDown(event) {
        event.preventDefault();
        this.handleTouches([event]);
    }

    onMouseMove(event) {
        if (event.buttons > 0) {
            this.handleTouches([event]);
        }
    }

    onMouseUp(event) {
        event.preventDefault();
        this.stopSynth(0);
        this.touchedCells.forEach((cellKey) => {
            const [gridX, gridY] = cellKey.split('-').map(Number);
            this.fadeCell(gridX, gridY);
        });
        this.clearTouches();
        this.touchedCells = [];
    }

    fadeCell(gridX, gridY) {
        const cell = this.grid[gridX][gridY];
        const fadeDuration = 200;
        const fadeStep = 20;
        const targetColor = new THREE.Color(0x000000);
        const initialColor = cell.material.color.clone();
        let elapsedTime = 0;
        const fadeInterval = setInterval(() => {
            elapsedTime += fadeStep;
            const factor = Math.min(elapsedTime / fadeDuration, 1);
            cell.material.color.lerpColors(initialColor, targetColor, factor);
            if (factor >= 1) {
                clearInterval(fadeInterval);
                cell.isAnimating = false;
            }
        }, fadeStep);
      }
    
    handleTouches(touches) {
        this.clearTouches();
        for (let i = 0; i < touches.length && i < this.maxTouches; i++) {
          const touch = touches[i];
          const { clientX, clientY } = touch;
          const canvasRect = this.canvas.getBoundingClientRect();
          const x = ((clientX - canvasRect.left) / canvasRect.width) * this.columns;
          const y = ((clientY - canvasRect.top) / canvasRect.height) * this.rows;
          const gridX = Math.floor(x);
          const gridY = Math.floor(this.rows - y);
          this.playSynth(i, gridX, gridY);
          this.touchData[i] = { gridX, gridY, identifier: touch.identifier };
          const cellKey = `${gridX}-${gridY}`;
          if (!this.touchedCells.includes(cellKey)) {
            this.touchedCells.push(cellKey);
          }
        }
    }

    playSynth(index, gridX, gridY) {
        if (gridX >= 0 && gridX < this.columns && gridY >= 0 && gridY < this.rows) {
            const frequency = this.calculateFrequency(gridX, gridY);
            if (!this.synths[index].isPlaying) {
                this.synths[index].triggerAttack(frequency);
                this.synths[index].isPlaying = true;
            } else {
                this.synths[index].frequency.value = frequency;
            }
            const color = this.frequencyToColor(frequency);
            this.grid[gridX][gridY].material.color.set(color);
            this.animateTouch(gridX, gridY);
        }
    }

    frequencyToColor(frequency) {
        const minFreq = 100;
        const maxFreq = 1100;
        const hue = ((frequency - minFreq) / (maxFreq - minFreq)) * 360;
        const color = new THREE.Color();
        color.setHSL(hue / 360, 1, 0.5);
        return color;
    }

    stopSynth(index) {
        if (this.synths[index].isPlaying) {
            this.synths[index].triggerRelease();
            this.synths[index].isPlaying = false;
        }
    }
    
    calculateFrequency(x, y) {
        const freqX = (x / this.columns) * 1000 + 100;
        const freqY = (y / this.rows) * 1000 + 100;
        return (freqX + freqY) / 2;
    }

    clearTouches() {
        this.touchData = Array(this.maxTouches).fill(null);
    }

    resetCellColor(gridX, gridY) {
        const cell = this.grid[gridX][gridY];
        const resetColor = 0x000000;
        cell.material.color.set(resetColor);
        cell.isAnimating = false;
    }

    animateTouch(gridX, gridY) {
        const cell = this.grid[gridX][gridY];
        if (cell.isAnimating) return;
        cell.isAnimating = true;
    }

    animate() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    destruct = () => {
        this.synths.forEach(synth => {
            synth.triggerRelease();
            synth.dispose()
        });
        this.synths = [];
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.grid.forEach(row => {
            row.forEach(cell => {
                if (cell.fadeInterval) {
                    clearInterval(cell.fadeInterval);
                }
            });
        });
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        this.canvas.removeEventListener('touchend', this.onTouchEnd);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.renderer.clear();
        this.renderer.dispose();
        this.scene = null;
        this.grid = [];
        this.camera = null;
        this.renderer = null;
    }
}
