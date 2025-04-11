export function enableElement<T extends HTMLElement>(el: T) {
  if (!el) return;

  el.removeAttribute('disabled');
  el.classList.remove('w3-disabled');

  if ('disabled' in el) {
    el.disabled = false;
  }
}

export function disableElement<T extends HTMLElement>(el: T) {
  if (!el) return;

  el.setAttribute('disabled', 'true');
  el.classList.add('w3-disabled');

  if ('disabled' in el) {
    el.disabled = true;
  }
}

export function toggleElement<T extends HTMLElement>(el: T, state: boolean) {
  if (state) {
    enableElement(el);
  } else {
    disableElement(el);
  }
}
