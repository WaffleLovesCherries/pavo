/**
 * Moving the notes lying in the cabinet drawer (src/components/CabinetCard.astro).
 * A note keeps its place in the layout and is carried by an offset and a turn on top of
 * it, so at rest, with a zero offset, nothing looks any different. It is a stiff sheet
 * towed by the point it was grabbed at: pulled by a corner it swings round until its
 * middle trails behind the hand, and pushed against a wall it turns to lie square with it.
 *
 * Angles are in radians, clockwise on screen (y grows downward), the way CSS rotate() turns.
 */
export interface Vec {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** How readily a towed note swings round; 1 is a sheet on a table with no friction of its own. */
const TOW = 0.7;
/** How fast a note pressed against a wall squares up, in radians per pixel of push. */
const SQUARE = 0.012;

export function rotate(v: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * The axis-aligned box a `w` by `h` note covers once turned by `angle` about `pivot`
 * (in the note's own coordinates), with the pivot lying `at` on screen.
 */
export function bounds(w: number, h: number, pivot: Vec, angle: number, at: Vec): Box {
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  for (const corner of [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]) {
    const p = rotate({ x: corner.x - pivot.x, y: corner.y - pivot.y }, angle);
    box.left = Math.min(box.left, at.x + p.x);
    box.right = Math.max(box.right, at.x + p.x);
    box.top = Math.min(box.top, at.y + p.y);
    box.bottom = Math.max(box.bottom, at.y + p.y);
  }
  return box;
}

/** The note's own coordinates of a screen `point`, given where its pivot lies and how it is turned. */
export function toLocal(point: Vec, at: Vec, pivot: Vec, angle: number): Vec {
  const p = rotate({ x: point.x - at.x, y: point.y - at.y }, -angle);
  return { x: pivot.x + p.x, y: pivot.y + p.y };
}

/**
 * The offset that keeps a note on the drawer floor. `note` is where the note lies at
 * rest, before any offset. A note that does not fit is held by its left and top edges.
 */
export function keepInside(dx: number, dy: number, note: Box, floor: Box): [number, number] {
  const x = Math.max(floor.left - note.left, Math.min(dx, floor.right - note.right));
  const y = Math.max(floor.top - note.top, Math.min(dy, floor.bottom - note.bottom));
  return [x, y];
}

/**
 * How far a towed note turns when its grab point moves by `step`, with its middle
 * `lever` away from that point (both on screen). Like a sheet dragged across a table,
 * it turns until the middle trails straight behind the hand, over a distance of about
 * the lever's length. `half` is half the note's shorter side: grabbed near the middle
 * the lever is short against it and the note hardly turns at all (the fall-off is steep,
 * so a grab a few pixels off the middle stays quiet).
 */
export function swing(lever: Vec, step: Vec, half: number): number {
  const dist = Math.hypot(step.x, step.y);
  const arm = Math.hypot(lever.x, lever.y);
  if (dist === 0 || arm === 0) return 0;
  // The angle from the lever round to "straight behind the motion".
  let off = Math.atan2(-step.y, -step.x) - Math.atan2(lever.y, lever.x);
  off = Math.atan2(Math.sin(off), Math.cos(off));
  const reach = arm * arm + half * half;
  return TOW * Math.sin(off) * dist * arm * arm * arm / (reach * reach);
}

/**
 * A note pressed against a wall by `pressure` pixels turns toward the nearest way of
 * lying square with it, and stops there.
 */
export function settle(angle: number, pressure: number): number {
  const square = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
  const gap = square - angle;
  const turn = Math.min(Math.abs(gap), pressure * SQUARE);
  return angle + Math.sign(gap) * turn;
}

/** A note let go keeps sliding; the oak slows it this fast, in px/s². */
const FRICTION = 1800;
/** And stops it spinning this fast, in rad/s²: a sheet on wood does not pinwheel. */
const TURN_FRICTION = 30;
/** No throw leaves the hand faster than this, in px/s, nor spinning faster than this, in rad/s. */
const MAX_THROW = 3000;
const MAX_SPIN = 8;
/** A hand that stopped this many ms before letting go throws nothing. */
const STILL = 80;
/** The stretch of movement, in ms, a throw is read from. */
const STRETCH = 100;

export interface Sample {
  /** In ms, as on pointer events. */
  t: number;
  x: number;
  y: number;
  /** The note's angle at that moment. */
  a: number;
}

/**
 * The speed a note leaves the hand with, read off the last stretch of its movement:
 * px/s along each axis and rad/s of turn. A hand that had already stopped throws nothing.
 */
export function throwSpeed(samples: Sample[], now: number): { v: Vec; w: number } {
  const rest = { v: { x: 0, y: 0 }, w: 0 };
  const last = samples[samples.length - 1];
  if (!last || now - last.t > STILL) return rest;
  let first = samples.findIndex((s) => s.t >= last.t - STRETCH);
  if (first === samples.length - 1) first -= 1;
  const from = samples[first];
  if (!from || from.t >= last.t) return rest;
  const dt = (last.t - from.t) / 1000;
  let v = { x: (last.x - from.x) / dt, y: (last.y - from.y) / dt };
  const speed = Math.hypot(v.x, v.y);
  if (speed > MAX_THROW) v = { x: v.x * MAX_THROW / speed, y: v.y * MAX_THROW / speed };
  const w = (last.a - from.a) / dt;
  return { v, w: Math.max(-MAX_SPIN, Math.min(MAX_SPIN, w)) };
}

/** A sliding speed after `dt` seconds of friction: slower along the same line, or stopped. */
export function slow(v: Vec, dt: number): Vec {
  const speed = Math.hypot(v.x, v.y);
  const left = speed - FRICTION * dt;
  if (left <= 0) return { x: 0, y: 0 };
  return { x: v.x * left / speed, y: v.y * left / speed };
}

/** A spinning speed after `dt` seconds of friction. */
export function slowTurn(w: number, dt: number): number {
  const left = Math.abs(w) - TURN_FRICTION * dt;
  return left <= 0 ? 0 : Math.sign(w) * left;
}

/** How many places are tried for a note dropped into the drawer before settling for the least crowded. */
const TRIES = 40;

/** The area two boxes share. */
export function overlap(a: Box, b: Box): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Somewhere on the floor for a box `w` by `h`, picked at random from `random` (0 to 1)
 * and, where there is room, clear of everything in `taken`: of a handful of tries the
 * least crowded wins. A box too big for the floor is held by the top-left corner.
 */
export function findSpot(w: number, h: number, floor: Box, taken: Box[], random: () => number): Box {
  const playX = Math.max(0, floor.right - floor.left - w);
  const playY = Math.max(0, floor.bottom - floor.top - h);
  let best: Box | null = null;
  let crowd = Infinity;
  for (let i = 0; i < TRIES && crowd > 0; i++) {
    const left = floor.left + random() * playX;
    const top = floor.top + random() * playY;
    const box = { left, top, right: left + w, bottom: top + h };
    const shared = taken.reduce((sum, t) => sum + overlap(box, t), 0);
    if (shared < crowd) {
      best = box;
      crowd = shared;
    }
  }
  return best!;
}
