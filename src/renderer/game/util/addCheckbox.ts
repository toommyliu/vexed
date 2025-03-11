const ogDiv = document.createElement('div');
ogDiv.className = 'option-checkmark';
ogDiv.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

export function addCheckbox(
  el: HTMLElement,
  fn: (on: boolean) => void,
  defaultChecked = false,
) {
  const div = ogDiv.cloneNode(true);
  el.appendChild(div);

  el.setAttribute('data-state', defaultChecked.toString());
  if (defaultChecked) {
    el.classList.add('option-active');
  } else {
    el.classList.remove('option-active');
  }

  el.addEventListener('click', (ev) => {
    ev.stopPropagation();

    const currentState = el.getAttribute('data-state') === 'true';
    const newState = !currentState;

    el.setAttribute('data-state', newState.toString());
    el.classList.toggle('option-active', newState);

    fn(newState);
  });
}
