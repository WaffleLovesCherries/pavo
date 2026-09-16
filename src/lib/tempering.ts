/**
 * Geometry for the tempering curves (src/components/TemperingChart.astro).
 * A chocolate goes room temperature → melted → cooled → working temperature;
 * this turns the three ranges in src/config/tempering.ts into a time/temperature
 * path that an SVG can draw. Pure functions, so they are unit-tested with node:test.
 */
import { ROOM_TEMP, TEMP_AXIS, type Chocolate, type TempRange } from '../config/tempering.ts';

export type Stage = 'melt' | 'cool' | 'work';
export const STAGES: Stage[] = ['melt', 'cool', 'work'];

/** Where along the curve (0–1) each stage's flat stretch sits. */
const PLATEAU: Record<Stage, [number, number]> = {
  melt: [0.22, 0.38],
  cool: [0.56, 0.66],
  work: [0.82, 1],
};

export interface Keypoint { t: number; temp: number }
export interface Plateau { stage: Stage; from: number; to: number; temp: number; range: TempRange }

/** The plot area in SVG units; `top/right/bottom/left` are the margins inside width × height. */
export interface Frame {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const mid = ([lo, hi]: TempRange): number => (lo + hi) / 2;

/** Problems with a chocolate's numbers, empty when they make sense. Lets the build fail with a useful message. */
export function checkChocolate(c: Chocolate): string[] {
  const errors: string[] = [];
  for (const stage of STAGES) {
    const [lo, hi] = c[stage];
    if (!(lo <= hi)) errors.push(`${c.name}: ${stage} range ${lo}–${hi} is reversed`);
  }
  if (!(mid(c.cool) < mid(c.work))) errors.push(`${c.name}: cool must be below work`);
  if (!(mid(c.work) < mid(c.melt))) errors.push(`${c.name}: work must be below melt`);
  return errors;
}

export function plateaus(c: Chocolate): Plateau[] {
  return STAGES.map((stage) => ({ stage, from: PLATEAU[stage][0], to: PLATEAU[stage][1], temp: mid(c[stage]), range: c[stage] }));
}

/** The corners of the curve: the start, then both ends of every plateau. */
export function keypoints(c: Chocolate): Keypoint[] {
  const pts: Keypoint[] = [{ t: 0, temp: ROOM_TEMP }];
  for (const p of plateaus(c)) pts.push({ t: p.from, temp: p.temp }, { t: p.to, temp: p.temp });
  return pts;
}

export function scaleX(t: number, f: Frame): number {
  return f.left + t * (f.width - f.left - f.right);
}

export function scaleY(temp: number, f: Frame): number {
  const [lo, hi] = TEMP_AXIS;
  const plotH = f.height - f.top - f.bottom;
  return f.top + plotH * (1 - (temp - lo) / (hi - lo));
}

const r = (n: number) => Math.round(n * 100) / 100;

/** The curve as an SVG path: cubic beziers with flat tangents, so plateaus are straight and ramps ease in and out. */
export function curvePath(c: Chocolate, f: Frame): string {
  const pts = keypoints(c).map((p) => ({ x: scaleX(p.t, f), y: scaleY(p.temp, f) }));
  let d = `M${r(pts[0]!.x)} ${r(pts[0]!.y)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const cx = (b.x - a.x) / 2;
    d += ` C${r(a.x + cx)} ${r(a.y)} ${r(b.x - cx)} ${r(b.y)} ${r(b.x)} ${r(b.y)}`;
  }
  return d;
}

/** Y-axis ticks every `step` degrees, inside the axis. */
export function ticks(step = 10): number[] {
  const [lo, hi] = TEMP_AXIS;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) out.push(t);
  return out;
}

/** "45–50" or "31" when the range is a single value. */
export function formatRange([lo, hi]: TempRange): string {
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}
