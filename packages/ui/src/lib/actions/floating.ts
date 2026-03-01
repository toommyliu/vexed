import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
} from "@floating-ui/dom";

export type FloatingConfig = {
  /** The reference element to position against. */
  anchor: HTMLElement | null;
  /** Floating-UI placement string. @default 'bottom-start' */
  placement?: Placement;
  /** Gap in pixels between anchor and floating element. @default 4 */
  sideOffset?: number;
  /**
   * If set, writes the anchor's width as this CSS custom property on the
   * floating node so the content can match the trigger width.
   * e.g. '--select-anchor-width'
   */
  anchorWidthVar?: string;
};

function placementToSide(placement: Placement): string {
  return placement.split("-")[0];
}

/**
 * Computes and continuously updates the position of a floating element relative
 * to an anchor element.
 *
 * @example
 * ```svelte
 *   <div use:floating={{ anchor: triggerEl }}>…</div>
 *   <div use:floating={{ anchor: triggerEl, placement: 'top-start', sideOffset: 8 }}>…</div>
 * ```
 */
export function floating(node: HTMLElement, config: FloatingConfig) {
  let cleanup: (() => void) | null = null;
  let currentConfig = config;

  // Hide until first position is computed to avoid a flash at 0,0
  node.style.visibility = "hidden";
  node.style.position = "fixed";
  node.style.top = "0";
  node.style.left = "0";

  // Set a default data-side immediately from the configured placement so that
  // CSS slide animations (e.g. data-[side=bottom]:slide-in-from-top-1) apply
  // their transform from the first frame, before computePosition resolves.
  node.dataset.side = placementToSide(config.placement ?? "bottom-start");

  function start(cfg: FloatingConfig) {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    if (!cfg.anchor) return;

    const placement = cfg.placement ?? "bottom-start";
    const sideOffset = cfg.sideOffset ?? 4;
    // Track whether we've already signalled positioning in this session so
    // subsequent autoUpdate repositions (e.g. from layout shifts caused by
    // scroll-arrow buttons toggling) don't retrigger the CSS enter animation.
    let initialPositionDone = false;

    async function update() {
      // Always read anchor from currentConfig so late-binding refs work
      const anchor = currentConfig.anchor;
      if (!anchor) return;

      const {
        x,
        y,
        placement: resolvedPlacement,
      } = await computePosition(anchor, node, {
        strategy: "fixed",
        placement,
        middleware: [
          offset(sideOffset),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
        ],
      });

      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.visibility = "";
      node.dataset.side = placementToSide(resolvedPlacement);

      // Signal that positioning is ready so CSS enter animations can start.
      // Without this, animate-in would begin while the node is still hidden
      // at (0,0) and the user would see a partially-elapsed animation fly in
      // from the wrong spot.
      // Only do this once per session – subsequent autoUpdate repositions
      // must not toggle the attribute or the enter animation replays.
      if (!initialPositionDone) {
        initialPositionDone = true;
        const wasPositioned = node.hasAttribute("data-positioned");
        if (!wasPositioned) {
          node.dataset.positioned = "";
        } else {
          // Element survived from a previous session (e.g. re-opened during
          // the closing animation before the DOM node was destroyed).
          node.removeAttribute("data-positioned");
          // Force reflow to restart CSS animations
          void node.offsetWidth;
          node.dataset.positioned = "";
        }
      }

      if (currentConfig.anchorWidthVar) {
        const anchorWidth = anchor.getBoundingClientRect().width;
        node.style.setProperty(currentConfig.anchorWidthVar, `${anchorWidth}px`);
      }
    }

    cleanup = autoUpdate(cfg.anchor, node, update);
  }

  start(currentConfig);

  return {
    update(newConfig: FloatingConfig) {
      const anchorChanged = newConfig.anchor !== currentConfig.anchor;
      currentConfig = newConfig;

      // Keep default data-side in sync with the configured placement
      node.dataset.side = placementToSide(newConfig.placement ?? "bottom-start");

      // Restart autoUpdate if the anchor element itself changed
      if (anchorChanged) {
        start(newConfig);
      }
    },
    destroy() {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
    },
  };
}
