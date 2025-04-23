export function enableElement<T extends HTMLElement>(el: T) {
  if (!el) return;

  el.removeAttribute("disabled");
  // el.classList.remove('w3-disabled');
  el.classList.remove(
    "opacity-50",
    "cursor-not-allowed",
    "pointer-events-none",
  );

  if ("disabled" in el) {
    el.disabled = false;
  }
}

export function disableElement<T extends HTMLElement>(el: T) {
  if (!el) return;

  el.setAttribute("disabled", "true");
  // el.classList.add('w3-disabled');
  el.classList.add("opacity-50", "cursor-not-allowed", "pointer-events-none");

  if ("disabled" in el) {
    el.disabled = true;
  }
}

export function setElement<T extends HTMLElement>(el: T, state: boolean) {
  if (state) {
    enableElement(el);
  } else {
    disableElement(el);
  }
}
