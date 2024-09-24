import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as Tone from 'tone';

class Stylophone {
  constructor(canvas, numOctaves = 3) {
    this.canvas = canvas;
    this.numOctaves = numOctaves;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.keys = [];
    this.activeKeys = new Set();

    this.init();
  }

  init() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.scene.background = new THREE.Color(0x111111);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enabled = false;

    this.createKeys();
    this.addEventListeners();
    this.animate();
  }

  createKeys() {
    const keyWidth = 0.8;
    const keyHeight = 3;
    const keyDepth = 0.5;
    const keySpacing = 0.1;
    const totalWidth = (keyWidth + keySpacing) * this.numOctaves * 12 - keySpacing;

    for (let octave = 0; octave < this.numOctaves; octave++) {
      for (let note = 0; note < 12; note++) {
        const geometry = new THREE.BoxGeometry(keyWidth, keyHeight, keyDepth);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
        const key = new THREE.Mesh(geometry, material);

        const x = (octave * 12 + note) * (keyWidth + keySpacing) - totalWidth / 2;
        key.position.set(x, 0, 0);

        this.scene.add(key);
        this.keys.push({
          mesh: key,
          note: Tone.Frequency((octave + 4) * 12 + note, "midi").toFrequency()
        });
      }
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    this.scene.add(directionalLight);
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
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.width, this.canvas.height);
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
    const mouse = new THREE.Vector2(
      ((x - rect.left) / this.canvas.width) * 2 - 1,
      -((y - rect.top) / this.canvas.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
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
    key.mesh.material.wireframe = false;
  }

  resetKeyColor(key) {
    key.mesh.material.color.setHex(0xffffff);
    key.mesh.material.wireframe = true;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

export default Stylophone;