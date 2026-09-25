import type { CreepDef, TowerDef } from '../../domain/model/types';
import { CREEP_STYLE, FAMILY_COLOR, PAL } from './palette';

// Dessins vectoriels procéduraux. Le contexte est déjà mis à l'échelle :
// une unité = une case de la grille. Les mêmes fonctions servent à la carte,
// au portrait et aux icônes du panneau de commandes.

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

/** Socle de pierre commun, plus orné à chaque niveau. */
function plinth(ctx: Ctx, cx: number, cy: number, tier: number): void {
  const s = 1.78;
  ctx.fillStyle = PAL.shadow;
  roundRect(ctx, cx - s / 2 + 0.08, cy - s / 2 + 0.12, s, s, 0.22);
  ctx.fill();
  ctx.fillStyle = PAL.stoneDark;
  roundRect(ctx, cx - s / 2, cy - s / 2, s, s, 0.22);
  ctx.fill();
  ctx.fillStyle = PAL.stone;
  roundRect(ctx, cx - s / 2 + 0.1, cy - s / 2 + 0.08, s - 0.2, s - 0.24, 0.16);
  ctx.fill();
  // Joints de pierre.
  ctx.strokeStyle = 'rgba(40,34,26,0.35)';
  ctx.lineWidth = 0.04;
  ctx.beginPath();
  ctx.moveTo(cx - s / 2 + 0.1, cy);
  ctx.lineTo(cx + s / 2 - 0.1, cy);
  ctx.moveTo(cx, cy - s / 2 + 0.1);
  ctx.lineTo(cx, cy - 0.02);
  ctx.moveTo(cx - 0.45, cy + 0.02);
  ctx.lineTo(cx - 0.45, cy + s / 2 - 0.18);
  ctx.moveTo(cx + 0.45, cy + 0.02);
  ctx.lineTo(cx + 0.45, cy + s / 2 - 0.18);
  ctx.stroke();
  if (tier >= 2) {
    ctx.strokeStyle = tier >= 3 ? PAL.gold : PAL.bronze;
    ctx.lineWidth = 0.07;
    roundRect(ctx, cx - s / 2 + 0.06, cy - s / 2 + 0.05, s - 0.12, s - 0.14, 0.18);
    ctx.stroke();
  }
}

function pips(ctx: Ctx, cx: number, cy: number, tier: number): void {
  for (let i = 0; i < tier; i++) {
    ctx.fillStyle = tier >= 3 ? PAL.gold : PAL.parchment;
    circle(ctx, cx - 0.125 * (tier - 1) + i * 0.25, cy + 0.72, 0.075);
    ctx.fill();
  }
}

export function drawTower(ctx: Ctx, def: TowerDef, cx: number, cy: number, aim: number, time: number): void {
  const col = FAMILY_COLOR[def.family];
  if (def.family === 'wall') {
    ctx.fillStyle = PAL.shadow;
    roundRect(ctx, cx - 0.85, cy - 0.78, 1.78, 1.72, 0.3);
    ctx.fill();
    const blocks: [number, number, number, number][] = [
      [-0.85, -0.85, 0.95, 0.8], [0.12, -0.85, 0.75, 0.9], [-0.85, 0.0, 0.7, 0.85], [-0.12, 0.1, 1.0, 0.75],
    ];
    for (const [x, y, w, h] of blocks) {
      ctx.fillStyle = PAL.stoneDark;
      roundRect(ctx, cx + x, cy + y, w, h, 0.14);
      ctx.fill();
      ctx.fillStyle = PAL.stone;
      roundRect(ctx, cx + x + 0.05, cy + y + 0.04, w - 0.1, h - 0.14, 0.1);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,245,220,0.12)';
      roundRect(ctx, cx + x + 0.08, cy + y + 0.06, w - 0.3, 0.12, 0.05);
      ctx.fill();
    }
    return;
  }

  plinth(ctx, cx, cy, def.tier);
  const top = cy - 0.12;
  switch (def.family) {
    case 'archer': {
      // Plateforme de bois et toit pointu ; l'arc suit la cible.
      ctx.fillStyle = col.dark;
      circle(ctx, cx, top, 0.62);
      ctx.fill();
      ctx.fillStyle = col.main;
      circle(ctx, cx, top, 0.52);
      ctx.fill();
      ctx.strokeStyle = PAL.parchment;
      ctx.lineWidth = 0.07;
      ctx.beginPath();
      const bx = cx + Math.cos(aim) * 0.32;
      const by = top + Math.sin(aim) * 0.32;
      ctx.arc(bx, by, 0.28, aim - 1.2, aim + 1.2);
      ctx.stroke();
      ctx.fillStyle = def.id === 'sniper' || def.id === 'hawkeye' ? '#3f6b4a' : '#6e3b2a';
      ctx.beginPath();
      ctx.moveTo(cx, top - 0.5);
      ctx.lineTo(cx + 0.36, top + 0.05);
      ctx.lineTo(cx - 0.36, top + 0.05);
      ctx.closePath();
      ctx.fill();
      if (def.attack?.multishot) {
        ctx.fillStyle = PAL.parchment;
        for (let i = -1; i <= 1; i++) {
          circle(ctx, cx + i * 0.16, top + 0.22, 0.05);
          ctx.fill();
        }
      }
      break;
    }
    case 'cannon': {
      const air = def.attack?.targets === 'air';
      ctx.fillStyle = col.dark;
      circle(ctx, cx, top, 0.58);
      ctx.fill();
      ctx.fillStyle = air ? '#6a5a44' : col.main;
      circle(ctx, cx, top, 0.46);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, top);
      ctx.rotate(aim);
      const len = def.tier >= 3 ? 0.95 : def.tier === 2 ? 0.82 : 0.72;
      const wid = def.id === 'mortar' || def.id === 'bombard' ? 0.36 : 0.24;
      ctx.fillStyle = '#1d1d20';
      if (air) {
        roundRect(ctx, 0, -0.26, len, 0.16, 0.05);
        ctx.fill();
        roundRect(ctx, 0, 0.1, len, 0.16, 0.05);
        ctx.fill();
      } else {
        roundRect(ctx, 0, -wid / 2, len, wid, 0.07);
        ctx.fill();
        ctx.fillStyle = '#3a3a40';
        roundRect(ctx, len - 0.14, -wid / 2 - 0.04, 0.14, wid + 0.08, 0.04);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = col.glow;
      circle(ctx, cx, top, 0.1);
      ctx.fill();
      break;
    }
    case 'frost': {
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
      ctx.fillStyle = `rgba(143, 211, 242, ${0.18 + 0.12 * pulse})`;
      circle(ctx, cx, top, 0.78);
      ctx.fill();
      const h = 0.62 + def.tier * 0.08;
      ctx.fillStyle = col.dark;
      ctx.beginPath();
      ctx.moveTo(cx, top - h);
      ctx.lineTo(cx + 0.38, top);
      ctx.lineTo(cx, top + h * 0.7);
      ctx.lineTo(cx - 0.38, top);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = col.main;
      ctx.beginPath();
      ctx.moveTo(cx, top - h + 0.08);
      ctx.lineTo(cx + 0.26, top);
      ctx.lineTo(cx, top + h * 0.7 - 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = col.glow;
      ctx.beginPath();
      ctx.moveTo(cx - 0.02, top - h + 0.14);
      ctx.lineTo(cx - 0.2, top);
      ctx.lineTo(cx - 0.02, top + 0.1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'storm': {
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.1 + cx);
      if (def.id === 'obelisk' || def.id === 'voidprism') {
        ctx.fillStyle = def.id === 'voidprism' ? '#2a1f3d' : col.dark;
        ctx.beginPath();
        ctx.moveTo(cx - 0.3, top + 0.55);
        ctx.lineTo(cx - 0.16, top - 0.7);
        ctx.lineTo(cx, top - 0.85);
        ctx.lineTo(cx + 0.16, top - 0.7);
        ctx.lineTo(cx + 0.3, top + 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = def.id === 'voidprism' ? `rgba(255, 90, 160, ${0.6 + 0.4 * pulse})` : col.glow;
        circle(ctx, cx, top - 0.35, 0.13 + 0.03 * pulse);
        ctx.fill();
      } else {
        ctx.strokeStyle = col.dark;
        ctx.lineWidth = 0.1;
        circle(ctx, cx, top, 0.5);
        ctx.stroke();
        ctx.fillStyle = `rgba(169, 140, 240, ${0.35 + 0.3 * pulse})`;
        circle(ctx, cx, top, 0.42);
        ctx.fill();
        ctx.fillStyle = col.glow;
        circle(ctx, cx, top, 0.2 + 0.05 * pulse);
        ctx.fill();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 0.05;
        for (let i = 0; i < def.tier; i++) {
          ctx.beginPath();
          ctx.ellipse(cx, top, 0.62, 0.2, time * (1 + i * 0.4) + i, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    case 'venom': {
      ctx.fillStyle = '#2d2a24';
      circle(ctx, cx, top + 0.05, 0.56);
      ctx.fill();
      ctx.fillStyle = def.id === 'acid' || def.id === 'corrosion' ? '#c9d94a' : col.main;
      circle(ctx, cx, top, 0.42);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const ph = (time * 0.9 + i * 0.33) % 1;
        ctx.fillStyle = `rgba(214, 245, 154, ${1 - ph})`;
        circle(ctx, cx + Math.sin(i * 2.1) * 0.2, top - ph * 0.5, 0.05 + 0.06 * ph);
        ctx.fill();
      }
      break;
    }
  }
  // Liseré de la seconde famille : marque visuellement une tour hybride.
  if (def.elements) {
    ctx.strokeStyle = FAMILY_COLOR[def.elements[1]].main;
    ctx.lineWidth = 0.06;
    circle(ctx, cx, top, 0.68);
    ctx.stroke();
  }
  pips(ctx, cx, cy, def.tier);
}

export interface CreepLike {
  def: CreepDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  slowPct: number;
  poisons: unknown[];
  shred: number;
  hitFlash: number;
  bob: number;
}

export function drawCreep(ctx: Ctx, c: CreepLike, dirX: number, dirY: number, time: number, showBar = true): void {
  const st = CREEP_STYLE[c.def.id] ?? CREEP_STYLE.rat;
  const r = c.def.radius * 1.3;
  const air = !!c.def.air;
  const lift = air ? 0.45 + Math.sin(time * 4 + c.bob) * 0.06 : Math.abs(Math.sin(time * 9 + c.bob)) * 0.04;
  const x = c.x;
  const y = c.y - lift;

  // Ombre portée au sol.
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath();
  ctx.ellipse(c.x + 0.04, c.y + r * 0.55, r * (air ? 0.8 : 1), r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  if (st.shape === 'wing') {
    const flap = Math.sin(time * 12 + c.bob) * 0.35;
    ctx.fillStyle = st.dark;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s * r * 2.1, y - r * (0.5 + flap));
      ctx.lineTo(x + s * r * 1.4, y + r * 0.4);
      ctx.closePath();
      ctx.fill();
    }
  }

  const flash = c.hitFlash > 0;
  ctx.globalAlpha = st.shape === 'ghost' ? 0.78 : 1;
  ctx.fillStyle = st.dark;
  if (st.shape === 'block') {
    roundRect(ctx, x - r, y - r, r * 2, r * 2, r * 0.35);
  } else if (st.shape === 'ghost') {
    ctx.beginPath();
    ctx.arc(x, y - r * 0.1, r, Math.PI, 0);
    const wave = Math.sin(time * 6 + c.bob) * r * 0.15;
    ctx.lineTo(x + r, y + r * 0.8);
    ctx.lineTo(x + r * 0.5, y + r * 0.55 + wave);
    ctx.lineTo(x, y + r * 0.85);
    ctx.lineTo(x - r * 0.5, y + r * 0.55 - wave);
    ctx.lineTo(x - r, y + r * 0.8);
    ctx.closePath();
  } else {
    circle(ctx, x, y, r);
  }
  ctx.fill();
  ctx.fillStyle = flash ? '#fff4dc' : st.body;
  if (st.shape === 'block') {
    roundRect(ctx, x - r + 0.05, y - r + 0.04, r * 2 - 0.1, r * 2 - 0.12, r * 0.3);
    ctx.fill();
  } else if (st.shape === 'ghost') {
    circle(ctx, x, y - r * 0.12, r * 0.82);
    ctx.fill();
  } else {
    circle(ctx, x, y - 0.02, r * 0.84);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Yeux orientés dans le sens de la marche.
  const len = Math.hypot(dirX, dirY) || 1;
  const fx = dirX / len;
  const fy = dirY / len;
  const ex = x + fx * r * 0.45;
  const ey = y + fy * r * 0.45 - r * 0.1;
  ctx.fillStyle = st.eye;
  for (const s of [-1, 1]) {
    circle(ctx, ex - fy * s * r * 0.32, ey + fx * s * r * 0.32, Math.max(0.035, r * 0.14));
    ctx.fill();
  }

  if (c.def.boss) {
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    const cy = y - r - 0.08;
    ctx.moveTo(x - r * 0.5, cy + 0.1);
    ctx.lineTo(x - r * 0.5, cy - 0.12);
    ctx.lineTo(x - r * 0.2, cy);
    ctx.lineTo(x, cy - 0.16);
    ctx.lineTo(x + r * 0.2, cy);
    ctx.lineTo(x + r * 0.5, cy - 0.12);
    ctx.lineTo(x + r * 0.5, cy + 0.1);
    ctx.stroke();
  }

  if (c.slowPct > 0) {
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.85)';
    ctx.lineWidth = 0.05;
    circle(ctx, x, y, r + 0.08);
    ctx.stroke();
  }
  if (c.poisons.length > 0) {
    const ph = (time * 1.4 + c.bob) % 1;
    ctx.fillStyle = `rgba(170, 230, 90, ${0.9 - ph * 0.9})`;
    circle(ctx, x + r * 0.6, y - r - ph * 0.3, 0.06);
    ctx.fill();
  }

  if (showBar && c.hp < c.maxHp) {
    const w = Math.max(0.7, r * 2.2);
    const bx = x - w / 2;
    const by = y - r - (c.def.boss ? 0.42 : 0.24);
    ctx.fillStyle = 'rgba(15, 12, 8, 0.8)';
    ctx.fillRect(bx - 0.03, by - 0.03, w + 0.06, 0.16);
    const f = Math.max(0, c.hp / c.maxHp);
    ctx.fillStyle = f > 0.5 ? PAL.good : f > 0.25 ? PAL.gold : PAL.danger;
    ctx.fillRect(bx, by, w * f, 0.1);
  }
}
