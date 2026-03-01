const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
  ).filter(
    (el) => !el.closest("[inert]") && getComputedStyle(el).display !== "none",
  );
}

/**
 * Traps Tab/Shift+Tab keyboard focus within the host element.
 *
 * @example
 * ```svelte`
 *   <div use:focusTrap>…</div>
 *   <div use:focusTrap={isOpen}>…</div>
 * ```
 */
export function focusTrap(node: HTMLElement, enabled = true) {
  let previouslyFocused: HTMLElement | null = null;

  function activate() {
    previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = getFocusableElements(node);
    if (focusable.length) {
      // Defer by one tick so the element is fully painted / visible.
      requestAnimationFrame(() => focusable[0].focus());
    }
    node.addEventListener("keydown", handleKeydown);
  }

  function deactivate() {
    node.removeEventListener("keydown", handleKeydown);
    previouslyFocused?.focus?.();
    previouslyFocused = null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(node);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift+Tab: if we're on the first element, wrap to last.
      if (active === first || !node.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if we're on the last element, wrap to first.
      if (active === last || !node.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  if (enabled) activate();

  return {
    update(newEnabled: boolean) {
      if (newEnabled && !node.hasAttribute("data-focus-trap-active")) {
        node.setAttribute("data-focus-trap-active", "");
        activate();
      } else if (!newEnabled) {
        node.removeAttribute("data-focus-trap-active");
        deactivate();
      }
    },
    destroy() {
      deactivate();
    },
  };
}
