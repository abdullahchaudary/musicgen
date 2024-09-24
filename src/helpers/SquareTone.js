import * as THREE from 'three';
import * as Tone from 'tone';

export default class SquareTone {
    constructor(cnvs) {
        this.numNotes = Math.min(8, 16);
        this.numDataPoints = 3;
        this.numTones = 3;
        this.tempo = 120;
        this.notes = this.generateScale(this.numNotes);
        this.synths = this.createSynths(this.numTones);
        this.canvas = cnvs;
        this.initScene();
        this.initVideo();
        this.startToneLoop();
        this.animationId = null;
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
            this.canvas.style.opacity = 1;
        }
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.camera.position.z = 5;
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.cube);

        // window.addEventListener('resize', this.onResize());
        
        this.animate();
    }


    initVideo() {
        this.video = document.createElement('video');
        this.video.style.display = 'none';
        document.body.appendChild(this.video);

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
            context.drawImage(this.video, 0, 0, this.numDataPoints, 1);

            const pixels = context.getImageData(0, 0, this.numDataPoints, 1).data;

            for (let i = 0; i < this.numTones; i++) {
            const r = pixels[i * 4] || 0;
            const g = pixels[i * 4 + 1] || 0;
            const b = pixels[i * 4 + 2] || 0;

            const note = this.mapToScale(r);
            const volume = this.mapToVolume(g);
            const modulation = this.mapToModulation(b);

            this.synths[i].volume.value = volume;
            this.synths[i].set({
                oscillator: {
                    modulationFrequency: modulation
                }
            });

            this.synths[i].triggerAttackRelease(note, "8n", time);
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
        this.animationId = requestAnimationFrame(() => this.animate());
        if (this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            const context = document.createElement('canvas').getContext('2d');
            context.drawImage(this.video, 0, 0, 1, 1);
            const pixel = context.getImageData(0, 0, 1, 1).data;
            const brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
            this.material.color.setRGB(brightness / 255, pixel[1] / 255, pixel[2] / 255);
        } else {
            // console.warn('Video is not ready yet.');
        }

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

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
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
            document.body.removeChild(this.video);
        }
        window.removeEventListener('resize', this.onResize);
        this.camera = null;
        this.scene = null;
        this.renderer = null;
    }
  
}