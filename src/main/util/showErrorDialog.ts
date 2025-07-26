import { dialog, app } from "electron";

export function showErrorDialog(error: ErrorDialogOptions, quit = true) {
  dialog.showErrorBox(
    "An error occured",
    `${error.message}${error.error ? `\n${error.error?.stack}` : ""}`,
  );

  console.log("error instanceof Error:", error.error instanceof Error);

  if (error?.error instanceof Error) {
    console.error("error dialog:");
    console.log(error.error);
  }

  if (quit) {
    app.quit();
  }
}

export type ErrorDialogOptions = {
  error?: Error;
  message: string;
};
