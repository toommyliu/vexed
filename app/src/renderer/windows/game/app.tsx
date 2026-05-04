/* @refresh reload */
import "./entrypoint";
import { render } from "solid-js/web";
import { installSettingsSync } from "../../theme";
import GameApp from "./GameApp";

const root = document.getElementById("root");
if (root) {
  const disposeSettingsSync = installSettingsSync();
  const disposeRender = render(() => <GameApp />, root);

  window.addEventListener(
    "beforeunload",
    () => {
      disposeRender();
      disposeSettingsSync();
    },
    { once: true },
  );
}
