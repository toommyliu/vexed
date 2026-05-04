import { Effect } from "effect";
import { runtime } from "./Runtime";
import { markGameLoaded, setGameLoadProgress } from "./loadState";

window.onDebug = (message: string) => {
  console.debug("%c debug:: ", "color:#7b8cde;font-size:11px;", message);
};

window.onProgress = (percent: number) => {
  setGameLoadProgress(percent);
};

window.onLoaded = () => {
  markGameLoaded();
  runtime.runFork(Effect.never);
};
