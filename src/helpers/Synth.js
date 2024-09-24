import * as THREE from 'three';
import * as Tone from 'tone';

export default class Synth {
  constructor(canvas, numOctaves = 2) {
    this.canvas = canvas;
    this.numOctaves = numOctaves;
    this.baseOctave = 4;
    this.animationFrameId = null;
    this.volumeLevel = -2;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, canvas.clientWidth, 0, canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.volumeNode = new Tone.Volume(this.volumeLevel).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.volumeNode);
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
    this.keys = [];
    this.activeKeys = new Set();
    this.activeTouches = new Map();
    this.currentMouseKey = null;
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundOnWindowResize = this.onWindowResize.bind(this);
    this.init();
    this.midiInputs = new Map();
    this.midiOutput = null;
    this.midiEnabled = false;
    this.initMIDI();
  }

  init() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.scene.background = new THREE.Color(0x111111);
    this.camera.position.z = 1;
    this.createKeys();
    this.addEventListeners();
    this.animate();
  }

  createKeys() {
    this.scene.clear();
    this.keys = [];
    const totalWhiteKeys = this.numOctaves * 7;
    const keySpacing = 3;
    const whiteKeyWidth = (this.canvas.clientWidth - (totalWhiteKeys - 1) * keySpacing) / totalWhiteKeys;
    const blackKeyWidth = whiteKeyWidth * 0.65;
    const whiteKeyHeight = this.canvas.clientHeight;
    const blackKeyHeight = this.canvas.clientHeight * 0.45;
    const createRoundedRectShape = (width, height, radius) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0, height - radius);
      shape.quadraticCurveTo(0, height, radius, height);
      shape.lineTo(width - radius, height);
      shape.quadraticCurveTo(width, height, width, height - radius);
      shape.lineTo(width, 0);
      shape.lineTo(0, 0);
      return shape;
    };
    const whiteKeyShape = createRoundedRectShape(whiteKeyWidth, whiteKeyHeight, 3);
    const blackKeyShape = createRoundedRectShape(blackKeyWidth, blackKeyHeight, 20);
    const notesInOctave = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const whiteKeyIndices = [0, 2, 4, 5, 7, 9, 11];
    for (let octave = 0; octave < this.numOctaves; octave++) {
      for (let i = 0; i < 12; i++) {
        const isBlackKey = notesInOctave[i].includes('#');
        const keyShape = isBlackKey ? blackKeyShape : whiteKeyShape;
        const keyHeight = isBlackKey ? blackKeyHeight : whiteKeyHeight;
        const keyWidth = isBlackKey ? blackKeyWidth : whiteKeyWidth;
        const material = new THREE.MeshBasicMaterial({
          color: isBlackKey ? 0x333333 : 0x333333,
          side: THREE.DoubleSide
        });
        const key = new THREE.Mesh(new THREE.ShapeGeometry(keyShape), material);
        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ShapeGeometry(keyShape)), outlineMaterial);

        // const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        // const edges = new THREE.EdgesGeometry(new THREE.ShapeGeometry(keyShape));
        // const outline = new THREE.LineSegments(edges, outlineMaterial);
        // outline.scale.set(1.01, 1.01, 1);
        key.add(outline);
        let x;
        if (isBlackKey) {
          const prevWhiteKeyIndex = whiteKeyIndices.findIndex(index => index > i) - 1;
          x = (octave * 7 + prevWhiteKeyIndex) * (whiteKeyWidth + keySpacing) + whiteKeyWidth - blackKeyWidth / 2;
        } else {
          const whiteKeyIndex = whiteKeyIndices.indexOf(i);
          x = (octave * 7 + whiteKeyIndex) * (whiteKeyWidth + keySpacing);
        }
        key.position.set(x, 0, isBlackKey ? 0.1 : 0);
        this.scene.add(key);
        const note = Tone.Frequency((this.baseOctave + octave) * 12 + i, "midi").toFrequency();
        this.keys.push({ mesh: key, note: note, isBlackKey: isBlackKey });
      }
    }
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.boundHandleTouchEnd);
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    window.addEventListener('resize', this.boundOnWindowResize);
  }

  onWindowResize() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.camera.right = this.canvas.clientWidth;
    this.camera.bottom = this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.createKeys();
  }

  initMIDI() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    } else {
      console.warn('WebMIDI is not supported in this browser.');
      this.midiEnabled = false;
    }
  }

  onMIDISuccess(midiAccess) {
    const inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
      this.midiInputs.set(input.value.id, input.value);
      input.value.onmidimessage = this.onMIDIMessage.bind(this);
    }
    const outputs = midiAccess.outputs.values();
    this.midiOutput = outputs.next().value;
    midiAccess.onstatechange = this.onMIDIStateChange.bind(this);
    this.midiEnabled = this.midiInputs.size > 0 || this.midiOutput !== null;
    console.log(`MIDI ${this.midiEnabled ? 'enabled' : 'disabled'}: ${this.midiInputs.size} input(s), ${this.midiOutput ? '1 output' : 'no output'}`);
  }

  onMIDIFailure(error) {
    console.error('Failed to access MIDI devices:', error);
    this.midiEnabled = false;
  }

  onMIDIStateChange(event) {
    if (event.port.type === 'input') {
      if (event.port.state === 'connected') {
        this.midiInputs.set(event.port.id, event.port);
        event.port.onmidimessage = this.onMIDIMessage.bind(this);
      } else if (event.port.state === 'disconnected') {
        this.midiInputs.delete(event.port.id);
      }
    } else if (event.port.type === 'output') {
      if (event.port.state === 'connected') {
        this.midiOutput = event.port;
      } else if (event.port.state === 'disconnected') {
        this.midiOutput = null;
      }
    }
    this.midiEnabled = this.midiInputs.size > 0 || this.midiOutput !== null;
    console.log(`MIDI state changed. MIDI ${this.midiEnabled ? 'enabled' : 'disabled'}: ${this.midiInputs.size} input(s), ${this.midiOutput ? '1 output' : 'no output'}`);
  }

  onMIDIMessage(message) {
    if (!this.midiEnabled) return;
    const [status, note, velocity] = message.data;
    const channel = status & 0xF;
    const command = status & 0xF0;

    switch (command) {
      case 0x90:
        if (velocity > 0) {
          this.playMIDINote(note, velocity / 127);
        } else {
          this.stopMIDINote(note);
        }
        break;
      case 0x80:
        this.stopMIDINote(note);
        break;
    }
  }

  playMIDINote(midiNote, velocity) {
    if (!this.midiEnabled) return;
    const key = this.findKeyByMIDINote(midiNote);
    if (key) {
      this.playNote(key, velocity);
    }
  }

  stopMIDINote(midiNote) {
    if (!this.midiEnabled) return;
    const key = this.findKeyByMIDINote(midiNote);
    if (key) {
      this.stopNote(key);
    }
  }

  findKeyByMIDINote(midiNote) {
    return this.keys.find(key => key.note === Tone.Frequency(midiNote, "midi").toFrequency());
  }

  sendMIDINoteOn(note, velocity) {
    if (this.midiEnabled && this.midiOutput) {
      const midiNote = Math.round(Tone.Frequency(note).toMidi());
      const midiVelocity = Math.round(velocity * 127);
      this.midiOutput.send([0x90, midiNote, midiVelocity]);
    }
  }

  sendMIDINoteOff(note) {
    if (this.midiEnabled && this.midiOutput) {
      const midiNote = Math.round(Tone.Frequency(note).toMidi());
      this.midiOutput.send([0x80, midiNote, 0]);
    }
  }

  handleMouseDown(event) {
    const key = this.getKeyAtPosition(event.clientX, event.clientY);
    if (key) {
      this.currentMouseKey = key;
      this.playNote(key);
    }
  }
  
  handleMouseMove(event) {
    if (event.buttons === 1) {
      const newKey = this.getKeyAtPosition(event.clientX, event.clientY);
      if (newKey !== this.currentMouseKey) {
        if (this.currentMouseKey) {
          this.stopNote(this.currentMouseKey);
        }
        if (newKey) {
          this.currentMouseKey = newKey;
          this.playNote(newKey);
        } else {
          this.currentMouseKey = null;
        }
      }
    }
  }
  
  handleMouseUp() {
    if (this.currentMouseKey) {
      this.stopNote(this.currentMouseKey);
      this.currentMouseKey = null;
    }
  }

  handleMouseLeave() {
    if (this.currentMouseKey) {
      this.stopNote(this.currentMouseKey);
      this.currentMouseKey = null;
    }
  }

  handleTouchStart(event) {
    event.preventDefault();
    Array.from(event.changedTouches).forEach(touch => {
      const key = this.getKeyAtPosition(touch.clientX, touch.clientY);
      if (key) {
        this.activeTouches.set(touch.identifier, key);
        this.playNote(key);
      }
    });
  }
  
  handleTouchMove(event) {
    event.preventDefault();
    Array.from(event.changedTouches).forEach(touch => {
      const oldKey = this.activeTouches.get(touch.identifier);
      const newKey = this.getKeyAtPosition(touch.clientX, touch.clientY);
      if (oldKey !== newKey) {
        if (oldKey) {
          this.stopNote(oldKey);
        }
        if (newKey) {
          this.activeTouches.set(touch.identifier, newKey);
          this.playNote(newKey);
        } else {
          this.activeTouches.delete(touch.identifier);
        }
      }
    });
  }
  
  handleTouchEnd(event) {
    Array.from(event.changedTouches).forEach(touch => {
      const key = this.activeTouches.get(touch.identifier);
      if (key) {
        this.stopNote(key);
        this.activeTouches.delete(touch.identifier);
      }
    });
  }

  handleKeyDown(event) {
    const keyIndex = 'AWSEDFTGYHUJKOLP;'.indexOf(event.key.toUpperCase());
    if (keyIndex !== -1 && keyIndex < this.keys.length) {
      const key = this.keys[keyIndex];
      if (!this.activeKeys.has(key)) {
        this.playNote(key);
      }
    } else if (event.key === 'ArrowUp') {
      this.shiftOctave(1);
    } else if (event.key === 'ArrowDown') {
      this.shiftOctave(-1);
    }
  }

  handleKeyUp(event) {
    const keyIndex = 'AWSEDFTGYHUJKOLP;'.indexOf(event.key.toUpperCase());
    if (keyIndex !== -1 && keyIndex < this.keys.length) {
      const key = this.keys[keyIndex];
      this.stopNote(key);
    }
  }

  getKeyAtPosition(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = x - rect.left;
    const mouseY = y - rect.top;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (mouseX / this.canvas.clientWidth) * 2 - 1,
      -(mouseY / this.canvas.clientHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children);
    if (intersects.length > 0) {
      return this.keys.find(key => key.mesh === intersects[0].object);
    }
    return null;
  }

  playNote(key, velocity = 1) {
    if (!this.activeKeys.has(key)) {
      this.activeKeys.add(key);
      this.synth.triggerAttack(key.note, Tone.now(), velocity);
      this.updateKeyColor(key);
      if (this.midiEnabled) {
        this.sendMIDINoteOn(key.note, velocity);
      }
    }
  }

  stopNote(key) {
    if (this.activeKeys.has(key)) {
      this.activeKeys.delete(key);
      this.synth.triggerRelease(key.note);
      this.resetKeyColor(key);
      if (this.midiEnabled) {
        this.sendMIDINoteOff(key.note);
      }
    }
  }

  stopAllNotes() {
    this.activeKeys.forEach(key => {
      this.stopNote(key);
    });
    this.activeTouches.clear();
    this.currentMouseKey = null;
  }

  updateKeyColor(key) {
    const hue = (Math.log2(key.note) % 1) * 360;
    key.mesh.material.color.setHSL(hue / 360, 1, 0.5);
  }

  resetKeyColor(key) {
    key.mesh.material.color.setHex(0x333333);
  }

  shiftOctave = (shift) => {
    this.baseOctave += shift;
    this.baseOctave = Math.max(0, Math.min(this.baseOctave, 8 - this.numOctaves));
    this.stopAllNotes();
    this.createKeys();
  }

  setSynthType(e) {
    const type = e.target.value;
    const options = { volume: -6 };
    if (type === 'default' || type === null) {
      this.synth = new Tone.PolySynth(Tone.Synth, options).toDestination();
    } else {
      switch (type) {
        case 'synth':
          this.synth = new Tone.PolySynth(Tone.Synth, options).toDestination();
          break;
        case 'am':
          this.synth = new Tone.PolySynth(Tone.AMSynth, options).toDestination();
          break;
        case 'fm':
          this.synth = new Tone.PolySynth(Tone.FMSynth, options).toDestination();
          break;
        case 'mono':
          this.synth = new Tone.PolySynth(Tone.MonoSynth, options).toDestination();
          break;
        case 'duo':
          this.synth = new Tone.PolySynth(Tone.DuoSynth, options).toDestination();
          break;
        case 'pluck':
          this.synth = new Tone.PolySynth(Tone.PluckSynth, options).toDestination();
          break;
        case 'membrane':
          this.synth = new Tone.PolySynth(Tone.MembraneSynth, options).toDestination();
          break;
        case 'metal':
          this.synth = new Tone.PolySynth(Tone.MetalSynth, options).toDestination();
          break;
        default:
          console.warn(`Unsupported synth type: ${type}. Defaulting to Synth.`);
          this.synth = new Tone.PolySynth(Tone.Synth, options).toDestination();
      }
    }
    this.stopAllNotes();
  }
  
  setOscillatorType(e) {
    let type = e.target.value;
    if (type === 'default' || type === null) {
      type = 'sine';
    }
    if (this.synth.get().oscillator) {
      this.synth.set({ oscillator: { type } });
    } else {
      console.warn("Current synth doesn't support oscillator type change.");
    }
  }
  
  setEnvelopeSettings(attack, decay, sustain, release) {
    if (attack === null && decay === null && sustain === null && release === null) {
      this.synth.set({
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
      });
    } else if (this.synth.get().envelope) {
      const currentEnvelope = this.synth.get().envelope;
      this.synth.set({
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
  }
  
  setEffects = (effects) => {
    if(effects[0].enabled){
      let effect = effects[0];
      this.effectInstances.distortion.distortion = parseFloat(effect.amount);
      if(!this.activeEffectTypes.distortion){
        this.activeEffectTypes.distortion = !this.activeEffectTypes.distortion
        this.synth.connect(this.effectInstances.distortion)
      }
    } else {
      if(this.activeEffectTypes.distortion){
        this.synth.disconnect(this.effectInstances.distortion)
        this.activeEffectTypes.distortion = !this.activeEffectTypes.distortion
      }
    }
    if(effects[1].enabled){
      let effect = effects[1];
      this.effectInstances.delay.set({delayTime: parseFloat(effect.delayTime), feedback:parseFloat(effect.feedback)});
      if(!this.activeEffectTypes.delay){
        this.activeEffectTypes.delay = !this.activeEffectTypes.delay
        this.synth.connect(this.effectInstances.delay)
      }
    } else {
      if(this.activeEffectTypes.delay){
        this.synth.disconnect(this.effectInstances.delay)
        this.activeEffectTypes.delay = !this.activeEffectTypes.delay
      }
    }
    if(effects[2].enabled){
      let effect = effects[2];
      this.effectInstances.reverb.decay = parseFloat(effect.decay);
      if(!this.activeEffectTypes.reverb){
        this.activeEffectTypes.reverb = !this.activeEffectTypes.reverb
        this.synth.connect(this.effectInstances.reverb)
      }
    } else {
      if(this.activeEffectTypes.reverb){
        this.synth.disconnect(this.effectInstances.reverb)
        this.activeEffectTypes.reverb = !this.activeEffectTypes.reverb
      }
    }
    if(effects[3].enabled){
      let effect = effects[3];
      this.effectInstances.chorus.set({
        frequency: parseFloat(effect.frequency),
        delayTime: parseFloat(effect.delayTime),
        depth: parseFloat(effect.depth)
      });
      if(!this.activeEffectTypes.chorus){
        this.activeEffectTypes.chorus = !this.activeEffectTypes.chorus
        this.synth.connect(this.effectInstances.chorus)
      }
    } else {
      if(this.activeEffectTypes.chorus){
        this.synth.disconnect(this.effectInstances.chorus)
        this.activeEffectTypes.chorus = !this.activeEffectTypes.chorus
      }
    }
  }

  setFilterSettings(frequency, type = 'lowpass', rolloff = -12) {
    if (frequency === null && type === null && rolloff === null) {
      this.synth.set({ filter: { frequency: 20000, type: 'lowpass', rolloff: -12 } });
    } else if (this.synth.get().filter) {
      const currentFilter = this.synth.get().filter;
      this.synth.set({
        filter: {
          frequency: frequency !== null ? frequency : currentFilter.frequency,
          type: type !== null ? type : currentFilter.type,
          rolloff: rolloff !== null ? rolloff : currentFilter.rolloff
        }
      });
    } else {
      console.warn("Current synth doesn't support filter settings.");
    }
  }


  animate() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  destruct() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    this.renderer.clear();
    this.renderer.dispose();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.synth = null;
    if (this.midiEnabled) {
      this.midiInputs.forEach(input => {
        input.onmidimessage = null;
        input.close();
      });
      this.midiInputs.clear();
      if (this.midiOutput) {
        this.midiOutput.close();
        this.midiOutput = null;
      }
    }
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
    this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    window.removeEventListener('resize', this.boundOnWindowResize);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.keys = [];
    this.activeKeys.clear();
    this.activeTouches.clear();
    // console.log('Synth instance destroyed');
  }
}