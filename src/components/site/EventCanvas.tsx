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

function playEventSound(enabled: boolean, event: SpecialEventType, variant = 0) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audio = new AudioContextClass();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;

    if (event === 'halloween') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240 - variant * 40, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    } else if (event === 'christmas') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + variant * 220, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);
    } else if (event === 'newyear' || event === 'swiss') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
    } else if (event === 'valentines') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2);
    } else if (event === 'easter') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    } else if (event === 'pride') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + (variant % 6) * 80, now);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(160 + (variant % 4) * 190, now);
    }

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(now + 0.18);
    osc.addEventListener('ended', () => void audio.close());
  } catch {
    /* optional */
  }
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.35, x - size * 0.55, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.55, y - size, x + size, y - size * 0.35, x, y + size * 0.35);
  ctx.fill();
}

function drawBat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number, boss = false) {
  const flap = Math.sin(phase) * size * 0.55;
  ctx.save();
  ctx.fillStyle = boss ? '#ff7518' : '#c8a8e0';
  ctx.shadowColor = boss ? '#39ff14' : '#ff7518';
  ctx.shadowBlur = boss ? 14 : 6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.65 - flap, x - size * 1.15, y - flap * 0.4);
  ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.15, x, y + size * 0.32);
  ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.15, x + size * 1.15, y - flap * 0.4);
  ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.65 - flap, x, y);
  ctx.fill();
  // tiny glowing eyes
  ctx.fillStyle = boss ? '#39ff14' : '#ff3355';
  ctx.fillRect(x - 3, y - 1, 2, 2);
  ctx.fillRect(x + 1, y - 1, 2, 2);
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

    const density = intensity === 'quiet' ? 0.55 : intensity === 'party' ? 1.35 : 1;

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
    // 1. HALLOWEEN STATE — Moon + swooping bats + ghost cursor trail
    // =========================================================================
    type Bat = { x: number; y: number; vx: number; vy: number; size: number; phase: number; boss?: boolean; scared?: number };
    type GhostNode = { x: number; y: number; life: number };
    const bats: Bat[] = [];
    const ghostTrail: GhostNode[] = [];
    let batsClicked = 0;

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

      if (event === 'halloween' && bats.length === 0) {
        const count = Math.round(8 * density);
        for (let i = 0; i < count; i++) {
          bats.push({
            x: rand(0, width),
            y: rand(40, height * 0.55),
            vx: rand(0.9, 2.1) * (Math.random() < 0.5 ? 1 : -1),
            vy: rand(-0.35, 0.35),
            size: rand(9, 15),
            phase: rand(0, Math.PI * 2),
          });
        }
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
      const dt = Math.min(2, (time - last) / 16.67 || 1);
      last = time;
      ctx.clearRect(0, 0, width, height);

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
            p.y += (p.vy + Math.sin(p.phase) * 0.3) * dt;
            ctx.strokeStyle = `rgba(255, 215, 0, ${p.alpha * 0.35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - p.vx * 5, p.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            if (p.x > width + 40) {
              p.x = -30;
              p.y = rand(0, height);
            }
          } else if (weather === 'foggy') {
            p.x += (0.22 + windX * 0.2) * dt;
            const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.size);
            grad.addColorStop(0, `rgba(200, 210, 220, ${p.alpha * 0.12})`);
            grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            if (p.x - p.size > width) p.x = -p.size;
          } else {
            // cloudy or sunny / clear night stars
            p.x += (p.vx + windX * 0.3) * dt;
            p.y += (p.vy + Math.cos(p.phase) * 0.12) * dt;
            if (p.x < 0) p.x += width;
            if (p.x > width) p.x -= width;
            if (p.y < 0) p.y += height;
            if (p.y > height) p.y -= height;

            const twinkle = 0.55 + 0.45 * Math.sin(p.phase * 1.4);
            ctx.fillStyle =
              weather === 'cloudy'
                ? `rgba(195, 205, 220, ${p.alpha * 0.42 * twinkle})`
                : isDaytime
                  ? `rgba(255, 215, 80, ${p.alpha * 0.5 * twinkle})`
                  : `rgba(240, 248, 255, ${p.alpha * 0.75 * twinkle})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.75, 0, Math.PI * 2);
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
      // 1. HALLOWEEN RENDER
      // =======================================================================
      if (event === 'halloween') {
        // Eerie moon in top right with parallax
        const moonX = width - 110;
        const moonY = 95 - (scrollY * 0.06) % 40;
        ctx.save();
        const grad = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 54);
        grad.addColorStop(0, 'rgba(255, 230, 180, 0.85)');
        grad.addColorStop(0.55, 'rgba(255, 117, 24, 0.35)');
        grad.addColorStop(1, 'rgba(255, 117, 24, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Spectral ghost trail following cursor
        for (let i = ghostTrail.length - 1; i >= 0; i--) {
          const g = ghostTrail[i];
          g.life += dt;
          const alpha = Math.max(0, 1 - g.life / 35);
          ctx.fillStyle = `rgba(57, 255, 20, ${alpha * 0.28})`;
          ctx.beginPath();
          ctx.arc(g.x, g.y - g.life * 0.4, (1 - alpha) * 14 + 4, 0, Math.PI * 2);
          ctx.fill();
          if (g.life >= 35) ghostTrail.splice(i, 1);
        }

        // Bats flying & reacting to cursor
        for (const b of bats) {
          b.phase += (b.scared ? 0.42 : 0.2) * dt;
          if (b.scared && b.scared > 0) b.scared -= dt;
          b.x += b.vx * dt;
          b.y += (b.vy + Math.sin(b.phase * 0.5) * 0.35) * dt;

          if (b.x > width + 40) b.x = -35;
          if (b.x < -40) b.x = width + 35;
          if (b.y < 30) b.vy = Math.abs(b.vy) + 0.2;
          if (b.y > height * 0.75) b.vy = -Math.abs(b.vy) - 0.2;

          drawBat(ctx, b.x, b.y, b.size, b.phase, b.boss);
        }
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
        ctx.font = '11px "Geist Mono", monospace';
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
        ctx.font = '11px "Geist Mono", monospace';
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
        ctx.font = '11px "Geist Mono", monospace';
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

      if (event === 'halloween' && Math.random() < 0.45) {
        ghostTrail.push({ x: pointerX, y: pointerY, life: 0 });
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

    const onPointerDown = (e: PointerEvent) => {
      if (!event) return;
      const x = e.clientX;
      const y = e.clientY;
      playEventSound(soundEnabled, event, Math.floor(Math.random() * 6));
      unlock(event, 'first-interaction');

      if (event === 'halloween') {
        let hitBat = false;
        for (const b of bats) {
          if (Math.hypot(b.x - x, b.y - y) < b.size * 2.2) {
            b.vx = (b.x - x) * 0.25 || 3.2;
            b.vy = -2.8;
            b.scared = 45;
            hitBat = true;
            batsClicked += 1;
          }
        }
        if (hitBat && batsClicked === 3) {
          bats.push({ x: -30, y: y, vx: 2.6, vy: -0.2, size: 24, phase: 0, boss: true });
          unlock('halloween', 'boss-bat-summoned');
        } else if (!hitBat && bats.length < 18) {
          bats.push({
            x,
            y,
            vx: rand(1.4, 2.8) * (Math.random() < 0.5 ? 1 : -1),
            vy: rand(-1.2, -0.3),
            size: rand(10, 15),
            phase: 0,
          });
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
      scrollY = window.scrollY;
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
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [event, weather, isDaytime, reducedMotion, intensity, soundEnabled]);

  if (reducedMotion) return null;
  return <canvas ref={ref} className={`event-canvas ${event ? `event-canvas--${event}` : ''}`} aria-hidden="true" />;
}
