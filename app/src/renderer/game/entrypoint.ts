import { Effect } from "effect";
import { runtime } from "./flash/runtime";

window.onDebug = (message: string) => {
  console.debug("%c debug:: ", "color:#7b8cde;font-size:11px;", message);
};

window.onLoaded = () => {
  runtime.runFork(Effect.never);
};
