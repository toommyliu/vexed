import "../styles.css";
import { render } from "solid-js/web";
import type { JSX } from "solid-js";

export function mountWindow(App: () => JSX.Element): void {
  const root = document.getElementById("root");

  if (root) {
    render(() => <App />, root);
  }
}
