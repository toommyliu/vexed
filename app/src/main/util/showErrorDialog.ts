import { dialog, app } from "electron";
import { logger } from "../constants";

export function showErrorDialog(error: ErrorDialogOptions, quit = true) {
  dialog.showErrorBox(
    "An error occured",
    `${error.message}${error.error ? `\n${error.error?.stack}` : ""}`,
  );

  if (error?.error instanceof Error) {
    logger.error(error);
  }

  if (quit) {
    app.quit();
  }
}

export type ErrorDialogOptions = {
  error?: Error;
  message: string;
};
