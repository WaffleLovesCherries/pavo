/**
 * Behaviour shared by every slide-in drawer (see src/components/Drawer.astro):
 * showing and hiding with the transition, locking page scroll, and closing on
 * the scrim, the × button or Escape. Runs in the browser only.
 */

export interface Drawer {
  root: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export interface DrawerOptions {
  onOpen?: () => void;
  onClose?: () => void;
  focus?: () => HTMLElement | null | undefined;
}

const HIDE_AFTER_MS = 500;

export function setupDrawer(root: HTMLElement, options: DrawerOptions = {}): Drawer {
  let hideTimer: number | undefined;

  const isOpen = () => root.classList.contains('is-open');

  function open() {
    if (isOpen()) return;
    window.clearTimeout(hideTimer);
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('is-open');
      options.focus?.()?.focus({ preventScroll: true });
      options.onOpen?.();
    }));
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove('is-open');
    document.body.style.overflow = '';
    hideTimer = window.setTimeout(() => { root.hidden = true; }, HIDE_AFTER_MS);
    options.onClose?.();
  }

  for (const b of root.querySelectorAll('[data-drawer-close]')) b.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); });

  return { root, open, close, isOpen };
}
