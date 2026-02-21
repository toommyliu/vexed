import { dialog, app } from "electron";
import { logger } from "../services/logger";

export function showErrorDialog(error: ErrorDialogOptions, quit = true) {
  dialog.showErrorBox("An error occurred", error.message);

  if (error?.error instanceof Error)
    logger.error("main", error.error.message, error.error.stack);

  if (quit) app.quit();
}

export type ErrorDialogOptions = {
  error?: Error;
  message: string;
};
