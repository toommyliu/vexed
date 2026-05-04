import "../styles.css";
import { render } from "solid-js/web";
import type { JSX } from "solid-js";
import { installSettingsSync } from "../theme";

declare global {
  interface ImportMeta {
    readonly hot?: {
      dispose(callback: () => void): void;
    };
  }
}

export function mountWindow(App: () => JSX.Element): void {
  const root = document.getElementById("root");

  if (root) {
    const teardown = installSettingsSync();
    const disposeRender = render(() => <App />, root);

    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        disposeRender();

        if (typeof teardown === "function") {
          teardown();
        }
      });
    }
  }
}
