"use client";

import * as React from "react";
import {
  usePageVisible,
  usePrefersReducedMotion,
} from "@/lib/motion/reduced-motion";

interface Particle {
  /** angle around the central axis */
  theta: number;
  /** distance from the central axis (px) */
  r: number;
  /** vertical position relative to centre (px, negative = up) */
  y: number;
  /** initial spawn height (negative = high) */
  yStart: number;
  /** lifetime in ms */
  life: number;
  /** age in ms */
  age: number;
  /** rising velocity (px / ms) */
  vy: number;
  /** angular velocity (rad / ms) */
  omega: number;
  size: number;
  baseAlpha: number;
}

interface Props {
  /** Centre of the swirl in column-local px. */
  cx: number;
  cy: number;
  /** Radius of the swirl (max horizontal extent). */
  radius?: number;
  /** Tint colour (the character accent). Mixed with cream. */
  accent: string;
}

const TOTAL = 30;

/**
 * Mystical "energy" of an island — small bright motes rise from the
 * base of the island in a slow spiral, fade in/out across their
 * lifetime. Tinted toward the character's accent. Canvas 2D, paused
 * when the tab is hidden, disabled under prefers-reduced-motion.
 */
export function IslandAura({ cx, cy, radius = 250, accent }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();

  // 60% accent + 40% cream → rgb tuple
  const tinted = React.useMemo(() => mixHex(accent, "#FFF1D8", 0.6), [accent]);

  React.useEffect(() => {
    if (reduced) return;
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function fit() {
      if (!canvas) return;
      const w = radius * 2;
      const h = radius * 2.2;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();

    function spawn(p: Particle | null): Particle {
      const r = Math.random() * radius * 0.85;
      const yStart = radius * 0.7 + Math.random() * 40; // start near base
      const life = 4000 + Math.random() * 2000;
      const out: Particle = p ?? ({} as Particle);
      out.theta = Math.random() * Math.PI * 2;
      out.r = r;
      out.y = yStart;
      out.yStart = yStart;
      out.life = life;
      out.age = Math.random() * life; // stagger
      out.vy = -(0.05 + Math.random() * 0.06);
      out.omega = (Math.random() < 0.5 ? -1 : 1) * (0.0006 + Math.random() * 0.0008);
      out.size = 1.5 + Math.random() * 2.5;
      out.baseAlpha = 0.4 + Math.random() * 0.5;
      return out;
    }

    particlesRef.current = Array.from({ length: TOTAL }, () => spawn(null));

    let raf = 0;
    let last = performance.now();

    function frame(now: number) {
      const dt = Math.min(48, now - last);
      last = now;
      if (!ctx || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const list = particlesRef.current;
      const centreX = w / 2;
      const centreY = h * 0.5;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        p.age += dt;
        if (p.age > p.life) {
          spawn(p);
          continue;
        }
        p.theta += p.omega * dt;
        p.y += p.vy * dt;
        // ease in/out alpha
        const t = p.age / p.life;
        const env = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
        const alpha = p.baseAlpha * env;
        const x = centreX + Math.cos(p.theta) * p.r;
        const y = centreY + p.y;
        // halo
        const haloR = p.size * 4;
        const g = ctx.createRadialGradient(x, y, 0, x, y, haloR);
        g.addColorStop(0, withAlpha(tinted, alpha));
        g.addColorStop(0.45, withAlpha(tinted, alpha * 0.35));
        g.addColorStop(1, withAlpha(tinted, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fill();
        // bright core
        ctx.fillStyle = withAlpha("#FFFBEC", Math.min(1, alpha * 1.4));
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame((t) => {
      last = t;
      frame(t);
    });

    return () => cancelAnimationFrame(raf);
  }, [reduced, visible, radius, tinted]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: cx - radius,
        top: cy - radius,
        zIndex: 3,
        mixBlendMode: "screen",
      }}
    />
  );
}

function mixHex(a: string, b: string, t: number): string {
  // t = 0 → all b, t = 1 → all a
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r * t + pb.r * (1 - t));
  const g = Math.round(pa.g * t + pb.g * (1 - t));
  const blue = Math.round(pa.b * t + pb.b * (1 - t));
  return `rgb(${r}, ${g}, ${blue})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function withAlpha(color: string, a: number): string {
  if (color.startsWith("rgb(")) {
    const inner = color.slice(4, -1);
    return `rgba(${inner}, ${a.toFixed(3)})`;
  }
  const p = parseHex(color);
  if (!p) return color;
  return `rgba(${p.r}, ${p.g}, ${p.b}, ${a.toFixed(3)})`;
}
