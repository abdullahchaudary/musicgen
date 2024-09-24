<script>
import SquareTone from '@/helpers/SquareTone';
import CirclesTone from '@/helpers/CirclesTone';
import CirclesGridTone from '@/helpers/CirclesGridTone';
import CirclesGridBeat from '@/helpers/CirclesGridBeat';
import TouchTheremin from '@/helpers/TouchTheremin';
import Synth from '@/helpers/Synth';

export default {
  data() {
    return {
      showSideBar: false,
      viz: null,
      mode: 'mode5',
      timeOuts: [],
      music: -10,
      narration: -5,
      consentShow: false,
      tempo: 120,
      mode1: null,
      mode2: null,
      mode3: null,
      mode4: null,
      mode5: null,
      mode6: null,
      currentMode: null,
      cnvs: null,
      synthEnvelope: {
        attack: 0.005, decay: 0.1, sustain: 0.3, release: 1
      },
      synthEffects: [
        { type: 'distortion', enabled: false, amount: 0.3},
        { type: 'delay', enabled: false, delayTime: 0.3, feedback: 0.4 },
        { type: 'reverb', enabled: false, decay: 1.5 },
        { type: 'chorus', enabled: false, frequency: 2, delayTime: 3, depth: 0.7 }
      ],
      synthEffectsToggle: false
    }
  },
  unmounted(){
    // if(this.viz){
    //   delete this.viz.deconstruct();
    // }
  },
  mounted(){
    this.cnvs = document.getElementById("cnvs");
    this.mode5 = new TouchTheremin(this.cnvs);
    this.currentMode = 'mode5';
  },
  methods: {
    destructObjs(){
      if(this.mode1){
        this.mode1.destruct();
        delete this.mode1;
        this.mode1 = null;
      }
      if(this.mode2){
        this.mode2.destruct();
        delete this.mode2;
        this.mode2 = null;
      }
      if(this.mode3){
        this.mode3.destruct();
        delete this.mode3;
        this.mode3 = null;
      }
      if(this.mode4){
        this.mode4.destruct();
        delete this.mode4;
        this.mode4 = null;
      }
      if(this.mode5){
        this.mode5.destruct();
        delete this.mode5;
        this.mode5 = null;
      }
      if(this.mode6){
        this.mode6.destruct();
        delete this.mode6;
        this.mode6 = null;
      }
    },
    modeSelect(e){
      this.destructObjs();
      this.currentMode = e.target.value;
      switch(e.target.value){
        case "mode1":
          this.mode1 = new SquareTone(this.cnvs);
          break;
        case "mode2":
          this.mode2 = new CirclesTone(this.cnvs);
          break;
        case "mode3":
          this.mode3 = new CirclesGridTone(this.cnvs);
          break;
        case "mode4":
          this.mode4 = new CirclesGridBeat(this.cnvs);
          break;
        case "mode5":
          this.mode5 = new TouchTheremin(this.cnvs);
          break;
        case "mode6":
          this.mode6 = new Synth(this.cnvs);
          break;
        case "mode7":
          // this.mode6 = new Stylophone(this.cnvs);
          break;
        default:
          //
      }
    },
    changeTempo(e){
      this.tempo = e.target.value;
      switch(this.currentMode){
        case "mode1":
          this.mode1.setTempo(e.target.value);
          break;
        case "mode2":
          this.mode2.setTempo(e.target.value);
          break;
        case "mode3":
          this.mode3.setTempo(e.target.value);
          break;
        case "mode4":
          this.mode4.setTempo(e.target.value);
          break;
        default:
          //
      }
    },
    changeVolume(e){
      this.music = e.target.value;
      // this.viz.musicGen.setVolume(this.music);
    },
    changeSynthEnvelope(){
      if(this.mode == 'mode5'){
        this.mode5.setEnvelopeSettings(this.synthEnvelope.attack, this.synthEnvelope.decay, this.synthEnvelope.sustain, this.synthEnvelope.release);
      } else {
        this.mode6.setEnvelopeSettings(this.synthEnvelope.attack, this.synthEnvelope.decay, this.synthEnvelope.sustain, this.synthEnvelope.release);
      }
    },
    setSynthEffects(){
      if(this.mode == 'mode5'){
        this.mode5.setEffects(this.synthEffects);
      } else {
        this.mode6.setEffects(this.synthEffects);
      }
    }
  },
}
</script>

<template>
  <main id="mainContainer">
    <canvas id="cnvs"></canvas>
    <button class="sideBarBTN fadedControls" type="button" @click="showSideBar = !showSideBar">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="128" cy="128" r="48" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/><path d="M197.4,80.7a73.6,73.6,0,0,1,6.3,10.9L229.6,106a102,102,0,0,1,.1,44l-26,14.4a73.6,73.6,0,0,1-6.3,10.9l.5,29.7a104,104,0,0,1-38.1,22.1l-25.5-15.3a88.3,88.3,0,0,1-12.6,0L96.3,227a102.6,102.6,0,0,1-38.2-22l.5-29.6a80.1,80.1,0,0,1-6.3-11L26.4,150a102,102,0,0,1-.1-44l26-14.4a73.6,73.6,0,0,1,6.3-10.9L58.1,51A104,104,0,0,1,96.2,28.9l25.5,15.3a88.3,88.3,0,0,1,12.6,0L159.7,29a102.6,102.6,0,0,1,38.2,22Z" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="12"/></svg>
    </button>
    <div class="sideBar fadedControls" v-show="showSideBar">
      <select :value="this.mode" v-model="this.mode" @change="this.modeSelect" class="mb-3 appearance-dark block w-full px-3 py-1 text-base font-normal text-white-700 bg-grey-900 dark:bg-grey-900 bg-clip-padding bg-no-repeat border border-solid border-black-700 rounded transition ease-in-out m-0 focus:text-white-700 focus:bg-red focus:border-gray-300 focus:outline-none" aria-label="Select mode">
        <option value="mode1">Mode 1</option>
        <option value="mode2">Mode 2</option>
        <option value="mode3">Mode 3</option>
        <option value="mode4">Mode 4</option>
        <option value="mode5" selected>Theremin</option>
        <option value="mode6">Synth Key</option>
        <option value="mode7">Reset</option>
      </select>
      <div v-if="this.mode == 'mode1' | this.mode == 'mode2' | this.mode == 'mode3' | this.mode == 'mode4'">
        <label htmlFor="tempo" class="form-label text-white small">Tempo: {{this.tempo}}</label>
        <input type="range" @input="this.changeTempo" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="90" max="200" :value="this.tempo" id="tempo" />
      </div>
      <div v-if="this.mode == 'mode5' | this.mode == 'mode6'">
        <div v-if="this.mode == 'mode6'" class="flex justify-between">
          <button type="button" @click="this.mode6.shiftOctave(-1)" class="px-2 py-1 text-xs font-small text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" ty>Octave -</button>
          <button type="button" @click="this.mode6.shiftOctave(1)" class="px-2 py-1 text-xs font-small text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" ty>Octave +</button>
        </div>
        <label htmlFor="synthType" class="form-label text-white small">Synth</label>
        <select @keydown="(e)=>e.preventDefault()" v-if="this.mode == 'mode5'" @change="this.mode5.setSynthType" id="synthType" class="mb-3 appearance-dark block w-full px-3 py-1 text-base font-normal text-white-700 bg-grey-900 dark:bg-grey-900 bg-clip-padding bg-no-repeat border border-solid border-black-700 rounded transition ease-in-out m-0 focus:text-white-700 focus:bg-red focus:border-gray-300 focus:outline-none" aria-label="Select synth type">
          <option value="synth">synth</option>
          <option value="am">am</option>
          <option value="fm">fm</option>
          <option value="mono">mono</option>
          <option value="duo">duo</option>
          <!-- <option value="pluck">pluck</option> -->
          <option value="membrane">membrane</option>
          <option value="metal">metal</option>
        </select>
        <select @keydown="(e)=>e.preventDefault()" v-if="this.mode == 'mode6'" @change="this.mode6.setSynthType" id="synthType" class="mb-3 appearance-dark block w-full px-3 py-1 text-base font-normal text-white-700 bg-grey-900 dark:bg-grey-900 bg-clip-padding bg-no-repeat border border-solid border-black-700 rounded transition ease-in-out m-0 focus:text-white-700 focus:bg-red focus:border-gray-300 focus:outline-none" aria-label="Select synth type">
          <option value="synth">synth</option>
          <option value="am">am</option>
          <option value="fm">fm</option>
          <option value="mono">mono</option>
          <option value="duo">duo</option>
          <!-- <option value="pluck">pluck</option> -->
          <option value="membrane">membrane</option>
          <option value="metal">metal</option>
        </select>
        <label htmlFor="oscillatorType" class="form-label text-white small">Oscillator</label>
        <select @keydown="(e)=>e.preventDefault()" v-if="this.mode == 'mode5'" @change="this.mode5.setOscillatorType" id="oscillatorType" class="mb-3 appearance-dark block w-full px-3 py-1 text-base font-normal text-white-700 bg-grey-900 dark:bg-grey-900 bg-clip-padding bg-no-repeat border border-solid border-black-700 rounded transition ease-in-out m-0 focus:text-white-700 focus:bg-red focus:border-gray-300 focus:outline-none" aria-label="Select synth type">
          <option value="sine">sine</option>
          <option value="square">square</option>
          <option value="triangle">triangle</option>
          <option value="sawtooth">sawtooth</option>
        </select>
        <select @keydown="(e)=>e.preventDefault()" v-if="this.mode == 'mode6'" @change="this.mode6.setOscillatorType" id="oscillatorType" class="mb-3 appearance-dark block w-full px-3 py-1 text-base font-normal text-white-700 bg-grey-900 dark:bg-grey-900 bg-clip-padding bg-no-repeat border border-solid border-black-700 rounded transition ease-in-out m-0 focus:text-white-700 focus:bg-red focus:border-gray-300 focus:outline-none" aria-label="Select synth type">
          <option value="sine">sine</option>
          <option value="square">square</option>
          <option value="triangle">triangle</option>
          <option value="sawtooth">sawtooth</option>
        </select>
        <label htmlFor="attack" class="form-label text-white small">Attack: {{this.synthEnvelope.attack}}</label>
        <input type="range" @input="this.changeSynthEnvelope" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.005" max="1" step="0.001" v-model="this.synthEnvelope.attack" id="attack" />
        <label htmlFor="decay" class="form-label text-white small">Decay: {{this.synthEnvelope.decay}}</label>
        <input type="range" @input="this.changeSynthEnvelope" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.01" max="2" step="0.01" v-model="this.synthEnvelope.decay" id="decay" />
        <label htmlFor="sustain" class="form-label text-white small">Sustain: {{this.synthEnvelope.sustain}}</label>
        <input type="range" @input="this.changeSynthEnvelope" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0" max="1" step="0.001" v-model="this.synthEnvelope.sustain" id="sustain" />
        <label htmlFor="release" class="form-label text-white small">Release: {{this.synthEnvelope.release}}</label>
        <input type="range" @input="this.changeSynthEnvelope" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0" max="1" step="0.001" v-model="this.synthEnvelope.release" id="release" />
        
        <label class="inline-flex items-center me-5 cursor-pointer mt-4">
          <span class="text-lg font-bold text-gray-900 dark:text-gray-300">Effects</span>
          <input type="checkbox" value="ms-3" class="sr-only peer" v-model="this.synthEffectsToggle" @change="this.setSynthEffects">
          <div class="ms-3 relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        </label>
        <div v-show="this.synthEffectsToggle" class="mt-2">
          <label class="inline-flex items-center mb-0 cursor-pointer">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-300">Distortion</span>
            <input type="checkbox" value="" class="ms-3 sr-only peer" v-model="this.synthEffects[0].enabled" @change="this.setSynthEffects">
            <div class="ms-3 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <div v-show="this.synthEffects[0].enabled">
            <label htmlFor="distortion_amount" class="form-label text-white text-sm">Amount: {{this.synthEffects[0].amount}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.000" max="1" step="0.001" v-model="this.synthEffects[0].amount" id="distortion_amount" />
          </div>

          <label class="inline-flex items-center mb-0 cursor-pointer mt-3">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-300">Delay</span>
            <input type="checkbox" value="" class="ms-3 sr-only peer" v-model="this.synthEffects[1].enabled" @change="this.setSynthEffects">
            <div class="ms-3 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <div v-show="this.synthEffects[1].enabled">
            <label htmlFor="delay_time" class="form-label text-white text-sm">Delay: {{this.synthEffects[1].delayTime}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.000" max="1" step="0.001" v-model="this.synthEffects[1].delayTime" id="delay_time" />
            <label htmlFor="delay_feedback" class="form-label text-white text-sm">Feedback: {{this.synthEffects[1].feedback}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.000" max="1" step="0.001" v-model="this.synthEffects[1].feedback" id="delay_feedback" />
          </div>

          <label class="inline-flex items-center mb-0 cursor-pointer mt-3">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-300">Reverb</span>
            <input type="checkbox" value="" class="ms-3 sr-only peer" v-model="this.synthEffects[2].enabled" @change="this.setSynthEffects">
            <div class="ms-3 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <div v-show="this.synthEffects[2].enabled">
            <label htmlFor="reverb_decay" class="form-label text-white text-sm">Decay: {{this.synthEffects[2].decay}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.001" max="10" step="0.001" v-model="this.synthEffects[2].decay" id="reverb_decay" />
          </div>

          <label class="inline-flex items-center mb-0 cursor-pointer mt-3">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-300">Chorus</span>
            <input type="checkbox" value="" class="ms-3 sr-only peer" v-model="this.synthEffects[3].enabled" @change="this.setSynthEffects">
            <div class="ms-3 relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <div v-show="this.synthEffects[3].enabled">
            <label htmlFor="chorus_frequency" class="form-label text-white text-sm">Frequency: {{this.synthEffects[3].frequency}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.01" max="20" step="0.01" v-model="this.synthEffects[3].frequency" id="chorus_frequency" />
            <label htmlFor="chorus_delay" class="form-label text-white text-sm">Delay: {{this.synthEffects[3].delayTime}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="2" max="20" step="0.1" v-model="this.synthEffects[3].delayTime" id="chorus_delay" />
            <label htmlFor="chorus_depth" class="form-label text-white text-sm">Depth: {{this.synthEffects[3].depth}}</label>
            <input type="range" @change="this.setSynthEffects" class="form-range appearance-none w-full h-1 p-0 dark:bg-white-500 focus:outline-none focus:ring-0 focus:shadow-none" min="0.001" max="1" step="0.001" v-model="this.synthEffects[3].depth" id="chorus_depth" />
          </div>

        </div>
      </div>
    </div>
  </main>
</template>
