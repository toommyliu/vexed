const checkmark = document.createElement("span");
checkmark.className = "option-checkmark";
checkmark.style.position = "absolute";
checkmark.style.right = "8px";
checkmark.style.top = "50%";
checkmark.style.transform = "translateY(-50%)";
checkmark.style.pointerEvents = "none";
checkmark.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

export function addCheckbox(
  el: HTMLElement,
  fn: (on: boolean) => void,
  defaultChecked: boolean = false,
) {
  el.style.position = "relative";

  el.append(checkmark);
  el.dataset["state"] = defaultChecked.toString();

  if (defaultChecked) {
    el.classList.add("option-active");
  } else {
    el.classList.remove("option-active");
  }

  el.addEventListener("click", (ev) => {
    ev.stopPropagation();

    const currentState = el.dataset["state"] === "true";
    const newState = !currentState;

    el.dataset["state"] = newState.toString();
    el.classList.toggle("option-active", newState);

    fn(newState);
  });
}
