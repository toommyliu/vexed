import path from 'path';
import { ipcRenderer } from 'electron';
import fs from 'fs-extra';

const defaultLocations = [
	{ name: 'Oblivion', map: 'tercessuinotlim' },
	{
		name: 'Twins',
		map: 'tercessuinotlim',
		cell: 'Twins',
		pad: 'Left',
	},
	{
		name: 'VHl/Taro/Zee',
		map: 'tercessuinotlim',
		cell: 'Taro',
		pad: 'Left',
	},
	{
		name: 'Swindle',
		map: 'tercessuinotlim',
		cell: 'Swindle',
		pad: 'Left',
	},
	{
		name: 'Nulgath/Skew',
		map: 'tercessuinotlim',
		cell: 'Boss2',
		pad: 'Right',
	},
	{
		name: 'Polish',
		map: 'tercessuinotlim',
		cell: 'm12',
		pad: 'Top',
	},
	{
		name: 'Carnage/Ninja',
		map: 'tercessuinotlim',
		cell: 'm4',
		pad: 'Top',
	},
	{
		name: 'Binky',
		map: 'doomvault',
		cell: 'r5',
		pad: 'Left',
	},
	{
		name: 'Dage',
		map: 'underworld',
		cell: 's1',
		pad: 'Left',
	},
	{
		name: 'Escherion',
		map: 'escherion',
		cell: 'Boss',
		pad: 'Left',
	},
	{
		name: 'Dage',
		map: 'underworld',
		cell: 'r11',
		pad: 'Left',
	},
];

class FileManager {
	#basePath: string | null = null;

	/**
	 * Sets the base path for the file manager
	 */
	public async init(): Promise<void> {
		this.#basePath ??= await ipcRenderer.invoke('root:get_documents_path');

		await fs.ensureDir(this.#basePath!);

		try {
			const exists = await fs.pathExists(
				path.join(this.#basePath!, 'fast-travels.json'),
			);
			if (!exists) {
				await fs.writeJSON(
					path.join(this.#basePath!, 'fast-travels.json'),
					defaultLocations,
					{ spaces: 4 },
				);
			}
		} catch (error) {
			const err = error as Error;
			ipcRenderer.send(
				'root:show_error_dialog',
				{
					message: 'FileManager failed init.',
					error: err,
				},
				true,
			);
		}
	}

	/**
	 * @param file - The path to the json file.
	 */
	public async readJSON(file: string): Promise<JSON | null> {
		await this.init();

		try {
			return await fs.readJSON(path.join(this.#basePath!, file));
		} catch (error) {
			const err = error as Error;
			ipcRenderer.send('root:show_error_dialog', {
				message: 'Failed to read json file.',
				error: err,
			});
			return null;
		}
	}
}

export { FileManager };
