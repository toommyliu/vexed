import { Mutex } from 'async-mutex';
import merge from 'lodash.merge';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../lib/Bot';
import type { SetIntervalAsyncTimer } from '../lib/util/TimerManager';
import { doPriorityAttack } from '../util/doPriorityAttack';

let intervalId: SetIntervalAsyncTimer | null = null;
let index = 0;

const config: Partial<FollowerConfig> = {};
const mutex = new Mutex();
const bot = Bot.getInstance();

function packetHandler(packet: string) {
	if (!intervalId) return;

	const args = packet.split('%');
	const cmd = args[2];

	if (packet.startsWith('%') && cmd === 'uotls') {
		try {
			const plyr = args[4]!.toLowerCase();
			if (config?.name && plyr === config.name && config?.copyWalk) {
				const data = args[5]!.split(',');

				const spd = data.find((pkt) => pkt.startsWith('sp:'));
				const xPos = data.find((pkt) => pkt.startsWith('tx:'));
				const yPos = data.find((pkt) => pkt.startsWith('ty:'));

				const x = Number.parseInt(xPos!.split(':')[1]!, 10) ?? 0;
				const y = Number.parseInt(yPos!.split(':')[1]!, 10) ?? 0;
				const speed = Number.parseInt(spd!.split(':')[1]!, 10) ?? 8;

				bot.player.walkTo(x, y, speed);
			}
		} catch {}
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

		const name = (
			og_name === '' ? bot.auth.username : og_name
		).toLowerCase();
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

		const cfg = config as FollowerConfig;

		// goto player if needed
		const goToPlayer = async () => {
			try {
				if (bot.world.isPlayerInMap(name)) return;

				// logger.info(`not found: ${name}`);

				const ogProvokeMap = bot.settings.provokeMap;
				const ogProvokeCell = bot.settings.provokeCell;

				bot.settings.provokeMap = false;
				bot.settings.provokeCell = false;

				if (bot.player.isInCombat()) {
					// logger.info('in combat, trying to exit');

					// immediately try to escape with current cell
					await bot.world.jump(bot.player.cell, bot.player.pad);
					await bot.sleep(1_000);

					// we are still in combat?
					if (bot.player.isInCombat()) {
						let escaped = false;

						const ogCell = bot.player.cell;

						for (const cell of bot.world.cells) {
							if (cell === ogCell) continue;

							// logger.info(`escape to: ${cell}`);
							await bot.world.jump(cell);

							await bot.waitUntil(
								() => bot.player.isInCombat(),
								null,
								3,
							);

							if (!bot.player.isInCombat()) {
								// logger.info(`success: ${cell}`);
								escaped = true;
								break;
							}
						}

						// we ran through all cells and are still in combat?
						// realistically this would never happen
						if (!escaped) return;
					}
				}

				await bot.sleep(250);

				// logger.info(`goto player: ${name}`);
				bot.world.goto(name);

				await bot.waitUntil(
					() => bot.world.isPlayerInMap(name),
					null,
					3,
				);

				/* eslint-disable require-atomic-updates */
				bot.settings.provokeMap = ogProvokeMap;
				bot.settings.provokeCell = ogProvokeCell;
				/* eslint-enable require-atomic-updates */
			} catch {}
		};

		bot.on('packetFromServer', packetHandler);

		intervalId = bot.timerManager.setInterval(async () => {
			if (!bot.player.isReady()) return;

			try {
				await mutex.acquire();

				await goToPlayer();

				bot.world.setSpawnPoint();

				if (!bot.world.monsters.length) return;

				if (Array.isArray(cfg.attackPriority)) {
					doPriorityAttack(cfg.attackPriority);
				}

				// we still don't have a target?
				while (!bot.combat.hasTarget()) {
					bot.combat.attack('*');
					await bot.waitUntil(() => bot.combat.hasTarget(), null, 3);
				}

				await bot.combat.useSkill(
					cfg.skillList[index]!,
					false,
					cfg.skillWait,
				);
				index = (index + 1) % cfg.skillList!.length;
			} finally {
				mutex.release();
			}
		}, 1_000);
	} else if (ev.data.event === IPC_EVENTS.FOLLOWER_STOP) {
		if (mutex.isLocked()) {
			mutex.release();
		}

		if (!intervalId) return;

		const tmp = intervalId;
		await bot.timerManager.clearInterval(tmp);
		if (tmp === intervalId) {
			intervalId = null;
		}

		index = 0;

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
