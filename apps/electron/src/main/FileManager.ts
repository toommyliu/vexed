import { join } from 'path';
import fs from 'fs-extra';
import { DOCUMENTS_PATH } from './constants';

const DEFAULT_SETTINGS = {
	launchMode: 'game',
};

const DEFAULT_FAST_TRAVELS: Location[] = [
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
] as const;

const DEFAULT_ACCOUNTS: Account[] = [] as const;

export class FileManager {
	private static instance: FileManager;

	public basePath = DOCUMENTS_PATH;

	public get settingsPath() {
		return join(this.basePath, 'settings.json');
	}

	public get fastTravelsPath() {
		return join(this.basePath, 'fast-travels.json');
	}

	public get accountsPath() {
		return join(this.basePath, 'accounts.json');
	}

	public get defaultSettings() {
		return {
			launchMode: 'game',
		};
	}

	public get defaultFastTravels() {
		return DEFAULT_FAST_TRAVELS;
	}

	public get defaultAccounts() {
		return DEFAULT_ACCOUNTS;
	}

	public static getInstance(): FileManager {
		if (!FileManager.instance) {
			FileManager.instance = new FileManager();
		}

		return FileManager.instance;
	}

	private async ensureJsonFile<T>(path: string, json: T): Promise<void> {
		try {
			const exists = await fs.pathExists(path);
			if (!exists) {
				await this.writeJson(path, json);
			}
		} catch (error) {
			await this.writeJson(path, json);
			throw error;
		}
	}

	public async initialize(): Promise<void> {
		await fs.ensureDir(DOCUMENTS_PATH);

		await Promise.all([
			this.ensureJsonFile(this.settingsPath, DEFAULT_SETTINGS),
			this.ensureJsonFile(this.fastTravelsPath, DEFAULT_FAST_TRAVELS),
			this.ensureJsonFile(this.accountsPath, DEFAULT_ACCOUNTS),
		]);
	}

	public async readJson<T>(path: string): Promise<T | null> {
		try {
			const data = await fs.readJson(path);
			return data as T;
		} catch (error) {
			console.log(`Error reading json file at ${path}:`, error);
			return null;
		}
	}

	public async writeJson(path: string, data: unknown): Promise<void> {
		return fs.writeJson(path, data, { spaces: 4 });
	}
}

export type Location = {
	/**
	 * The cell to jump to. Defaults to "Enter".
	 */
	cell?: string;
	/**
	 * The map name to join.
	 */
	map: string;
	/**
	 * The name of the location.
	 */
	name: string;
	/**
	 * The pad to jump to. Defaults to "Spawn".
	 */
	pad?: string;
};

export type Account = {
	/**
	 * The password of the account.
	 */
	password: string;

	/**
	 * The username of the account.
	 */
	username: string;
};
