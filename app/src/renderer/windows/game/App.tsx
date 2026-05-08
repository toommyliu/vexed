/* @refresh reload */
import "./entrypoint";
import GameApp from "./GameApp";
import { mountWindow } from "../mount";

mountWindow(({ initialSettings }) => (
  <GameApp initialSettings={initialSettings} />
));
