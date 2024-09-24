import * as THREE from 'three';
import * as Tone from 'tone';

class Stylophone {
  constructor(canvas, numOctaves = 3) {
    this.canvas = canvas;
    this.numOctaves = numOctaves;
    this.baseOctave = 4;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, canvas.clientWidth, 0, canvas.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.keys = [];
    this.activeKeys = new Set();

    this.init();
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

    const totalKeys = this.numOctaves * 12;
    const keyWidth = this.canvas.clientWidth / totalKeys;
    const keyHeight = this.canvas.clientHeight;

    for (let i = 0; i < totalKeys; i++) {
      const x = i * keyWidth;
      const geometry = new THREE.PlaneGeometry(keyWidth * 0.95, keyHeight);
      const material = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
      const key = new THREE.Mesh(geometry, material);

      key.position.set(x + keyWidth / 2, keyHeight / 2, 0);
      this.scene.add(key);

      const note = Tone.Frequency((this.baseOctave * 12) + i, "midi").toFrequency();
      this.keys.push({ mesh: key, note: note });

      // Add key label
      const labelGeometry = new THREE.PlaneGeometry(keyWidth * 0.9, keyHeight * 0.05);
      const labelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(x + keyWidth / 2, keyHeight * 0.975, 0.1);
      this.scene.add(label);
    }
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.camera.right = this.canvas.clientWidth;
    this.camera.bottom = this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.createKeys();
  }

  handleMouseDown(event) {
    const key = this.getKeyAtPosition(event.clientX, event.clientY);
    if (key) {
      this.playNote(key);
    }
  }

  handleMouseMove(event) {
    if (event.buttons === 1) {
      const key = this.getKeyAtPosition(event.clientX, event.clientY);
      if (key && !this.activeKeys.has(key)) {
        this.playNote(key);
      }
    }
  }

  handleMouseUp() {
    this.stopAllNotes();
  }

  handleTouchStart(event) {
    event.preventDefault();
    Array.from(event.touches).forEach(touch => {
      const key = this.getKeyAtPosition(touch.clientX, touch.clientY);
      if (key) {
        this.playNote(key);
      }
    });
  }

  handleTouchMove(event) {
    event.preventDefault();
    Array.from(event.touches).forEach(touch => {
      const key = this.getKeyAtPosition(touch.clientX, touch.clientY);
      if (key && !this.activeKeys.has(key)) {
        this.playNote(key);
      }
    });
  }

  handleTouchEnd() {
    this.stopAllNotes();
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

  playNote(key) {
    if (!this.activeKeys.has(key)) {
      this.activeKeys.add(key);
      this.synth.triggerAttack(key.note);
      this.updateKeyColor(key);
    }
  }

  stopNote(key) {
    if (this.activeKeys.has(key)) {
      this.activeKeys.delete(key);
      this.synth.triggerRelease(key.note);
      this.resetKeyColor(key);
    }
  }

  stopAllNotes() {
    this.activeKeys.forEach(key => {
      this.stopNote(key);
    });
  }

  updateKeyColor(key) {
    const hue = (Math.log2(key.note) % 1) * 360;
    key.mesh.material.color.setHSL(hue / 360, 1, 0.5);
  }

  resetKeyColor(key) {
    key.mesh.material.color.setHex(0x333333);
  }

  shiftOctave(shift) {
    this.baseOctave += shift;
    this.baseOctave = Math.max(0, Math.min(this.baseOctave, 8 - this.numOctaves));
    this.stopAllNotes();
    this.createKeys();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

export default Stylophone;