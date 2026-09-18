/**
 * Notes strewn about a drawer floor and pushed around with the mouse or a finger: the
 * cabinet card and the secret card (src/components/CabinetCard.astro, SecretCard.astro).
 * `card` is the element that opens on click; a drag is not a click, so a note that was
 * dragged and let go opens nothing. The geometry and physics are in ./drag.ts.
 *
 * The notes are strewn the first time the floor has a size: a card that starts hidden
 * is laid out when it is first shown. Runs in the browser only.
 */
import { bounds, findSpot, keepInside, rotate, settle, slow, slowTurn, swing, throwSpeed, toLocal, type Box, type Sample, type Vec } from './drag';

/** How far the pointer moves before a press counts as a drag rather than a click. */
const SLACK = 4;
/** Hitting a wall at speed slaps a note square: this much push per px/s of impact. */
const IMPACT = 0.04;
/** How far a note may lie turned when strewn, in degrees; a note marked `title` keeps much straighter. */
const STREWN = 35;
const TITLE_STREWN = 5;
/** A little clear wood between a strewn note and the walls. */
const MARGIN = 6;

export function strew(card: HTMLElement, floor: HTMLElement): void {
  // With reduced motion the notes lie flat and stay flat: they slide with the hand, but never turn or fly.
  const flat = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pile = 0;
  let dragged = false;

  // A note that was dragged and let go must not open the card: the viewer honours preventDefault.
  // The flag lives from the drop to the click that follows it, and no longer: a press anywhere on
  // the card clears it, so a click on the bare wood after a drag still opens the card.
  card.addEventListener('pointerdown', () => { dragged = false; }, true);
  card.addEventListener('click', (e) => {
    if (!dragged) return;
    dragged = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  card.addEventListener('dragstart', (e) => e.preventDefault());

  /** Where the notes were strewn, so each keeps clear of the ones before it. */
  const lying: Box[] = [];
  /** One per note: strew it, and put it back at its spot on the floor after the floor changed size. */
  const strewAll: (() => void)[] = [];
  const keepAll: (() => void)[] = [];

  for (const note of card.querySelectorAll<HTMLElement>('[data-note]')) {
    // Where the note lies on top of its place in the layout: shifted by `shift`, turned by
    // `angle` about `pivot` (in its own coordinates), as in translate(shift) rotate(angle)
    // with transform-origin at the pivot. Before it is grabbed the pivot is the middle.
    let shift: Vec = { x: 0, y: 0 };
    let angle = 0;
    let pivot: Vec | null = null;
    let flying = 0;
    // Where its middle lies on the floor, as fractions of the floor's size, so a resize keeps it there.
    let spot: Vec | null = null;

    // The note's place and size in the layout, and the floor, measured fresh whenever they may have changed.
    let place: Vec = { x: 0, y: 0 };
    let w = 0;
    let h = 0;
    let middle: Vec = { x: 0, y: 0 };
    let half = 0;
    let wood: Box = { left: 0, top: 0, right: 0, bottom: 0 };
    const measure = () => {
      // Read with its transform off; no frame is painted in between.
      note.style.transform = 'none';
      const r = note.getBoundingClientRect();
      note.style.transform = '';
      place = { x: r.left, y: r.top };
      w = r.width;
      h = r.height;
      middle = { x: w / 2, y: h / 2 };
      half = Math.min(w, h) / 2;
      wood = floor.getBoundingClientRect();
    };

    const lay = () => {
      note.style.setProperty('--dx', `${shift.x}px`);
      note.style.setProperty('--dy', `${shift.y}px`);
      if (!flat) note.style.setProperty('--tilt', `${angle * 180 / Math.PI}deg`);
    };
    // Moving the pivot alone would shove the note, so the shift takes up the difference.
    const turnAbout = (to: Vec) => {
      const was = pivot ?? middle;
      const at = { x: place.x + shift.x + was.x, y: place.y + shift.y + was.y };
      const on = rotate({ x: to.x - was.x, y: to.y - was.y }, angle);
      pivot = to;
      shift = { x: at.x + on.x - place.x - to.x, y: at.y + on.y - place.y - to.y };
      note.style.transformOrigin = `${to.x}px ${to.y}px`;
    };
    // The shift that keeps the note, turned as it is now, on the wood, from where it wants to be.
    const inside = (want: Vec): Vec => {
      const p = pivot ?? middle;
      const rest = bounds(w, h, p, angle, { x: place.x + p.x, y: place.y + p.y });
      const [x, y] = keepInside(want.x, want.y, rest, wood);
      return { x, y };
    };
    /** The middle of the note, on screen, from the pivot. */
    const reach = (): Vec => {
      const p = pivot ?? middle;
      return rotate({ x: middle.x - p.x, y: middle.y - p.y }, angle);
    };
    const remember = () => {
      const p = pivot ?? middle;
      const on = reach();
      spot = {
        x: (place.x + shift.x + p.x + on.x - wood.left) / (wood.right - wood.left),
        y: (place.y + shift.y + p.y + on.y - wood.top) / (wood.bottom - wood.top),
      };
    };
    const keep = () => {
      if (!spot) return;
      measure();
      const p = pivot ?? middle;
      const on = reach();
      shift = inside({
        x: wood.left + spot.x * (wood.right - wood.left) - place.x - p.x - on.x,
        y: wood.top + spot.y * (wood.bottom - wood.top) - place.y - p.y - on.y,
      });
      lay();
    };
    keepAll.push(keep);

    // Strewn: dropped somewhere on the wood at a random turn, clear of the others where there is room.
    strewAll.push(() => {
      measure();
      const most = note.classList.contains('title') ? TITLE_STREWN : STREWN;
      angle = flat ? 0 : (Math.random() * 2 - 1) * most * Math.PI / 180;
      const rest = bounds(w, h, middle, angle, { x: place.x + middle.x, y: place.y + middle.y });
      const room = { left: wood.left + MARGIN, top: wood.top + MARGIN, right: wood.right - MARGIN, bottom: wood.bottom - MARGIN };
      const dropped = findSpot(rest.right - rest.left, rest.bottom - rest.top, room, lying, Math.random);
      lying.push(dropped);
      shift = { x: dropped.left - rest.left, y: dropped.top - rest.top };
      lay();
      remember();
      // The title card goes in last, on top of the pile, so it can be read however crowded the drawer is.
      if (note.classList.contains('title')) note.style.zIndex = String(++pile);
    });

    note.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      cancelAnimationFrame(flying);
      note.setPointerCapture(e.pointerId);
      note.style.zIndex = String(++pile);
      measure();

      // The hand becomes the pivot; the note does not budge until the pointer does.
      const was = pivot ?? middle;
      const at = { x: place.x + shift.x + was.x, y: place.y + shift.y + was.y };
      const grab = toLocal({ x: e.clientX, y: e.clientY }, at, was, angle);
      turnAbout(grab);
      lay();

      let last = { x: e.clientX, y: e.clientY };
      let moved = false;
      const trail: Sample[] = [];

      const move = (m: PointerEvent) => {
        if (!moved && Math.hypot(m.clientX - e.clientX, m.clientY - e.clientY) < SLACK) return;
        if (!moved) {
          moved = true;
          note.classList.add('is-lifted');
          card.classList.add('is-dragging');
        }
        const hand = { x: m.clientX, y: m.clientY };
        const want = { x: hand.x - place.x - grab.x, y: hand.y - place.y - grab.y };
        const next = inside(want);
        if (!flat) {
          // Towed by the hand, the note swings round by how far it actually went.
          const step = { x: next.x - shift.x, y: next.y - shift.y };
          const lever = rotate({ x: middle.x - grab.x, y: middle.y - grab.y }, angle);
          angle += swing(lever, step, half);
          // Whatever the hand pushed that the note could not follow went into a wall.
          const pressure = Math.abs(hand.x - last.x - step.x) + Math.abs(hand.y - last.y - step.y);
          angle = settle(angle, pressure);
        }
        // Turning may have poked a corner through the wall; hold the note back in.
        shift = inside(want);
        last = hand;
        lay();
        remember();
        trail.push({ t: m.timeStamp, x: shift.x, y: shift.y, a: angle });
        if (trail.length > 12) trail.shift();
      };

      // Let go, the note slides on at the speed it left the hand, spinning about its middle, until the wood stops it.
      const fly = (thrown: { v: Vec; w: number }, from: number) => {
        let v = thrown.v;
        let spin = thrown.w;
        let then = from;
        const tick = (now: number) => {
          const dt = Math.min(Math.max(now - then, 0) / 1000, 0.05);
          then = now;
          const want = { x: shift.x + v.x * dt, y: shift.y + v.y * dt };
          angle += spin * dt;
          const next = inside(want);
          // Into a wall: that way is over, and the blow presses the note square.
          const blocked = { x: want.x - next.x, y: want.y - next.y };
          let push = Math.abs(blocked.x) + Math.abs(blocked.y);
          if (blocked.x) { push += Math.abs(v.x) * IMPACT; v = { x: 0, y: v.y }; }
          if (blocked.y) { push += Math.abs(v.y) * IMPACT; v = { x: v.x, y: 0 }; }
          if (push) { angle = settle(angle, push); spin = 0; }
          // Squaring up pulls the corners in, so lean on the wall again to stay flush with it.
          if (blocked.x) want.x += Math.sign(blocked.x) * wood.right;
          if (blocked.y) want.y += Math.sign(blocked.y) * wood.bottom;
          shift = inside(want);
          v = slow(v, dt);
          spin = slowTurn(spin, dt);
          lay();
          remember();
          if (v.x || v.y || spin) flying = requestAnimationFrame(tick);
        };
        flying = requestAnimationFrame(tick);
      };

      const drop = (u: PointerEvent) => {
        note.removeEventListener('pointermove', move);
        note.removeEventListener('pointerup', drop);
        note.removeEventListener('pointercancel', drop);
        note.classList.remove('is-lifted');
        card.classList.remove('is-dragging');
        // Only a pointerup is followed by a click; after a cancel there is none to swallow.
        dragged = moved && u.type === 'pointerup';
        if (flat || !moved) return;
        turnAbout(middle);
        lay();
        fly(throwSpeed(trail, u.timeStamp), u.timeStamp);
      };
      note.addEventListener('pointermove', move);
      note.addEventListener('pointerup', drop);
      note.addEventListener('pointercancel', drop);
    });
  }

  // The floor grows and shrinks with the page (and once the fonts arrive); every note stays at its spot on it.
  // Until the floor has a size (a card still hidden) there is nowhere to strew the notes; the first size does it.
  let strewn = false;
  const settleAll = () => {
    if (!floor.offsetWidth) return;
    if (!strewn) {
      strewn = true;
      for (const s of strewAll) s();
    } else {
      for (const keep of keepAll) keep();
    }
  };
  settleAll();
  new ResizeObserver(settleAll).observe(floor);
  document.fonts.ready.then(settleAll);
}
