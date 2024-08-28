import { dialog, app } from 'electron';

function showErrorDialog(error: DialogOptions, quit = true) {
	dialog.showErrorBox(
		'An error occured',
		`${error.message}${error.error ? `\n${error.error?.stack}` : ''}`,
	);
	if (error?.error instanceof Error) {
		console.log(error.error);
	}
	if (quit) {
		app.quit();
	}
}

type DialogOptions = {
	message: string;
	error?: Error;
};

export { showErrorDialog };
