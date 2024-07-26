const { ipcRenderer } = require('electron');

const path = require('path');
const fs = require('fs-extra');

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
	path = path;
	fs = fs;

	#basePath;

	/**
	 * Sets the base path for the file manager
	 * @returns {Promise<void>}
	 */
	async #init() {
		this.#basePath ??= await ipcRenderer.invoke('root:get_documents_path');

		await fs.ensureDir(this.#basePath);

		try {
			const exists = await fs.pathExists(
				path.join(this.#basePath, 'fast-travels.json'),
			);
			if (!exists) {
				await fs.writeJSON(
					path.join(this.#basePath, 'fast-travels.json'),
					defaultLocations,
					{ spaces: 4 },
				);
			}
		} catch (error) {
			console.log('Failed to create "fast-travels.json"', error);
		}
	}

	/**
	 * @param {string} file The path to the file
	 * @returns
	 */
	async readJSON(file) {
		await this.#init();

		try {
			return fs.readJSON(path.join(this.#basePath, file));
		} catch (error) {
			throw new Error('Failed to read json file', error);
		}
	}
}

module.exports = FileManager;
