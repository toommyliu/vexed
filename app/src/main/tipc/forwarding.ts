import type { ActionContext, RendererHandlersCaller } from "@vexed/tipc";
import type { BrowserWindow } from "electron";
import type { WindowIds } from "~/shared/types";
import { windowsService } from "../services/windows";
import type { RendererHandlers as AppRendererHandlers } from "../tipc";

export function isWindowUsable(window: BrowserWindow | null): boolean {
  return !window?.isDestroyed() && !window?.webContents?.isDestroyed();
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

/**
 * Executes a function with the renderer handlers for some subwindow belonging to
 * a game window.
 *
 * Useful for executing actions on subwindows that are not the
 * sender window.
 *
 * @param context - The TIPC action context.
 * @param subwindowId - The ID of the subwindow to target.
 * @param fn - The function to execute with the subwindow's handlers.
 * @returns The result of the function, or undefined if the subwindow is not available or unusable.
 */
export async function withSubwindowHandlers<TResult>(
  context: Pick<ActionContext, "getRendererHandlers" | "senderWindowId">,
  subwindowId: WindowIds,
  fn: (
    handlers: RendererHandlersCaller<AppRendererHandlers>,
  ) => Promise<TResult> | TResult,
): Promise<TResult | undefined> {
  if (!context.senderWindowId) return;
  const gameWindowId = windowsService.getGameWindowId(context.senderWindowId);
  if (!gameWindowId) return;
  const subwindow = windowsService.getSubwindow(gameWindowId, subwindowId);
  if (!isWindowUsable(subwindow)) return;
  const handlers = context.getRendererHandlers<AppRendererHandlers>(subwindow);
  return fn(handlers);
}
