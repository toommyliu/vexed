import type { ActionContext, RendererHandlersCaller } from "@vexed/tipc";
import type { BrowserWindow } from "electron";
import { windowsService } from "../services/windows";
import type { RendererHandlers as AppRendererHandlers } from "../tipc";

function isWindowUsable(window: BrowserWindow): boolean {
  return !window.isDestroyed() && !window.webContents.isDestroyed();
}

export function resolveParentGameWindow(
  context: Pick<ActionContext, "senderWindow" | "senderWindowId">,
): BrowserWindow | null {
  const senderWindowId =
    context.senderWindowId ?? context.senderWindow?.id ?? null;
  if (senderWindowId === null) return null;
  return windowsService.resolveGameWindow(senderWindowId);
}

export function getParentGameHandlers(
  context: Pick<
    ActionContext,
    "getRendererHandlers" | "senderWindow" | "senderWindowId"
  >,
): RendererHandlersCaller<AppRendererHandlers> | null {
  const parent = resolveParentGameWindow(context);
  if (!parent) return null;
  if (!isWindowUsable(parent)) return null;
  return context.getRendererHandlers<AppRendererHandlers>(parent);
}

export async function withParentGameHandlers<TResult>(
  context: Pick<
    ActionContext,
    "getRendererHandlers" | "senderWindow" | "senderWindowId"
  >,
  fn: (
    handlers: RendererHandlersCaller<AppRendererHandlers>,
  ) => Promise<TResult> | TResult,
): Promise<TResult | undefined> {
  const handlers = getParentGameHandlers(context);
  if (!handlers) return;
  return fn(handlers);
}
