import { useEffect, useRef } from 'react';
import type { SpecialEventType, WeatherType } from '../../lib/theme';

type Props = {
  event?: SpecialEventType;
  weather?: WeatherType;
  isDaytime?: boolean;
  reducedMotion: boolean;
  intensity?: 'quiet' | 'standard' | 'party';
  soundEnabled?: boolean;
};

const ACHIEVEMENT_KEY = 'wyss-event-achievements';
const PRIDE_COLORS = ['#ff0018', '#ffa52c', '#ffff41', '#008018', '#0000f9', '#86007d'];
const PASTEL_COLORS = ['#ff9ebb', '#a0e7e5', '#b4f8c8', '#fbe7c6', '#d8b4f8', '#ffd6a5'];

function unlock(event: SpecialEventType, achievement: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY) || '{}') as Record<string, string[]>;
    const list = new Set(current[event] || []);
    if (list.has(achievement)) return;
    list.add(achievement);
    current[event] = [...list];
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('wyss-achievement', { detail: { event, achievement } }));
  } catch {
    /* ignore storage failures */
  }
}

// ---------------------------------------------------------------------------
// Event sound: a tiny synth. One shared AudioContext; every note is snapped to
// an event-specific scale so random interactions still sound musical.
// ---------------------------------------------------------------------------
type Voice = { type: OscillatorType; scale: number[]; root: number };
const SCALES = {
  minorPent: [0, 3, 5, 7, 10],
  majorPent: [0, 2, 4, 7, 9],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};
const VOICES: Record<SpecialEventType | 'default', Voice> = {
  halloween: { type: 'triangle', scale: SCALES.minorPent, root: 146.83 }, // D3 minor pentatonic, spooky
  christmas: { type: 'sine', scale: SCALES.majorPent, root: 523.25 }, // bells
  newyear: { type: 'triangle', scale: SCALES.lydian, root: 261.63 },
  swiss: { type: 'triangle', scale: SCALES.majorPent, root: 392.0 }, // alphorn-ish
  valentines: { type: 'sine', scale: SCALES.majorPent, root: 329.63 },
  easter: { type: 'sine', scale: SCALES.majorPent, root: 440.0 },
  pride: { type: 'sine', scale: SCALES.lydian, root: 349.23 },
  aprilfools: { type: 'square', scale: SCALES.dorian, root: 196.0 },
  default: { type: 'sine', scale: SCALES.majorPent, root: 261.63 },
};

let sharedAudio: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedAudio) sharedAudio = new AC();
  if (sharedAudio.state === 'suspended') void sharedAudio.resume();
  return sharedAudio;
}
/** Frequency of scale degree `step` (can exceed one octave) for an event voice. */
function noteFreq(v: Voice, step: number): number {
  const n = v.scale.length;
  const oct = Math.floor(step / n);
  const semis = v.scale[((step % n) + n) % n] + oct * 12;
  return v.root * Math.pow(2, semis / 12);
}
/** Map a 0..1 position (e.g. pointer y, inverted) onto 2 octaves of the scale. */
function stepFromPosition(v: Voice, pos: number): number {
  return Math.round(Math.max(0, Math.min(1, pos)) * v.scale.length * 2);
}
function pluck(event: SpecialEventType, step: number, when = 0, length = 0.22, gainLevel = 0.03) {
  const ac = audioCtx();
  if (!ac) return;
  const v = VOICES[event] ?? VOICES.default;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = v.type;
  osc.frequency.setValueAtTime(noteFreq(v, step), t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gainLevel, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

function playEventSound(enabled: boolean, event: SpecialEventType, variant = 0, pos?: number) {
  if (!enabled) return;
  try {
    const v = VOICES[event] ?? VOICES.default;
    const step = pos !== undefined ? stepFromPosition(v, pos) : variant % (v.scale.length * 2);
    pluck(event, step);
  } catch {
    /* optional */
  }
}

/** A short rising arpeggio for "perfect" moments (achievements, all eggs found…). */
function playMelody(enabled: boolean, event: SpecialEventType) {
  if (!enabled) return;
  try {
    const v = VOICES[event] ?? VOICES.default;
    const n = v.scale.length;
    [0, 2, 4, n, n + 2, n + 4].forEach((step, i) => pluck(event, step, i * 0.09, 0.35, 0.035));
  } catch {
    /* optional */
  }
}

/** A held tone that glides with the pointer while it is pressed. */
function createDrone(event: SpecialEventType) {
  const ac = audioCtx();
  if (!ac) return null;
  const v = VOICES[event] ?? VOICES.default;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const lp = ac.createBiquadFilter();
  osc.type = v.type === 'square' ? 'triangle' : v.type;
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.018, ac.currentTime + 0.08);
  osc.connect(lp).connect(g).connect(ac.destination);
  osc.start();
  let lastStep = -1;
  return {
    // x picks the scale note (stepped, so it stays in key); y adds vibrato depth
    move(x: number, y: number) {
      const step = stepFromPosition(v, x);
      const t = ac.currentTime;
      if (step !== lastStep) {
        osc.frequency.setTargetAtTime(noteFreq(v, step), t, 0.03);
        lastStep = step;
      }
      lp.frequency.setTargetAtTime(600 + (1 - y) * 2400, t, 0.05);
    },
    stop() {
      const t = ac.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.stop(t + 0.2);
    },
  };
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.35, x - size * 0.55, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.55, y - size, x + size, y - size * 0.35, x, y + size * 0.35);
  ctx.fill();
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number,
  vx: number,
  mode: 'follow' | 'flee' | 'breakdance',
  lookAngle: number,
  phantom = 0
) {
  ctx.save();
  ctx.translate(x, y);

  const r = 22;
  const danceColors = ['#39ff14', '#ff7518', '#00e5ff', '#ff00ff'];
  const glowColor =
    mode === 'breakdance'
      ? danceColors[Math.floor(phase * 1.5) % danceColors.length]
      : mode === 'flee'
        ? '#ff7518'
        : '#39ff14';

  // Breakdance: cycles through moves every ~4s of dance time
  //  0 toprock      1 windmill     2 headspin     3 freeze      4 moonwalk
  //  5 kangaroo     6 floor roll   7 the crawl (Raygun specials)
  const move = mode === 'breakdance' ? Math.floor(phase / 6) % 8 : -1;
  if (mode === 'breakdance') {
    const t = phase % 6;
    if (move === 0) {
      ctx.translate(Math.sin(phase * 1.2) * 6, Math.abs(Math.sin(phase * 2.4)) * -6);
      ctx.rotate(Math.sin(phase * 2.4) * 0.25);
    } else if (move === 1) {
      ctx.translate(0, Math.sin(phase * 2) * 3);
      ctx.rotate(phase * 2.2);
    } else if (move === 2) {
      ctx.translate(0, -4);
      ctx.rotate(Math.PI);
      ctx.scale(Math.cos(phase * 6), 1);
    } else if (move === 3) {
      ctx.rotate(-0.9 + (t > 5.6 ? Math.sin(phase * 30) * 0.05 : 0));
      ctx.translate(-6, 4);
    } else if (move === 4) {
      ctx.translate(Math.sin(phase * 0.9) * 18, 0);
      ctx.scale(Math.cos(phase * 0.9) > 0 ? 1 : -1, 1);
      ctx.rotate(-0.12);
    } else if (move === 5) {
      // kangaroo: crouched hops forward and back, squash on landing
      const hop = Math.abs(Math.sin(phase * 3));
      ctx.translate(Math.sin(phase * 1.5) * 16, -hop * 14);
      ctx.scale(1 + (1 - hop) * 0.12, 1 - (1 - hop) * 0.14);
    } else if (move === 6) {
      // floor roll: lying sideways, rolling across the floor
      ctx.translate(Math.sin(phase * 1.1) * 20, 10);
      ctx.rotate(Math.PI / 2 + Math.sin(phase * 1.1) * 0.4);
    } else {
      // the crawl: low to the ground, shuffling side to side
      ctx.translate(Math.sin(phase * 2.2) * 10, 10);
      ctx.scale(1.15, 0.72);
      ctx.rotate(Math.sin(phase * 4.4) * 0.12);
    }
  } else {
    const tilt = Math.max(-0.22, Math.min(0.22, vx * 0.07));
    ctx.rotate(tilt);
  }

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = mode === 'breakdance' ? 20 : 12;
  // phantom 0..1: the white sheet goes fully transparent and the outline turns dashed
  const bodyAlpha = (mode === 'flee' ? 0.94 : 0.92) * (1 - phantom);
  ctx.fillStyle = mode === 'flee' ? `rgba(255, 240, 230, ${bodyAlpha})` : `rgba(245, 248, 255, ${bodyAlpha})`;
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1.5;
  if (phantom > 0.5) {
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -phase * 12;
  }

  // Sheet body with wavy skirt folds
  ctx.beginPath();
  ctx.arc(0, -6, r, Math.PI, 0, false);
  ctx.lineTo(r, 18);
  const folds = 4;
  const foldW = (r * 2) / folds;
  for (let i = 0; i < folds; i++) {
    const fx1 = r - i * foldW - foldW * 0.5;
    const fx2 = r - (i + 1) * foldW;
    const wave = Math.sin(phase * 2.2 + i * 1.3) * 4.5;
    ctx.quadraticCurveTo(fx1, 24 + wave, fx2, 17 - wave * 0.3);
  }
  ctx.lineTo(-r, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Breakdance outfit: green tracksuit over the sheet's lower half with yellow stripes
  if (mode === 'breakdance') {
    ctx.save();
    ctx.clip(); // stay inside the body path we just drew
    ctx.fillStyle = `rgba(0, 135, 62, ${0.95 - phantom * 0.6})`;
    ctx.fillRect(-r - 2, 2, r * 2 + 4, 28);
    ctx.fillStyle = `rgba(255, 214, 10, ${1 - phantom * 0.6})`;
    ctx.fillRect(-r - 2, 6, r * 2 + 4, 2.5); // chest stripe
    ctx.fillRect(-r + 4, 2, 2.5, 28); // side stripes
    ctx.fillRect(r - 6.5, 2, 2.5, 28);
    ctx.restore();
  }

  // Stubby ghost arms
  const armWave =
    move === 5 ? -10 // kangaroo: paws held up
      : move === 7 ? Math.sin(phase * 4.4) * 6 // crawl: paddling
        : mode === 'breakdance' ? Math.sin(phase * 5) * 9
          : mode === 'flee' ? -8 : Math.sin(phase * 1.8) * 3;
  ctx.beginPath();
  ctx.ellipse(-r - 3, 2 + armWave, 6, 3.5, -0.35, 0, Math.PI * 2);
  ctx.ellipse(r + 3, 2 - armWave, 6, 3.5, 0.35, 0, Math.PI * 2);
  ctx.fill();
  if (phantom > 0.5) ctx.stroke();
  ctx.setLineDash([]);

  // Green cap with a yellow brim and button while dancing
  if (mode === 'breakdance') {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.fillStyle = '#00873e';
    ctx.beginPath();
    ctx.arc(0, -18, r * 0.78, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.ellipse(r * 0.55, -18, r * 0.62, 3.2, -0.08, 0, Math.PI * 2); // brim, worn forward
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -18 - r * 0.78, 2.2, 0, Math.PI * 2); // button
    ctx.fill();
    ctx.restore();
  }

  // Face details
  ctx.shadowBlur = 0;
  const ex = Math.cos(lookAngle) * 3.5;
  const ey = Math.sin(lookAngle) * 2.5;

  if (mode === 'breakdance') {
    // Cool pixel shades while breakdancing
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(-13, -12, 11, 6);
    ctx.fillRect(2, -12, 11, 6);
    ctx.fillRect(-2, -11, 4, 2);
    ctx.fillStyle = glowColor;
    ctx.fillRect(-11, -11, 4, 2);
    ctx.fillRect(4, -11, 4, 2);
    // boombox grin
    ctx.strokeStyle = '#0a0612';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -1, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();
  } else if (mode === 'flee') {
    // Wide startled eyes + O mouth + '!' panic marker
    ctx.fillStyle = '#0a0612';
    ctx.beginPath();
    ctx.arc(-7 + ex * 0.5, -9 + ey * 0.5, 4.2, 0, Math.PI * 2);
    ctx.arc(7 + ex * 0.5, -9 + ey * 0.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7 + ex * 0.5, -9 + ey * 0.5, 1.5, 0, Math.PI * 2);
    ctx.arc(7 + ex * 0.5, -9 + ey * 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0612';
    ctx.beginPath();
    ctx.ellipse(0, 1, 3.8, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff7518';
    ctx.font = 'bold 14px "Monaspace Neon", monospace';
    ctx.fillText('!', -3, -r - 12);
  } else {
    // Cute stalking eyes looking toward pointer
    ctx.fillStyle = '#0a0612';
    ctx.beginPath();
    ctx.arc(-7 + ex, -9 + ey, 3.2, 0, Math.PI * 2);
    ctx.arc(7 + ex, -9 + ey, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#39ff14';
    ctx.beginPath();
    ctx.arc(-6 + ex, -10 + ey, 1.1, 0, Math.PI * 2);
    ctx.arc(8 + ex, -10 + ey, 1.1, 0, Math.PI * 2);
    ctx.fill();
    // Little spooky smile
    ctx.strokeStyle = '#0a0612';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ex * 0.4, -2 + ey * 0.3, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDecoratedEgg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  stripeColor: string,
  wobble: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(wobble) * 0.18);
  ctx.fillStyle = color;
  ctx.strokeStyle = stripeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.72, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // decorative zig-zag stripe across egg
  ctx.beginPath();
  ctx.moveTo(-size * 0.65, 0);
  for (let i = -2; i <= 2; i++) {
    ctx.lineTo((i * size * 0.65) / 2, i % 2 === 0 ? -3 : 3);
  }
  ctx.stroke();
  ctx.restore();
}

export function EventCanvas({
  event,
  weather = 'sunny',
  isDaytime = true,
  reducedMotion,
  intensity = 'standard',
  soundEnabled = false,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let visible = !document.hidden;
    let pointerX = -1000;
    let pointerY = -1000;
    let prevPointerX = -1000;
    let prevPointerY = -1000;
    let pointerSpeed = 0;
    let scrollY = window.scrollY;
    let scrollVelocity = 0;

    const density = intensity === 'quiet' ? 0.55 : intensity === 'party' ? 1.35 : 1;

    // =========================================================================
    // 0A. SCROLL-SENSITIVE FLOATING MOTES — Depth-layered parallax particles
    // =========================================================================
    type ScrollMote = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      z: number;
      size: number;
      alpha: number;
      phase: number;
    };
    const scrollMotes: ScrollMote[] = [];

    // =========================================================================
    // 0. WEATHER PARTICLE STATE — Always active based on live weather
    // =========================================================================
    type WeatherParticle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      phase: number;
    };
    type RainSplash = { x: number; y: number; r: number; maxR: number };
    const weatherParticles: WeatherParticle[] = [];
    const splashes: RainSplash[] = [];
    let lightningFlash = 0;

    // =========================================================================
    // 1. HALLOWEEN STATE — Delayed pointer-following Ghost that flees when approached & breakdances when idle
    // =========================================================================
    type GhostWisp = { x: number; y: number; life: number; color: string };
    const ghostWisps: GhostWisp[] = [];
    const ghost = {
      x: 240,
      y: 200,
      vx: 0,
      vy: 0,
      phase: 0,
      idleFrames: 0,
      fleeFrames: 0,
      inited: false,
      phantom: 0, // 0 solid → 1 see-through with dashed outline
      phantomTarget: 0,
      phantomTimer: 400,
    };

    // =========================================================================
    // 2. CHRISTMAS STATE — Falling snow + settling snowbank + wind brush
    // =========================================================================
    type Flake = { x: number; y: number; vx: number; vy: number; r: number; phase: number };
    const flakes: Flake[] = [];
    const snowBins = 96;
    const snowHeight = new Float32Array(snowBins);

    // =========================================================================
    // 3. NEW YEAR STATE — Ascending rockets + chrysanthemum rings + "WYSS" skywriting
    // =========================================================================
    type Rocket = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; color: string; spell?: boolean };
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    let launchCount = 0;

    // =========================================================================
    // 4. VALENTINE'S STATE — Constellation hearts + magnetic pulse
    // =========================================================================
    type HeartNode = { x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number; hue: number };
    const hearts: HeartNode[] = [];
    let pulseWave: { x: number; y: number; r: number; active: boolean } = { x: 0, y: 0, r: 0, active: false };

    // =========================================================================
    // 5. EASTER STATE — Hidden egg hunt around screen edges + hopping bunny reward
    // =========================================================================
    type HiddenEgg = { x: number; y: number; size: number; color: string; stripe: string; found: boolean; wobble: number; popY: number };
    const eggs: HiddenEgg[] = [];
    let eggsFound = 0;
    let bunnyX = -80;
    let bunnyActive = false;

    // =========================================================================
    // 6. PRIDE STATE — Flowing 6-band rainbow ribbon painter + prism wave
    // =========================================================================
    type RibbonPoint = { x: number; y: number; age: number };
    const ribbon: RibbonPoint[] = [];
    const prisms: Array<{ x: number; y: number; r: number; maxR: number }> = [];

    // =========================================================================
    // 7. SWISS NATIONAL DAY STATE — Alpine peaks + Höhenfeuer bonfires + Swiss cross rockets
    // =========================================================================
    type Ember = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number };
    const embers: Ember[] = [];

    // =========================================================================
    // 8. APRIL FOOLS STATE — Runaway button + glitch popups + screen tear
    // =========================================================================
    const runawayBtn = { x: 260, y: 180, vx: 0, vy: 0, w: 148, h: 36, dodges: 0, caught: false };
    type GlitchModal = { x: number; y: number; w: number; h: number; title: string; life: number };
    const modals: GlitchModal[] = [];
    let tearFrames = 0;

    const initScene = () => {
      if (scrollMotes.length === 0) {
        const moteCount = Math.round(52 * density);
        for (let i = 0; i < moteCount; i++) {
          const z = rand(0.35, 1.45);
          scrollMotes.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: rand(-0.18, 0.18) * z,
            vy: rand(-0.22, 0.22) * z,
            z,
            size: rand(1.1, 2.5) * z,
            alpha: rand(0.2, 0.55),
            phase: rand(0, Math.PI * 2),
          });
        }
      }

      if (weatherParticles.length === 0) {
        const baseCount =
          weather === 'rainy' || weather === 'stormy'
            ? 85
            : weather === 'snowy'
              ? 65
              : weather === 'windy'
                ? 45
                : weather === 'foggy'
                  ? 18
                  : 38;
        const count = Math.round(baseCount * density);
        for (let i = 0; i < count; i++) {
          weatherParticles.push({
            x: rand(0, width),
            y: rand(0, height),
            vx:
              weather === 'windy'
                ? rand(2.4, 5.2)
                : weather === 'rainy' || weather === 'stormy'
                  ? rand(-1.4, -0.6)
                  : rand(-0.35, 0.35),
            vy:
              weather === 'rainy' || weather === 'stormy'
                ? rand(6.5, 11.5)
                : weather === 'snowy'
                  ? rand(0.6, 1.5)
                  : weather === 'windy'
                    ? rand(-0.3, 0.5)
                    : rand(-0.2, 0.25),
            size:
              weather === 'foggy'
                ? rand(45, 95)
                : weather === 'cloudy'
                  ? rand(2.2, 4.8)
                  : rand(1.4, 3.2),
            alpha: rand(0.22, 0.68),
            phase: rand(0, Math.PI * 2),
          });
        }
      }

      if (event === 'halloween' && !ghost.inited) {
        ghost.x = width * 0.68;
        ghost.y = height * 0.34;
        ghost.inited = true;
      } else if (event === 'christmas' && flakes.length === 0) {
        const count = Math.round(75 * density);
        for (let i = 0; i < count; i++) {
          flakes.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: rand(-0.3, 0.3),
            vy: rand(0.6, 1.6),
            r: rand(1.6, 4.2),
            phase: rand(0, Math.PI * 2),
          });
        }
      } else if (event === 'easter' && eggs.length === 0) {
        const spots = [
          [55, height - 36],
          [width * 0.24, height - 28],
          [width * 0.52, height - 32],
          [width * 0.78, height - 30],
          [width - 52, height - 36],
          [width - 42, height * 0.42],
        ];
        spots.forEach(([x, y], idx) => {
          eggs.push({
            x,
            y,
            size: 15,
            color: PASTEL_COLORS[idx % PASTEL_COLORS.length],
            stripe: PASTEL_COLORS[(idx + 2) % PASTEL_COLORS.length],
            found: false,
            wobble: idx,
            popY: 0,
          });
        });
      } else if (event === 'aprilfools') {
        runawayBtn.x = Math.min(width - 200, Math.max(80, width * 0.72));
        runawayBtn.y = Math.min(height - 140, Math.max(90, height * 0.24));
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    };

    // Spawn "WYSS" letter particles in the sky for New Year
    const spawnWordWyss = (cx: number, cy: number) => {
      const bitmap: Array<[number, number]> = [
        // W
        [-6, -2], [-6, 0], [-5, 2], [-4, 0], [-3, 2], [-2, 0], [-2, -2],
        // Y
        [0, -2], [1, -1], [2, -2], [1, 0], [1, 2],
        // S
        [4, -2], [5, -2], [4, -1], [5, 0], [5, 2], [4, 2],
        // S
        [7, -2], [8, -2], [7, -1], [8, 0], [8, 2], [7, 2],
      ];
      for (const [gx, gy] of bitmap) {
        sparks.push({
          x: cx + gx * 11,
          y: cy + gy * 11,
          vx: rand(-0.15, 0.15),
          vy: rand(-0.1, 0.2),
          life: 0,
          maxLife: 110,
          color: '#ffd60a',
          size: 3.5,
        });
      }
    };

    const explodeRocket = (r: Rocket) => {
      if (event === 'swiss') {
        // Crisp Swiss cross burst: horizontal + vertical arms in white, outer ring in red
        for (let arm = -6; arm <= 6; arm++) {
          sparks.push({
            x: r.x,
            y: r.y,
            vx: arm * 0.55,
            vy: 0,
            life: 0,
            maxLife: 75,
            color: '#ffffff',
            size: 3.4,
          });
          sparks.push({
            x: r.x,
            y: r.y,
            vx: 0,
            vy: arm * 0.55,
            life: 0,
            maxLife: 75,
            color: '#ffffff',
            size: 3.4,
          });
        }
        for (let i = 0; i < 28; i++) {
          const a = (Math.PI * 2 * i) / 28;
          sparks.push({
            x: r.x,
            y: r.y,
            vx: Math.cos(a) * 3.8,
            vy: Math.sin(a) * 3.8,
            life: 0,
            maxLife: 70,
            color: '#ff3333',
            size: 2.6,
          });
        }
        return;
      }

      if (r.spell) {
        spawnWordWyss(r.x, r.y);
        unlock('newyear', 'skywriter-wyss');
        return;
      }

      const ringCount = 34;
      for (let i = 0; i < ringCount; i++) {
        const a = (Math.PI * 2 * i) / ringCount;
        const speed = i % 2 === 0 ? 3.6 : 2.1;
        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: 0,
          maxLife: 82,
          color: i % 2 === 0 ? r.color : '#ffd60a',
          size: 2.6,
        });
      }
    };

    const draw = (time: number) => {
      if (!visible) return;
      // Pause while the gallery lightbox is open (canvas is hidden behind it anyway)
      if (document.documentElement.hasAttribute('data-lightbox-open')) {
        last = time;
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = Math.min(2, (time - last) / 16.67 || 1);
      last = time;
      ctx.clearRect(0, 0, width, height);

      // =======================================================================
      // 0A. SCROLL-SENSITIVE FLOATING MOTES RENDER
      // =======================================================================
      scrollVelocity *= Math.pow(0.88, dt);
      if (Math.abs(scrollVelocity) < 0.01) scrollVelocity = 0;
      const speedMag = Math.min(18, Math.abs(scrollVelocity));

      const moteRgb =
        weather === 'rainy' || weather === 'stormy'
          ? '130, 195, 255'
          : weather === 'snowy'
            ? '240, 248, 255'
            : weather === 'cloudy' || weather === 'foggy'
              ? '200, 215, 235'
              : isDaytime
                ? '255, 215, 90'
                : '230, 240, 255';

      for (const m of scrollMotes) {
        m.phase += 0.025 * dt;
        // Gentle autonomous float + smooth depth-scaled scroll parallax
        m.x += (m.vx + Math.sin(m.phase) * 0.16 * m.z) * dt;
        m.y += (m.vy + Math.cos(m.phase * 0.8) * 0.14 * m.z - scrollVelocity * m.z * 0.62) * dt;

        // Subtle cursor repulsion
        const cdx = m.x - pointerX;
        const cdy = m.y - pointerY;
        const cdist = Math.hypot(cdx, cdy);
        if (cdist < 95 && cdist > 1) {
          m.x += (cdx / cdist) * 0.5 * m.z * dt;
          m.y += (cdy / cdist) * 0.5 * m.z * dt;
        }

        if (m.x < -10) m.x += width + 20;
        if (m.x > width + 10) m.x -= width + 20;
        if (m.y < -20) m.y += height + 40;
        if (m.y > height + 20) m.y -= height + 40;

        const pulse = 0.65 + 0.35 * Math.sin(m.phase * 1.6);
        const boost = Math.min(0.32, speedMag * 0.02);
        const a = Math.min(0.88, m.alpha * pulse + boost);
        const r = m.size * (0.7 + Math.min(0.45, speedMag * 0.025));

        ctx.fillStyle = `rgba(${moteRgb}, ${a})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // =======================================================================
      // 0. WEATHER PARTICLE RENDER (always active unless Christmas already snows)
      // =======================================================================
      if (!(event === 'christmas' && weather === 'snowy')) {
        if (weather === 'stormy' && Math.random() < 0.004 * density) {
          lightningFlash = 1;
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(210, 230, 255, ${lightningFlash * 0.18})`;
          ctx.fillRect(0, 0, width, height);
          lightningFlash = Math.max(0, lightningFlash - 0.08 * dt);
        }

        for (const p of weatherParticles) {
          p.phase += 0.04 * dt;
          // Subtle cursor wind interaction
          const dx = p.x - pointerX;
          const dy = p.y - pointerY;
          const dist = Math.hypot(dx, dy);
          const windX = dist < 120 && dist > 1 ? (dx / dist) * 0.6 : 0;

          if (weather === 'rainy' || weather === 'stormy') {
            p.x += (p.vx + windX) * dt;
            p.y += p.vy * dt;
            ctx.strokeStyle = `rgba(130, 190, 255, ${p.alpha * 0.65})`;
            ctx.lineWidth = weather === 'stormy' ? 1.5 : 1.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 1.8, p.y + p.vy * 1.3);
            ctx.stroke();

            if (p.y >= height - 4) {
              if (splashes.length < 32 && Math.random() < 0.35) {
                splashes.push({ x: p.x, y: height - 3, r: 1, maxR: rand(6, 13) });
              }
              p.y = -12;
              p.x = rand(0, width + 80);
            }
            if (p.x < -40) p.x = width + 20;
          } else if (weather === 'snowy') {
            p.x += (p.vx + Math.sin(p.phase) * 0.35 + windX) * dt;
            p.y += p.vy * dt;
            ctx.fillStyle = `rgba(245, 250, 255, ${p.alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            if (p.y > height + 10) {
              p.y = -10;
              p.x = rand(0, width);
            }
          } else if (weather === 'windy') {
            p.x += (p.vx + windX) * dt;
            p.y += (p.vy + Math.sin(p.phase) * 0.35 - scrollVelocity * 0.35) * dt;
            ctx.fillStyle = `rgba(255, 215, 90, ${p.alpha * 0.55})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
            ctx.fill();
            if (p.x > width + 40) {
              p.x = -30;
              p.y = rand(0, height);
            }
            if (p.y < -20) p.y += height + 40;
            if (p.y > height + 20) p.y -= height + 40;
          } else if (weather === 'foggy') {
            p.x += (0.22 + windX * 0.2) * dt;
            p.y -= scrollVelocity * 0.25 * dt;
            const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.size);
            grad.addColorStop(0, `rgba(200, 210, 220, ${p.alpha * 0.12})`);
            grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            if (p.x - p.size > width) p.x = -p.size;
            if (p.y < -p.size) p.y += height + p.size * 2;
            if (p.y > height + p.size) p.y -= height + p.size * 2;
          } else {
            // cloudy or sunny / clear night stars (scroll-sensitive)
            p.x += (p.vx + windX * 0.3) * dt;
            p.y += (p.vy + Math.cos(p.phase) * 0.14 - scrollVelocity * 0.42) * dt;
            if (p.x < 0) p.x += width;
            if (p.x > width) p.x -= width;
            if (p.y < 0) p.y += height;
            if (p.y > height) p.y -= height;

            const twinkle = 0.55 + 0.45 * Math.sin(p.phase * 1.4);
            ctx.fillStyle =
              weather === 'cloudy'
                ? `rgba(195, 210, 230, ${p.alpha * 0.55 * twinkle})`
                : isDaytime
                  ? `rgba(255, 215, 80, ${p.alpha * 0.6 * twinkle})`
                  : `rgba(240, 248, 255, ${p.alpha * 0.8 * twinkle})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.r += 0.45 * dt;
          ctx.strokeStyle = `rgba(150, 205, 255, ${Math.max(0, (1 - s.r / s.maxR) * 0.5)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.r, s.r * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          if (s.r >= s.maxR) splashes.splice(i, 1);
        }
      }

      // =======================================================================
      // 1. HALLOWEEN RENDER — Smooth Pointer-Following / Touch-Fleeing / Breakdancing Ghost
      // =======================================================================
      if (event === 'halloween') {
        ghost.idleFrames += dt;
        ghost.phase += 0.065 * dt;
        if (ghost.fleeFrames > 0) ghost.fleeFrames = Math.max(0, ghost.fleeFrames - dt);

        const hasPointer = pointerX > 0 && pointerY > 0;
        const targetX = hasPointer ? pointerX : width * 0.5 + Math.cos(ghost.phase * 0.25) * 120;
        const targetY = hasPointer ? pointerY : height * 0.4 + Math.sin(ghost.phase * 0.4) * 60;
        const dx = targetX - ghost.x;
        const dy = targetY - ghost.y;
        const dist = Math.hypot(dx, dy);
        const lookAngle = Math.atan2(dy, dx);

        // Only trigger flee when the cursor actually touches the ghost's body (radius ~38px)
        if (hasPointer && dist < 38) {
          ghost.fleeFrames = 34;
          unlock('halloween', 'spooked-the-ghost');
        }

        const isBreakdancing = hasPointer && ghost.idleFrames > 145 && ghost.fleeFrames <= 0;
        const mode: 'follow' | 'flee' | 'breakdance' =
          ghost.fleeFrames > 0 ? 'flee' : isBreakdancing ? 'breakdance' : 'follow';

        if (mode === 'flee') {
          // Smoothly glide back away from the cursor at a gentle capped speed (no sudden jumps)
          const awayX = ghost.x - targetX;
          const awayY = ghost.y - targetY;
          const awayDist = Math.max(1, Math.hypot(awayX, awayY));
          const fleeSpeed = 2.6;
          const desiredVx = (awayX / awayDist) * fleeSpeed;
          const desiredVy = (awayY / awayDist) * fleeSpeed;
          ghost.vx += (desiredVx - ghost.vx) * 0.12 * dt;
          ghost.vy += (desiredVy - ghost.vy) * 0.12 * dt;
        } else if (mode === 'breakdance') {
          // Smoothly decelerate in place and groove
          ghost.vx *= Math.pow(0.88, dt);
          ghost.vy *= Math.pow(0.88, dt);

          if (Math.random() < 0.22 * density && ghostWisps.length < 32) {
            const dancePalette = ['#39ff14', '#ff7518', '#00e5ff', '#ff00ff'];
            ghostWisps.push({
              x: ghost.x + rand(-16, 16),
              y: ghost.y + rand(8, 20),
              life: 0,
              color: dancePalette[Math.floor(Math.random() * dancePalette.length)],
            });
          }

          const ringR = 16 + ((ghost.phase * 7) % 26);
          ctx.save();
          ctx.strokeStyle = `rgba(57, 255, 20, ${Math.max(0, 0.5 - ringR / 60)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(ghost.x, ghost.y + 22, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // Follow pointer with a comfortable 95px distance and soft lag/delay
          const desiredDist = 95;
          const maxFollowSpeed = 1.85;
          let desiredVx = 0;
          let desiredVy = 0;

          if (dist > desiredDist + 4) {
            const speed = Math.min(maxFollowSpeed, (dist - desiredDist) * 0.018);
            desiredVx = (dx / dist) * speed;
            desiredVy = (dy / dist) * speed;
          }

          ghost.vx += (desiredVx - ghost.vx) * 0.055 * dt;
          ghost.vy += (desiredVy - ghost.vy) * 0.055 * dt;

          if (Math.hypot(ghost.vx, ghost.vy) > 0.45 && Math.random() < 0.22 && ghostWisps.length < 32) {
            ghostWisps.push({
              x: ghost.x + rand(-5, 5),
              y: ghost.y + 14,
              life: 0,
              color: 'rgba(57, 255, 20, 0.4)',
            });
          }
        }

        ghost.x += ghost.vx * dt;
        ghost.y += ghost.vy * dt + Math.sin(ghost.phase * 1.1) * 0.22 * dt;

        // Soft viewport bounds
        const margin = 42;
        if (ghost.x < margin) {
          ghost.x = margin;
          ghost.vx = Math.max(0, ghost.vx);
        }
        if (ghost.x > width - margin) {
          ghost.x = width - margin;
          ghost.vx = Math.min(0, ghost.vx);
        }
        if (ghost.y < margin + 30) {
          ghost.y = margin + 30;
          ghost.vy = Math.max(0, ghost.vy);
        }
        if (ghost.y > height - margin) {
          ghost.y = height - margin;
          ghost.vy = Math.min(0, ghost.vy);
        }

        // Render ectoplasm / breakdance wisps behind the ghost
        for (let i = ghostWisps.length - 1; i >= 0; i--) {
          const w = ghostWisps[i];
          w.life += dt;
          const alpha = Math.max(0, 1 - w.life / 32);
          ctx.save();
          ctx.globalAlpha = alpha * 0.55;
          ctx.fillStyle = w.color;
          ctx.beginPath();
          ctx.arc(w.x, w.y - w.life * 0.3, (1 - alpha) * 6 + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (w.life >= 32) ghostWisps.splice(i, 1);
        }

        // Every so often the ghost fades into a see-through phantom for a few seconds
        ghost.phantomTimer -= dt;
        if (ghost.phantomTimer <= 0) {
          ghost.phantomTarget = ghost.phantomTarget ? 0 : Math.random() < 0.35 ? 1 : 0;
          ghost.phantomTimer = ghost.phantomTarget ? rand(50, 95) : rand(300, 700);
        }
        // fade out gently, fade back in quickly
        const k = ghost.phantomTarget > ghost.phantom ? 0.07 : 0.16;
        ghost.phantom += (ghost.phantomTarget - ghost.phantom) * k * dt;
        drawGhost(ctx, ghost.x, ghost.y, ghost.phase, ghost.vx, mode, lookAngle, ghost.phantom);
      }

      // =======================================================================
      // 2. CHRISTMAS RENDER — Snow globe with accumulating snowbank
      // =======================================================================
      else if (event === 'christmas') {
        const binW = width / snowBins;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

        for (const f of flakes) {
          f.phase += 0.04 * dt;
          // Cursor wind pushes flakes sideways & upwards
          const dx = f.x - pointerX;
          const dy = f.y - pointerY;
          const dist = Math.hypot(dx, dy);
          if (dist < 110 && dist > 1) {
            f.vx += (dx / dist) * 0.18 * dt;
            f.vy -= 0.08 * dt;
          }
          f.vx *= 0.985;
          f.vy = Math.min(2.2, f.vy + 0.015 * dt);
          f.x += (f.vx + Math.sin(f.phase) * 0.35) * dt;
          f.y += f.vy * dt;

          if (f.x < 0) f.x += width;
          if (f.x >= width) f.x -= width;

          const bin = Math.min(snowBins - 1, Math.max(0, Math.floor(f.x / binW)));
          const groundY = height - snowHeight[bin];
          if (f.y >= groundY - 2) {
            snowHeight[bin] = Math.min(52, snowHeight[bin] + f.r * 0.42);
            // Smooth neighboring bins
            if (bin > 0) snowHeight[bin - 1] = Math.min(52, snowHeight[bin - 1] + f.r * 0.18);
            if (bin < snowBins - 1) snowHeight[bin + 1] = Math.min(52, snowHeight[bin + 1] + f.r * 0.18);
            f.y = -10;
            f.x = rand(0, width);
            f.vy = rand(0.6, 1.5);
          }

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw settled snowbank along bottom
        ctx.save();
        ctx.fillStyle = 'rgba(245, 250, 255, 0.78)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i < snowBins; i++) {
          ctx.lineTo(i * binW + binW * 0.5, height - snowHeight[i]);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // =======================================================================
      // 3. NEW YEAR RENDER — Rockets + WYSS skywriting
      // =======================================================================
      else if (event === 'newyear') {
        if (Math.random() < 0.018 * density && rockets.length < 4) {
          rockets.push({
            x: rand(width * 0.15, width * 0.85),
            y: height,
            tx: rand(width * 0.2, width * 0.8),
            ty: rand(height * 0.16, height * 0.45),
            vx: rand(-0.6, 0.6),
            vy: rand(-7.5, -5.8),
            color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)],
          });
        }

        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 0.07 * dt;
          ctx.fillStyle = '#ffd60a';
          ctx.fillRect(r.x - 1.5, r.y - 4, 3, 8);
          if (r.y <= r.ty || r.vy >= -0.5) {
            explodeRocket(r);
            rockets.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 0.028 * dt;
          ctx.globalAlpha = Math.max(0, 1 - s.life / s.maxLife);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          if (s.life >= s.maxLife) sparks.splice(i, 1);
        }
        ctx.globalAlpha = 1;
      }

      // =======================================================================
      // 4. VALENTINE'S RENDER — Heart constellation web
      // =======================================================================
      else if (event === 'valentines') {
        if (pulseWave.active) {
          pulseWave.r += 6 * dt;
          ctx.strokeStyle = `rgba(255, 68, 102, ${Math.max(0, 1 - pulseWave.r / 280)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pulseWave.x, pulseWave.y, pulseWave.r, 0, Math.PI * 2);
          ctx.stroke();
          if (pulseWave.r > 280) pulseWave.active = false;
        }

        // Constellation lines between nearby hearts
        ctx.lineWidth = 1;
        for (let i = 0; i < hearts.length; i++) {
          for (let j = i + 1; j < hearts.length; j++) {
            const d = Math.hypot(hearts[i].x - hearts[j].x, hearts[i].y - hearts[j].y);
            if (d < 135) {
              ctx.strokeStyle = `rgba(255, 119, 153, ${(1 - d / 135) * 0.45})`;
              ctx.beginPath();
              ctx.moveTo(hearts[i].x, hearts[i].y);
              ctx.lineTo(hearts[j].x, hearts[j].y);
              ctx.stroke();
            }
          }
        }

        for (let i = hearts.length - 1; i >= 0; i--) {
          const h = hearts[i];
          h.life += dt;
          h.x += h.vx * dt;
          h.y += h.vy * dt;
          const alpha = Math.max(0, 1 - h.life / h.maxLife);
          ctx.fillStyle = `hsla(${h.hue}, 92%, 64%, ${alpha * 0.85})`;
          drawHeart(ctx, h.x, h.y, h.size);
          if (h.life >= h.maxLife) hearts.splice(i, 1);
        }
      }

      // =======================================================================
      // 5. EASTER RENDER — Interactive Egg Hunt + HUD counter + bunny hop
      // =======================================================================
      else if (event === 'easter') {
        for (const egg of eggs) {
          const dist = Math.hypot(pointerX - egg.x, pointerY - egg.y);
          if (!egg.found && dist < 95) {
            egg.wobble += 0.32 * dt;
          }
          if (egg.found && egg.popY < 60) {
            egg.popY += 2.4 * dt;
          }
          const alpha = egg.found ? Math.max(0, 1 - egg.popY / 60) : 0.92;
          if (alpha > 0.02) {
            ctx.globalAlpha = alpha;
            drawDecoratedEgg(ctx, egg.x, egg.y - egg.popY, egg.size, egg.color, egg.stripe, egg.wobble);
            ctx.globalAlpha = 1;
          }
        }

        // HUD pill in bottom-left showing egg hunt progress
        ctx.save();
        ctx.font = '11px "Monaspace Neon", monospace';
        ctx.fillStyle = 'rgba(20, 20, 16, 0.82)';
        ctx.strokeStyle = 'rgba(255, 179, 204, 0.55)';
        ctx.fillRect(16, height - 38, 128, 24);
        ctx.strokeRect(16, height - 38, 128, 24);
        ctx.fillStyle = '#ffb3cc';
        ctx.fillText(`EGG HUNT: ${eggsFound}/${eggs.length}`, 26, height - 22);
        ctx.restore();

        if (bunnyActive) {
          bunnyX += 3.4 * dt;
          const hopY = height - 42 - Math.abs(Math.sin(bunnyX * 0.05)) * 28;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          // body + head + tall ears
          ctx.beginPath();
          ctx.ellipse(bunnyX, hopY, 14, 10, 0, 0, Math.PI * 2);
          ctx.arc(bunnyX + 11, hopY - 6, 7, 0, Math.PI * 2);
          ctx.ellipse(bunnyX + 9, hopY - 19, 2.5, 8, -0.15, 0, Math.PI * 2);
          ctx.ellipse(bunnyX + 13, hopY - 19, 2.5, 8, 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (bunnyX > width + 60) bunnyActive = false;
        }
      }

      // =======================================================================
      // 6. PRIDE RENDER — Flowing 6-stripe rainbow ribbon + prism ripples
      // =======================================================================
      else if (event === 'pride') {
        for (let i = ribbon.length - 1; i >= 0; i--) {
          ribbon[i].age += dt;
          if (ribbon[i].age > 95) ribbon.splice(i, 1);
        }

        if (ribbon.length > 2) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 4;
          PRIDE_COLORS.forEach((color, bandIdx) => {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < ribbon.length; i++) {
              const pt = ribbon[i];
              const offset = (bandIdx - 2.5) * 4.5 + Math.sin(pt.age * 0.12 + i * 0.2) * 3;
              if (i === 0) ctx.moveTo(pt.x, pt.y + offset);
              else ctx.lineTo(pt.x, pt.y + offset);
            }
            ctx.stroke();
          });
          ctx.restore();
        }

        for (let i = prisms.length - 1; i >= 0; i--) {
          const p = prisms[i];
          p.r += 4.2 * dt;
          PRIDE_COLORS.forEach((color, idx) => {
            ctx.strokeStyle = color;
            ctx.globalAlpha = Math.max(0, (1 - p.r / p.maxR) * 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(2, p.r - idx * 5), 0, Math.PI * 2);
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
          if (p.r >= p.maxR) prisms.splice(i, 1);
        }
      }

      // =======================================================================
      // 7. SWISS RENDER — Alpine silhouette + Höhenfeuer bonfires + Swiss cross fireworks
      // =======================================================================
      else if (event === 'swiss') {
        const peaks = [
          [0, height],
          [width * 0.14, height - 68],
          [width * 0.28, height - 34],
          [width * 0.46, height - 92],
          [width * 0.64, height - 42],
          [width * 0.82, height - 78],
          [width, height - 28],
          [width, height],
        ];
        ctx.save();
        ctx.fillStyle = 'rgba(26, 12, 14, 0.72)';
        ctx.strokeStyle = 'rgba(255, 51, 51, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        peaks.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Mountain bonfires (Höhenfeuer) on the 3 main peaks
        const firePeaks = [peaks[1], peaks[3], peaks[5]];
        for (const [fx, fy] of firePeaks) {
          const grad = ctx.createRadialGradient(fx, fy - 4, 2, fx, fy - 4, 22);
          grad.addColorStop(0, 'rgba(255, 230, 120, 0.95)');
          grad.addColorStop(0.5, 'rgba(255, 68, 34, 0.55)');
          grad.addColorStop(1, 'rgba(255, 51, 51, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fx, fy - 4, 22, 0, Math.PI * 2);
          ctx.fill();

          if (Math.random() < 0.35 * density && embers.length < 90) {
            embers.push({
              x: fx + rand(-4, 4),
              y: fy - 6,
              vx: rand(-0.4, 0.4),
              vy: rand(-1.6, -0.7),
              life: 0,
              maxLife: rand(35, 70),
            });
          }
        }

        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i];
          e.life += dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          ctx.fillStyle = `rgba(255, 180, 60, ${Math.max(0, 1 - e.life / e.maxLife)})`;
          ctx.fillRect(e.x, e.y, 2, 2);
          if (e.life >= e.maxLife) embers.splice(i, 1);
        }

        // Rockets & Swiss cross sparks
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 0.08 * dt;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(r.x - 1.5, r.y - 4, 3, 8);
          if (r.y <= r.ty || r.vy >= -0.4) {
            explodeRocket(r);
            rockets.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx *= 0.96;
          s.vy *= 0.96;
          ctx.globalAlpha = Math.max(0, 1 - s.life / s.maxLife);
          ctx.fillStyle = s.color;
          ctx.fillRect(s.x - s.size * 0.5, s.y - s.size * 0.5, s.size, s.size);
          if (s.life >= s.maxLife) sparks.splice(i, 1);
        }
        ctx.globalAlpha = 1;
      }

      // =======================================================================
      // 8. APRIL FOOLS RENDER — Runaway button + glitch modals + screen tear
      // =======================================================================
      else if (event === 'aprilfools') {
        // Dodge cursor when it gets close to the runaway button
        const cx = runawayBtn.x + runawayBtn.w * 0.5;
        const cy = runawayBtn.y + runawayBtn.h * 0.5;
        const dist = Math.hypot(pointerX - cx, pointerY - cy);
        if (dist < 115 && !runawayBtn.caught) {
          const angle = Math.atan2(cy - pointerY, cx - pointerX) + rand(-0.4, 0.4);
          runawayBtn.vx = Math.cos(angle) * 9.5;
          runawayBtn.vy = Math.sin(angle) * 9.5;
          runawayBtn.dodges += 1;
          if (runawayBtn.dodges >= 5) unlock('aprilfools', 'dodged-5-times');
        }

        runawayBtn.x += runawayBtn.vx * dt;
        runawayBtn.y += runawayBtn.vy * dt;
        runawayBtn.vx *= 0.88;
        runawayBtn.vy *= 0.88;
        runawayBtn.x = Math.min(width - runawayBtn.w - 20, Math.max(20, runawayBtn.x));
        runawayBtn.y = Math.min(height - runawayBtn.h - 40, Math.max(75, runawayBtn.y));

        // Draw fake terminal modal windows
        ctx.font = '11px "Monaspace Neon", monospace';
        for (let i = modals.length - 1; i >= 0; i--) {
          const m = modals[i];
          m.life += dt;
          ctx.fillStyle = 'rgba(10, 10, 8, 0.92)';
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 1.5;
          ctx.fillRect(m.x, m.y, m.w, m.h);
          ctx.strokeRect(m.x, m.y, m.w, m.h);
          ctx.fillStyle = '#39ff14';
          ctx.fillRect(m.x, m.y, m.w, 18);
          ctx.fillStyle = '#0a0a08';
          ctx.fillText('WARN // KERNEL_PANIC.EXE', m.x + 6, m.y + 13);
          ctx.fillStyle = '#f8f8f0';
          ctx.fillText(m.title, m.x + 8, m.y + 42);
          if (m.life > 190) modals.splice(i, 1);
        }

        // Draw the runaway button
        ctx.save();
        ctx.fillStyle = '#141410';
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.fillRect(runawayBtn.x, runawayBtn.y, runawayBtn.w, runawayBtn.h);
        ctx.strokeRect(runawayBtn.x, runawayBtn.y, runawayBtn.w, runawayBtn.h);
        ctx.fillStyle = '#39ff14';
        ctx.font = '11px "Monaspace Neon", monospace';
        ctx.fillText(
          runawayBtn.caught ? '[ BUG FIXED! ]' : `[ FIX BUG (${runawayBtn.dodges}) ]`,
          runawayBtn.x + 12,
          runawayBtn.y + 22
        );
        ctx.restore();

        // Horizontal RGB screen-tear bars after clicks
        if (tearFrames > 0) {
          tearFrames -= dt;
          for (let i = 0; i < 5; i++) {
            const ty = rand(0, height);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(57, 255, 20, 0.22)' : 'rgba(255, 0, 255, 0.22)';
            ctx.fillRect(0, ty, width, rand(3, 14));
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      prevPointerX = pointerX;
      prevPointerY = pointerY;
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerSpeed = Math.hypot(pointerX - prevPointerX, pointerY - prevPointerY);

      if (event === 'halloween') {
        ghost.idleFrames = 0;
      } else if (event === 'christmas' && pointerSpeed > 42) {
        // Rapidly shaking cursor shakes settled snow loose!
        for (let i = 0; i < snowBins; i++) {
          snowHeight[i] *= 0.92;
        }
        unlock('christmas', 'snow-globe-shake');
      } else if (event === 'valentines' && Math.random() < 0.35 && hearts.length < 36) {
        hearts.push({
          x: pointerX + rand(-10, 10),
          y: pointerY + rand(-10, 10),
          vx: rand(-0.45, 0.45),
          vy: rand(-0.9, -0.25),
          size: rand(6, 11),
          life: 0,
          maxLife: rand(90, 150),
          hue: rand(335, 360),
        });
      } else if (event === 'pride') {
        ribbon.push({ x: pointerX, y: pointerY, age: 0 });
        if (ribbon.length > 55) ribbon.shift();
        if (ribbon.length > 35) unlock('pride', 'rainbow-painter');
      }
    };

    let drone: ReturnType<typeof createDrone> = null;
    const onPointerDown = (e: PointerEvent) => {
      if (!event) return;
      const x = e.clientX;
      const y = e.clientY;
      // note follows where you click (left = low, right = high), always in key
      playEventSound(soundEnabled, event, 0, x / width);
      if (soundEnabled && !drone) {
        drone = createDrone(event);
        drone?.move(x / width, y / height);
      }
      unlock(event, 'first-interaction');

      if (event === 'halloween') {
        const toGhostX = ghost.x - x;
        const toGhostY = ghost.y - y;
        const dist = Math.max(1, Math.hypot(toGhostX, toGhostY));
        if (dist < 48) {
          ghost.fleeFrames = 34;
        } else {
          ghost.idleFrames = 150;
        }
      } else if (event === 'christmas') {
        // Carve a scoop out of the snowbank or puff snow into the air
        const binW = width / snowBins;
        const clickBin = Math.floor(x / binW);
        for (let b = Math.max(0, clickBin - 4); b <= Math.min(snowBins - 1, clickBin + 4); b++) {
          snowHeight[b] = Math.max(0, snowHeight[b] - 12);
        }
        for (let i = 0; i < 12 && flakes.length < 130; i++) {
          flakes.push({
            x: x + rand(-18, 18),
            y: y + rand(-10, 10),
            vx: rand(-1.8, 1.8),
            vy: rand(-2.2, -0.4),
            r: rand(2, 4.5),
            phase: rand(0, 6),
          });
        }
      } else if (event === 'newyear') {
        launchCount += 1;
        rockets.push({
          x: rand(width * 0.25, width * 0.75),
          y: height,
          tx: x,
          ty: y,
          vx: (x - width * 0.5) * 0.015,
          vy: -7.6,
          color: PRIDE_COLORS[launchCount % PRIDE_COLORS.length],
          spell: launchCount % 4 === 0,
        });
      } else if (event === 'valentines') {
        pulseWave = { x, y, r: 6, active: true };
        for (const h of hearts) {
          const dx = x - h.x;
          const dy = y - h.y;
          const d = Math.max(25, Math.hypot(dx, dy));
          h.vx += (dx / d) * 1.4;
          h.vy += (dy / d) * 1.4;
        }
      } else if (event === 'easter') {
        for (const egg of eggs) {
          if (!egg.found && Math.hypot(egg.x - x, egg.y - y) < egg.size * 2.1) {
            egg.found = true;
            eggsFound += 1;
            unlock('easter', `egg-${eggsFound}`);
            if (eggsFound === eggs.length) {
              bunnyActive = true;
              bunnyX = -40;
              unlock('easter', 'all-eggs-found');
            }
          }
        }
      } else if (event === 'pride') {
        prisms.push({ x, y, r: 8, maxR: 220 });
      } else if (event === 'swiss') {
        rockets.push({
          x,
          y: height - 40,
          tx: x,
          ty: Math.min(y, height * 0.55),
          vx: rand(-0.3, 0.3),
          vy: -7.2,
          color: '#ff3333',
        });
      } else if (event === 'aprilfools') {
        tearFrames = 14;
        // Check if user managed to click the runaway button
        if (
          x >= runawayBtn.x &&
          x <= runawayBtn.x + runawayBtn.w &&
          y >= runawayBtn.y &&
          y <= runawayBtn.y + runawayBtn.h
        ) {
          runawayBtn.caught = true;
          unlock('aprilfools', 'caught-runaway-button');
          return;
        }
        const messages = [
          '418: I_AM_A_TEAPOT',
          'SEGFAULT AT 0xDEADBEEF',
          'CSS_GRAVITY_OVERFLOW',
          'DIV_NOT_CENTERED_ERR',
        ];
        if (modals.length < 5) {
          modals.push({
            x: Math.min(width - 230, Math.max(16, x - 90)),
            y: Math.min(height - 90, Math.max(60, y - 30)),
            w: 210,
            h: 62,
            title: messages[Math.floor(Math.random() * messages.length)],
            life: 0,
          });
        }
      }
    };

    const onScroll = () => {
      const nextY = window.scrollY;
      const delta = nextY - scrollY;
      scrollY = nextY;
      scrollVelocity = Math.max(-28, Math.min(28, scrollVelocity + delta * 0.24));
    };
    const onVisibility = () => {
      visible = !document.hidden;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    // Held tone that follows the pointer while pressed (mouse or touch)
    const onDronePointerMove = (e: PointerEvent) => drone?.move(e.clientX / width, e.clientY / height);
    const stopDrone = () => {
      drone?.stop();
      drone = null;
    };
    const onAchievement = (e: Event) => {
      const ev = (e as CustomEvent<{ event: SpecialEventType }>).detail?.event;
      if (ev) playMelody(soundEnabled, ev);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onDronePointerMove, { passive: true });
    window.addEventListener('pointerup', stopDrone, { passive: true });
    window.addEventListener('pointercancel', stopDrone, { passive: true });
    window.addEventListener('blur', stopDrone);
    window.addEventListener('wyss-achievement', onAchievement);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onDronePointerMove);
      window.removeEventListener('pointerup', stopDrone);
      window.removeEventListener('pointercancel', stopDrone);
      window.removeEventListener('blur', stopDrone);
      window.removeEventListener('wyss-achievement', onAchievement);
      stopDrone();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [event, weather, isDaytime, reducedMotion, intensity, soundEnabled]);

  if (reducedMotion) return null;
  return <canvas ref={ref} className={`event-canvas ${event ? `event-canvas--${event}` : ''}`} aria-hidden="true" />;
}
