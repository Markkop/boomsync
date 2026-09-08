/**
 * Prevent a leftover click/pointer event from hitting whatever sits under a
 * just-unmounted overlay. TapSafeButton fires on pointerup and suppresses the
 * synthetic click on the *same* button; when that button unmounts, the click
 * can land on chrome underneath (e.g. Share).
 */
const GHOST_CLICK_MS = 400;

const POINTER_EVENTS: (keyof DocumentEventMap)[] = [
  'click',
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'touchstart',
  'touchend',
];

export function suppressGhostClicks(durationMs = GHOST_CLICK_MS): void {
  const swallow = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };
  const opts: AddEventListenerOptions = { capture: true };

  const blocker = document.createElement('div');
  blocker.setAttribute('aria-hidden', 'true');
  blocker.setAttribute('data-dismiss-guard', '');
  Object.assign(blocker.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '2147483647',
    touchAction: 'none',
  });
  document.body.appendChild(blocker);

  for (const type of POINTER_EVENTS) {
    document.addEventListener(type, swallow, opts);
    blocker.addEventListener(type, swallow, opts);
  }

  window.setTimeout(() => {
    for (const type of POINTER_EVENTS) {
      document.removeEventListener(type, swallow, opts);
    }
    blocker.remove();
  }, durationMs);
}

/** Close a modal and swallow the leftover click that would otherwise click-through. */
export function safeModalClose(onClose: () => void, durationMs = GHOST_CLICK_MS): void {
  suppressGhostClicks(durationMs);
  onClose();
}
