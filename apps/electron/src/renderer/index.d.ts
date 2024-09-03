import type Bot from './api/Bot';

declare global {
	var bot: Bot;

	interface Window {
		Bot: InstanceType<Bot>;
		bot: InstanceType<typeof Bot>;
		auth: InstanceType<typeof import('./api/Auth')>;
		bank: InstanceType<typeof import('./api/Bank')>;
		combat: InstanceType<typeof import('./api/Combat')>;
		drops: InstanceType<typeof import('./api/Drops')>;
		house: InstanceType<typeof import('./api/House')>;
		flash: InstanceType<typeof import('./api/util/Flash')>;
		inventory: InstanceType<typeof import('./api/Inventory')>;
		player: InstanceType<typeof import('./api/Player')>;
		packets: InstanceType<typeof import('./api/Packets')>;
		quests: InstanceType<typeof import('./api/Quests')>;
		settings: InstanceType<typeof import('./api/Settings')>;
		shops: InstanceType<typeof import('./api/Shops')>;
		tempInventory: InstanceType<typeof import('./api/TempInventory')>;
		world: InstanceType<typeof import('./api/World')>;

		packetFromServer: ([packet]: [string]) => Awaited<void> | void;
		packetFromClient([packet]: [string]): Awaited<void> | void;
		connection: ([state]: [string]) => void;
		progress: ([percentage]: [number]) => void;
		account?: { username: string; password: string; server: string };
	}
}
