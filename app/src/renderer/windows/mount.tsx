import "../styles.css";
import { render } from "solid-js/web";
import type { JSX } from "solid-js";
import { installSettingsSync } from "../theme";

export function mountWindow(App: () => JSX.Element): void {
  const root = document.getElementById("root");

  if (root) {
    installSettingsSync();
    render(() => <App />, root);
  }
}
