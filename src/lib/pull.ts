/**
 * The brass handle under the header (src/components/TemperingDrop.astro) can be dragged
 * as well as clicked: the drawer follows the hand down and up, and once let go it locks
 * at one end or the other.
 */

/** A pull faster than this, in px/s, decides the way regardless of where the drawer is. */
const FLICK = 300;

/**
 * Whether the drawer locks open (true) or shut (false) when the handle is let go at
 * `height` of `full` px, moving at `speed` px/s (down is positive). A hand that had
 * `stopped` before letting go throws no flick, and the drawer goes to the nearer end.
 */
export function lockWay(height: number, full: number, speed: number, stopped: boolean): boolean {
  if (!stopped && Math.abs(speed) > FLICK) return speed > 0;
  return height > full / 2;
}
