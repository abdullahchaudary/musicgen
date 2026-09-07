# MusicGen

A browser instrument collection: six playable modes, full MIDI input and output, and two
ways to generate sound with your hands, touch and a camera. Built with
[Tone.js](https://tonejs.github.io/) for audio and [Three.js](https://threejs.org/) for a
visual response tied to whichever instrument is active.

**Live demo:** [musicgen.abchaudary.me](https://musicgen.abchaudary.me)
**Full write-up:** [abchaudary.me/projects/musicgen](https://abchaudary.me/projects/musicgen)

## Features

- **Touch theremin**: a canvas mapped so X/Y position drives pitch and amplitude
  continuously, the same two axes a real theremin's antennas control, no keys, no steps
- **Ten-point multitouch**, each contact tracked independently by touch identifier
- **Full synth keyboard**, velocity-sensitive, wired to the **Web MIDI API in both
  directions**: accepts a real MIDI controller as input and sends MIDI out to drive external
  hardware or other software
- **Shared effects chain** on both the theremin and the keyboard: distortion, delay, reverb
  and chorus, plus ADSR and oscillator-type controls, all live parameters
- **Four camera-driven modes**: a live video feed is sampled across a pixel grid, and each
  cell's colour and brightness maps to a Three.js object's position and a Tone.js voice, so
  light and colour in a room become sound
- **Installable as a PWA**, straight from the browser

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Vue 3, Vite, Pinia, vue-router |
| Audio | [Tone.js](https://tonejs.github.io/), Web MIDI API |
| Visuals | [Three.js](https://threejs.org/), one WebGL scene per instrument |
| Styling | Tailwind CSS |
| Deployment | Installable PWA (`vite-plugin-pwa`) |

## Running it locally

```sh
npm install
npm run dev      # dev server with hot reload
npm run build     # production build
```

## Recommended IDE setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
(with Vetur disabled).

## By

[Abdullah Chaudary](https://abchaudary.me).
