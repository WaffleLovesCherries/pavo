/**
 * One hand at a time on something that can be dragged: a note in a drawer
 * (src/lib/strew.ts) or the drawer's handle (src/components/TemperingDrop.astro). The
 * pointer that took hold keeps it until it lets go; any other pointer landing on it
 * meanwhile is ignored, and its moves do not count. Without this a second finger
 * started a second drag over the first, and the two fought over the same thing.
 *
 * Pointer capture alone does not do it: capture only redirects the captured pointer's
 * events to the element, and a second finger touching the element fires there anyway.
 */
export interface Grip {
  /** Takes hold with pointer `id`, unless another pointer already holds. */
  take(id: number): boolean;
  /** Whether pointer `id` is the one holding. */
  holds(id: number): boolean;
  /** Pointer `id` lets go; nothing happens if it was not the one holding. */
  free(id: number): void;
}

export function grip(): Grip {
  let held: number | null = null;
  return {
    take(id) {
      if (held !== null) return false;
      held = id;
      return true;
    },
    holds(id) {
      return held !== null && held === id;
    },
    free(id) {
      if (held === id) held = null;
    },
  };
}
