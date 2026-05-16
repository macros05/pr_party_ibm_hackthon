"use client";

import * as React from "react";
import {
  usePageVisible,
  usePrefersReducedMotion,
} from "@/lib/motion/reduced-motion";
import { useWindMultRef } from "@/lib/motion/wind";

interface Mote {
  x: number;
  y: number;
  vy: number;
  size: number;
  /** 0 = tiny pixel, 1 = medium halo, 2 = large halo */
  tier: 0 | 1 | 2;
  phase: number;
  speed: number;
  baseAlpha: number;
}

const COUNT = 80;
const COLOR_LIGHT = "#FFF5E1";
const COLOR_WARM = "#FFDFA8";

/**
 * Cream motes on a full-bleed canvas with three tiers of size:
 *   - 60% tier-0 (1-2px, sharp)
 *   - 30% tier-1 (3-4px with a soft halo)
 *   - 10% tier-2 (5-7px with a wide warm halo)
 * Tier-2 motes drift faster, giving a sense of depth (close to camera).
 * Pauses when the tab is hidden and freezes on a single frame under
 * prefers-reduced-motion. The global wind cycle briefly accelerates
 * upward drift to 1.5x.
 */
export function AmbientParticles() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const motesRef = React.useRef<Mote[]>([]);
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();
  const windRef = useWindMultRef();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function seed() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const m: Mote[] = [];
      for (let i = 0; i < COUNT; i++) {
        const r = Math.random();
        let tier: 0 | 1 | 2;
        let size: number;
        let vy: number;
        let baseAlpha: number;
        if (r < 0.6) {
          tier = 0;
          size = 1 + Math.random() * 1;
          vy = -(0.15 + Math.random() * 0.2);
          baseAlpha = 0.3 + Math.random() * 0.2;
        } else if (r < 0.9) {
          tier = 1;
          size = 3 + Math.random() * 1;
          vy = -(0.25 + Math.random() * 0.25);
          baseAlpha = 0.5 + Math.random() * 0.2;
        } else {
          tier = 2;
          size = 5 + Math.random() * 2;
          vy = -(0.4 + Math.random() * 0.3);
          baseAlpha = 0.7 + Math.random() * 0.2;
        }
        m.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vy,
          size,
          tier,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.8,
          baseAlpha,
        });
      }
      motesRef.current = m;
    }
    seed();

    let raf = 0;
    let t = 0;

    function frame() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const motes = motesRef.current;
      const gust = windRef.current;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        if (!reduced) {
          m.y += m.vy * gust;
          if (m.y < -20) {
            m.y = h + Math.random() * 40;
            m.x = Math.random() * w;
          }
        }
        const flicker = (Math.sin(t * m.speed + m.phase) + 1) * 0.25;
        const alpha = m.baseAlpha * (0.6 + flicker);
        if (m.tier === 0) {
          ctx.fillStyle = withAlpha(COLOR_LIGHT, alpha);
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // halo via radial gradient
          const haloR = m.size * (m.tier === 1 ? 3 : 5);
          const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, haloR);
          const color = m.tier === 1 ? COLOR_LIGHT : COLOR_WARM;
          g.addColorStop(0, withAlpha(color, alpha));
          g.addColorStop(0.4, withAlpha(color, alpha * 0.4));
          g.addColorStop(1, withAlpha(color, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y, haloR, 0, Math.PI * 2);
          ctx.fill();
          // bright core dot
          ctx.fillStyle = withAlpha(color, Math.min(1, alpha * 1.6));
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      t += 0.016;
      raf = requestAnimationFrame(frame);
    }

    if (reduced || !visible) {
      // static snapshot — one paint
      frame();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced, visible, windRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[4]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

function withAlpha(hex: string, a: number) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}
