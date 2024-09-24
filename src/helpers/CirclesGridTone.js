import * as THREE from 'three';
import * as Tone from 'tone';

export default class CirclesGridTone {
    constructor(cnvs) {
        this.animationID = null;
        this.canvas = cnvs;
        this.numNotes = Math.min(12, 16);
        this.numDataPoints = 16;
        this.numTones = 3;
        this.tempo = 120;
        this.notes = this.generateScale(this.numNotes);
        this.synths = this.createSynths(this.numTones);
        this.circles = [];
        this.initScene();
        this.initVideo();
        this.startToneLoop();
    }

    generateScale(numNotes) {
        const allNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "D6"];
        return allNotes.slice(0, numNotes);
    }

    createSynths(numTones) {
        const synths = [];
        for (let i = 0; i < numTones; i++) {
            synths.push(new Tone.Synth().toDestination());
        }
        return synths;
    }

    onResize(){
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    initScene() {
        if(this.canvas){
            this.canvas.style.opacity = 0.7;
        }
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.camera.position.z = 20;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        for (let i = 0; i < this.numDataPoints; i++) {
            const geometry = new THREE.CircleGeometry(1, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const circle = new THREE.Mesh(geometry, material);
            this.circles.push(circle);
            this.scene.add(circle);
        }

        window.addEventListener('resize', this.onResize());

        this.animate();
    }

    initVideo() {
        this.video = document.createElement('video');
        this.video.style.position = 'absolute';
        this.video.style.top = '0';
        this.video.style.left = '0';
        this.video.style.width = '100%';
        this.video.style.height = '100%';
        this.video.style.objectFit = 'cover';
        this.video.style.transform = 'scaleX(-1)';
        this.video.style.zIndex = '-1';
        this.video.style.opacity = 0.9;
        const mainContainer = document.getElementById("mainContainer");
        mainContainer.appendChild(this.video);

        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            this.video.srcObject = stream;
            this.video.play();
        })
        .catch(err => {
            console.error('Error accessing the camera: ', err);
        });
    }

    startToneLoop() {
        Tone.Transport.bpm.value = this.tempo;

        const loop = new Tone.Loop(time => {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                const context = document.createElement('canvas').getContext('2d');
                context.canvas.width = this.video.videoWidth;
                context.canvas.height = this.video.videoHeight;

                context.translate(this.video.videoWidth, this.video.videoHeight);
                context.scale(-1, -1);
                context.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);

                const pixels = context.getImageData(0, 0, this.video.videoWidth, this.video.videoHeight).data;

                const gridSize = Math.ceil(Math.sqrt(this.numDataPoints));
                const stepX = this.video.videoWidth / (gridSize + 1);
                const stepY = this.video.videoHeight / (gridSize + 1);

                const startX = (this.video.videoWidth - stepX * (gridSize - 1)) / 2;
                const startY = (this.video.videoHeight - stepY * (gridSize - 1)) / 2;

                for (let i = 0; i < this.numDataPoints; i++) {
                    const col = i % gridSize;
                    const row = Math.floor(i / gridSize);
                    const x = startX + col * stepX;
                    const y = startY + row * stepY;

                    const pixelIndex = (x + y * this.video.videoWidth) * 4;
                    const r = pixels[pixelIndex] || 0;
                    const g = pixels[pixelIndex + 1] || 0;
                    const b = pixels[pixelIndex + 2] || 0;

                    const note = this.mapToScale(r);
                    const volume = this.mapToVolume(g);
                    const modulation = this.mapToModulation(b);

                    const synthIndex = i % this.numTones;
                    this.synths[synthIndex].volume.value = volume;
                    this.synths[synthIndex].set({
                        oscillator: {
                            modulationFrequency: modulation
                        }
                    });

                    this.synths[synthIndex].triggerAttackRelease(note, "8n", time);

                    this.circles[i].position.set(
                        (x / this.video.videoWidth - 0.5) * 2 * this.camera.position.z,
                        (y / this.video.videoHeight - 0.5) * 2 * this.camera.position.z,
                        0
                    );
                    this.circles[i].scale.set(r / 50, g / 50, 1);
                    this.circles[i].material.color.setRGB(r / 255, g / 255, b / 255);
                }
            }
        }, "4n").start(0);

        Tone.Transport.start();
    }

    setTempo(tempo){
        Tone.Transport.bpm.value = tempo;
    }


    mapToScale(value) {
        const index = Math.floor((value / 255) * this.notes.length);
        return this.notes[index];
    }

    mapToVolume(value) {
        return (value / 255) * -12;
    }

    mapToModulation(value) {
        return (value / 255) * 9.5 + 0.5;
    }

    animate() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.animationID = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    
    destruct = () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        this.synths.forEach(synth => {
            synth.triggerRelease();
            synth.dispose();
        });
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        const removeObjects = (object) => {
            if (object.isMesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                this.scene.remove(object);
            }
        };
        this.scene.children.forEach(child => removeObjects(child));
        this.renderer.clear();
        this.renderer.dispose();
        const mainContainer = document.getElementById("mainContainer");
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
            mainContainer.removeChild(this.video);
        }
        window.removeEventListener('resize', this.onResize);
        this.camera = null;
        this.scene = null;
        this.renderer = null;
    }
}

