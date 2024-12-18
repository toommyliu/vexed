import merge from 'lodash.merge';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { PlayerState } from '../api/Player';
import type { SetIntervalAsyncTimer } from '../api/util/TimerManager';

let ac: AbortController | null = null;
let intervalId: SetIntervalAsyncTimer<unknown[]> | null = null;
let index = 0;

const config: Partial<FollowerConfig> = {};

function packetHandler(packet: string) {
	if (!intervalId) return;

	const args = packet.split('%');
	const cmd = args[2];

	if (packet.startsWith('%') && cmd === 'uotls') {
		const playerName = args[4]!.toLowerCase();
		if (config?.name && playerName === config.name && config?.copyWalk) {
			const pkt = args[5]!.split(',');

			// const spd = move.find((pkt) => pkt.startsWith('sp:'));
			const xPos = pkt.find((pkt) => pkt.startsWith('tx:'));
			const yPos = pkt.find((pkt) => pkt.startsWith('ty:'));

			if (!xPos || !yPos) {
				console.warn('Follower: no x or y position found.');
				return;
			}

			const x = Number.parseInt(xPos.split(':')[1]!, 10);
			const y = Number.parseInt(yPos.split(':')[1]!, 10);
			// const speed = Number.parseInt(spd!.split(':')[1]!, 10) ?? 8;

			bot.player.walkTo(x, y);
		}
	}
}

export default async function handler(ev: MessageEvent) {
	const port = ev.target as MessagePort;

	if (ev.data.event === IPC_EVENTS.FOLLOWER_ME) {
		if (!bot.player.isReady()) {
			return;
		}

		port.postMessage({
			event: IPC_EVENTS.FOLLOWER_ME,
			args: {
				name: bot.auth.username,
			},
		});
	} else if (ev.data.event === IPC_EVENTS.FOLLOWER_START) {
		await bot.waitUntil(() => bot.player.isReady(), null, -1);

		ac = new AbortController();

		bot.on('packetFromServer', packetHandler);

		const {
			name: og_name,
			skillList: og_skillList,
			skillWait: og_skillWait,
			skillDelay: og_skillDelay,
			copyWalk: og_copyWalk,
			attackPriority: og_attackPriority,
		}: {
			attackPriority: string;
			copyWalk: boolean;
			name: string;
			skillDelay: string;
			skillList: string;
			skillWait: boolean;
		} = ev.data.args;

		const name = og_name === '' ? bot.auth.username : og_name;
		const skillList = og_skillList.split(',').map((x) => x.trim()) ?? [
			1, 2, 3, 4,
		];
		const skillWait = og_skillWait ?? false;
		const skillDelay = Number.parseInt(og_skillDelay, 10) ?? 150;
		const copyWalk = og_copyWalk ?? false;
		const attackPriority = [];

		if (og_attackPriority !== '') {
			const prio = og_attackPriority.split(',').map((tgt) => tgt.trim());
			attackPriority.push(...prio);
		}

		merge(config, {
			attackPriority,
			copyWalk,
			name,
			skillList,
			skillWait,
			skillDelay,
		});

		intervalId = bot.timerManager.setInterval(async () => {
			if (ac!.signal.aborted) return;

			if (!bot.player.isReady()) return;

			if (!bot.flash.call(() => swf.GetCellPlayers(name))) {
				if (bot.player.state === PlayerState.InCombat)
					await bot.combat.exit();

				await bot.sleep(1_000);
				bot.world.goto(name);
			}

			bot.world.setSpawnPoint();

			if (bot.world.monsters.length === 0) return;

			if ('attackPriority' in config) {
				for (const tgt of config.attackPriority) {
					if (
						!bot.combat.hasTarget() &&
						bot.world.isMonsterAvailable(tgt)
					) {
						bot.combat.attack(tgt);
						break;
					}
				}
			}

			if (!bot.combat.hasTarget()) {
				bot.combat.attack('*');
			}

			if (bot.combat.hasTarget()) {
				await bot.combat.useSkill(skillList[index]!, false, skillWait);
				index = (index + 1) % skillList.length;
				await bot.sleep(skillDelay);
			}
		}, 1_000);
	} else if (ev.data.event === IPC_EVENTS.FOLLOWER_STOP) {
		if (!intervalId) return;

		ac!.abort();

		const tmp = intervalId;
		await bot.timerManager.clearInterval(tmp);

		if (tmp === intervalId) {
			intervalId = null;
		}

		bot.off('packetFromServer', packetHandler);
	}
}

type FollowerConfig = {
	attackPriority: string[];
	copyWalk: boolean;
	name: string;
	skillDelay: number;
	skillList: string[];
	skillWait: boolean;
};
