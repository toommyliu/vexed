import type { Attachment } from "svelte/attachments";

type Props = {
  value: boolean;
};

export function focus(props: Props): Attachment<HTMLElement> {
  return (el) => {
    const onFocus = () => {
      // Defer to avoid state_unsafe_mutation if triggered during Svelte teardown
      queueMicrotask(() => {
        if (el.isConnected) props.value = true;
      });
    };
    const onBlur = () => {
      queueMicrotask(() => {
        if (el.isConnected) props.value = false;
      });
    };
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  };
}
