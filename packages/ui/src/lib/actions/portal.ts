export type PortalTarget = string | HTMLElement;

/**
 * Teleports a DOM node into a target element.
 *
 * @example
 * ```svelte
 *   <div use:portal>…</div>
 *   <div use:portal={"#overlay-root"}>…</div>
 *   <div use:portal={someHTMLElement}>…</div>
 * ````
 */
export function portal(node: HTMLElement, target: PortalTarget = "body") {
  function mount(t: PortalTarget) {
    const el =
      typeof t === "string"
        ? (document.querySelector<HTMLElement>(t) ?? document.body)
        : t;
    el.appendChild(node);
  }

  mount(target);

  return {
    update(newTarget: PortalTarget) {
      // Move to new target if it changes at runtime.
      node.remove();
      mount(newTarget);
    },
    destroy() {
      node.remove();
    },
  };
}
