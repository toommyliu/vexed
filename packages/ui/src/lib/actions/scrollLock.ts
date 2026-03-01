// Reference-count so multiple simultaneous dialogs don't fight over the lock
let lockCount = 0;
let savedOverflow = "";

function lock() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    // Compensate for scrollbar width to prevent layout shift.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarWidth
      ? `${scrollbarWidth}px`
      : "";
    document.body.style.overflow = "hidden";
  }
  lockCount++;
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = "";
    savedOverflow = "";
  }
}

/**
 * Prevents body scroll while the host element is active.
 *
 * @example
 * ```svelte
 *   <div use:scrollLock>…</div>
 *   <div use:scrollLock={isOpen}>…</div>
 * ````
 */

export function scrollLock(node: HTMLElement, enabled = true) {
  let active = false;

  function activate() {
    if (active) return;
    active = true;
    lock();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    unlock();
  }

  if (enabled) activate();

  return {
    update(newEnabled: boolean) {
      if (newEnabled) activate();
      else deactivate();
    },
    destroy() {
      deactivate();
    },
  };
}
