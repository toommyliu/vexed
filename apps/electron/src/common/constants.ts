import os from 'os';
import { join } from 'path';
import type { Account, Location, Settings } from '../main/FileManager';

export const BRAND = 'Vexed';
export const DOCUMENTS_PATH = join(os.homedir(), 'Documents', BRAND);

export const DEFAULT_SETTINGS: Settings = {
	launchMode: 'game',
} as const;

export const DEFAULT_FAST_TRAVELS: Location[] = [
	{ name: 'Oblivion', map: 'tercessuinotlim' },
	{
		name: 'Twins',
		map: 'tercessuinotlim',
		cell: 'Twins',
		pad: 'Left',
	},
	{
		name: 'VHL/Taro/Zee',
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

export const DEFAULT_ACCOUNTS: Account[] = [] as const;

export const ARTIX_USERAGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36' as const;

export const WHITELISTED_DOMAINS = [
	'www.aq.com',
	'aq.com',
	'www.artix.com',
	'artix.com',
	'www.account.aq.com',
	'account.aq.com',
	'www.aqwwiki.wikidot.com',
	'aqwwiki.wikidot.com',
	'heromart.com',
	'www.heromart.com',
];

export const WINDOW_IDS = {
	FAST_TRAVELS: 'tools:fast-travels' as const,
	LOADER_GRABBER: 'tools:loader-grabber' as const,
	FOLLOWER: 'tools:follower' as const,

	PACKETS_LOGGER: 'packets:logger' as const,
	PACKETS_SPAMMER: 'packets:spammer' as const,
} as const;