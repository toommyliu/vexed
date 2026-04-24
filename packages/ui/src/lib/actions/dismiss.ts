export type DismissOptions = {
  onDismiss: () => void;
  /** Close when clicking outside the node. @default true */
  closeOnOutside?: boolean;
  /** Close when pressing Escape. @default true */
  closeOnEscape?: boolean;
  /**
   * Elements (or a getter returning elements) that should NOT trigger an
   * outside-click dismiss (e.g. the trigger button that already handles its
   * own toggle logic).
   *
   * Accept a function so the list is evaluated lazily on every pointerdown —
   * this prevents stale-snapshot bugs where the trigger element isn't
   * registered yet when the content first mounts.
   */
  excludeElements?: (HTMLElement | null)[] | (() => (HTMLElement | null)[]);
};

/**
 * Calls `onDismiss()` when:
 *  - The user presses Escape (if `closeOnEscape` is true, default true)
 *  - The user clicks / taps outside the host element (if `closeOnOutside` is true, default true)
 *
 * @example
 * ```svelte
 *   <div use:dismiss={{ onDismiss: close }}>…</div>
 *   <div use:dismiss={{ onDismiss: close, excludeElements: () => [triggerEl] }}>…</div>
 * ````
 */
export function dismiss(node: HTMLElement, options: DismissOptions) {
  let opts = {
    closeOnOutside: true,
    closeOnEscape: true,
    excludeElements: [] as (HTMLElement | null)[],
    ...options,
  };

  function getExcluded(): (HTMLElement | null)[] {
    const ex = opts.excludeElements;
    return typeof ex === "function" ? ex() : (ex ?? []);
  }

  function handlePointerDown(event: PointerEvent) {
    if (!opts.closeOnOutside) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (node.contains(target)) return;
    // Don't dismiss if the click landed on an excluded element (e.g. the trigger)
    for (const el of getExcluded()) {
      if (el?.contains(target)) return;
    }
    opts.onDismiss();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!opts.closeOnEscape) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      opts.onDismiss();
    }
  }

  // Use capture phase for pointer events so the handler runs before any
  // stopPropagation calls inside the content.
  document.addEventListener("pointerdown", handlePointerDown, {
    capture: true,
  });
  window.addEventListener("keydown", handleKeydown, { capture: true });

  return {
    update(newOptions: DismissOptions) {
      opts = {
        closeOnOutside: true,
        closeOnEscape: true,
        excludeElements: [] as (HTMLElement | null)[],
        ...newOptions,
      };
    },
    destroy() {
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("keydown", handleKeydown, { capture: true });
    },
  };
}
