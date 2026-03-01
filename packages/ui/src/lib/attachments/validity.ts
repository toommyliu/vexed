import type { Attachment } from "svelte/attachments";

type Props = {
  value: boolean;
};

export function validity(props: Props): Attachment<HTMLInputElement> {
  return (el) => {
    const checkValidity = () => (props.value = el.validity.valid);
    const onBlur = () => {
      // Defer to avoid state_unsafe_mutation if triggered during Svelte teardown
      queueMicrotask(() => {
        if (el.isConnected) checkValidity();
      });
    };
    el.addEventListener("blur", onBlur);
    el.addEventListener("invalid", checkValidity);
    el.addEventListener("input", checkValidity);
    el.addEventListener("change", checkValidity);
    return () => {
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("invalid", checkValidity);
      el.removeEventListener("input", checkValidity);
      el.removeEventListener("change", checkValidity);
    };
  };
}
