import { join } from "path";
import type { WindowId } from "../../shared/windows";

export const getRendererWindowPath = (
  distRendererPath: string,
  id: WindowId,
): string => join(distRendererPath, id, "index.html");

export const getRendererGameWindowPath = (distRendererPath: string): string =>
  join(distRendererPath, "game", "index.html");
