/* @refresh reload */
import "./entrypoint";
import { render } from "solid-js/web";
import GameApp from "./GameApp";

const root = document.getElementById("root");
if (root) {
  render(() => <GameApp />, root);
}
