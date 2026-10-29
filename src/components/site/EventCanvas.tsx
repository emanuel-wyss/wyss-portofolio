import { useEffect, useRef } from 'react';
import type { SpecialEventType } from '../../lib/theme';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: string;
  phase: number;
};

type Props = {
  event?: SpecialEventType;
  reducedMotion: boolean;
};

const COLORS = ['#ff3355', '#ff9f1c', '#ffd60a', '#39ff14', '#00e5ff', '#8b5cf6', '#ff66cc'];
const MAX_PARTICLES = 180;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function addBurst(particles: Particle[], event: SpecialEventType, x: number, y: number) {
  const amount = event === 'newyear' || event === 'swiss' ? 42 : event === 'pride' ? 28 : 12;
  for (let i = 0; i < amount && particles.length < MAX_PARTICLES; i++) {
    const angle = (Math.PI * 2 * i) / amount + rand(-0.12, 0.12);
    const speed = rand(1.2, event === 'newyear' || event === 'swiss' ? 5.2 : 3);
    const kind =
      event === 'halloween' ? 'bat' :
      event === 'christmas' ? 'snow' :
      event === 'valentines' ? 'heart' :
      event === 'easter' ? 'egg' :
      event === 'aprilfools' ? 'pixel' :
      'spark';
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: rand(60, 140),
      size: rand(3, 9),
      color: event === 'swiss' ? (i % 3 ? '#ff3333' : '#ffffff') : COLORS[i % COLORS.length],
      kind,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.35, x - size * 0.55, y - size, x, y - size * 0.4);
  ctx.bezierCurveTo(x + size * 0.55, y - size, x + size, y - size * 0.35, x, y + size * 0.35);
  ctx.fill();
}

function drawBat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, phase: number) {
  const flap = Math.sin(phase) * size * 0.45;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - size * 0.55, y - size * 0.65 - flap, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.45, y - size * 0.15, x, y + size * 0.35);
  ctx.quadraticCurveTo(x + size * 0.45, y - size * 0.15, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.55, y - size * 0.65 - flap, x, y);
  ctx.fill();
}

export function EventCanvas({ event, reducedMotion }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!event || reducedMotion) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let scrollY = window.scrollY;
    let visible = !document.hidden;
    let pointerX = -1000;
    let pointerY = -1000;
    let autoTick = 0;
    const particles: Particle[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnAmbient = () => {
      if (particles.length >= MAX_PARTICLES) return;
      if (event === 'christmas') {
        particles.push({ x: rand(0, width), y: -10, vx: rand(-0.25, 0.25), vy: rand(0.4, 1.25), life: 0, maxLife: height * 2, size: rand(2, 5), color: '#ffffff', kind: 'snow', phase: rand(0, 6) });
      } else if (event === 'halloween' && Math.random() < 0.2) {
        particles.push({ x: -20, y: rand(50, height * 0.7), vx: rand(1, 2.3), vy: rand(-0.2, 0.2), life: 0, maxLife: width, size: rand(7, 12), color: '#1a0b24', kind: 'bat', phase: rand(0, 6) });
      } else if (event === 'valentines' && Math.random() < 0.3) {
        particles.push({ x: rand(0, width), y: height + 15, vx: rand(-0.25, 0.25), vy: rand(-0.6, -1.2), life: 0, maxLife: height * 1.5, size: rand(4, 8), color: '#ff4466', kind: 'heart', phase: rand(0, 6) });
      }
    };

    const draw = (time: number) => {
      if (!visible) return;
      const dt = Math.min(2, (time - last) / 16.67 || 1);
      last = time;
      ctx.clearRect(0, 0, width, height);
      autoTick += dt;

      const ambientEvery = event === 'christmas' ? 4 : 14;
      if (autoTick > ambientEvery) {
        spawnAmbient();
        autoTick = 0;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.phase += 0.15 * dt;

        // Event-specific physics and scroll-driven parallax.
        if (p.kind === 'spark' || p.kind === 'pixel') p.vy += 0.035 * dt;
        if (p.kind === 'snow') p.vx += Math.sin(p.phase) * 0.002 * dt;
        if (p.kind === 'heart') p.vx += Math.sin(p.phase) * 0.006 * dt;
        if (p.kind === 'egg') p.vy += 0.055 * dt;
        if (event === 'christmas' && pointerX > 0) {
          const dx = p.x - pointerX;
          const dy = p.y - pointerY;
          const dist = Math.max(30, Math.hypot(dx, dy));
          if (dist < 130) {
            p.vx += (dx / dist) * 0.025 * dt;
            p.vy += (dy / dist) * 0.015 * dt;
          }
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt + (scrollY % height) * 0.00008 * dt;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = Math.min(0.9, alpha);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.kind === 'heart') drawHeart(ctx, p.x, p.y, p.size);
        else if (p.kind === 'bat') drawBat(ctx, p.x, p.y, p.size, p.phase);
        else if (p.kind === 'snow') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === 'egg') {
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * 0.7, p.size, 0, 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === 'pixel') {
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.size * alpha), 0, Math.PI * 2); ctx.fill();
          if (event === 'swiss' && i % 7 === 0) {
            ctx.fillRect(p.x - p.size, p.y - p.size * 0.25, p.size * 2, p.size * 0.5);
            ctx.fillRect(p.x - p.size * 0.25, p.y - p.size, p.size * 0.5, p.size * 2);
          }
        }

        if (p.life >= p.maxLife || p.y > height + 30 || p.x < -50 || p.x > width + 50) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      // Hearts and April Fools paint a restrained cursor trail.
      if ((event === 'valentines' || event === 'aprilfools') && Math.random() < 0.22 && particles.length < MAX_PARTICLES) {
        addBurst(particles, event, pointerX, pointerY);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      addBurst(particles, event, e.clientX, e.clientY);
    };
    const onScroll = () => { scrollY = window.scrollY; };
    const onVisibility = () => {
      visible = !document.hidden;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(draw); }
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
  }, [event, reducedMotion]);

  if (!event || reducedMotion) return null;
  return <canvas ref={ref} className={`event-canvas event-canvas--${event}`} aria-hidden="true" />;
}
