import merge from 'lodash.merge';
import { IPC_EVENTS } from '../../../common/ipc-events';
import type { SetIntervalAsyncTimer } from '../api/util/TimerManager';

let intervalId: SetIntervalAsyncTimer<unknown[]> | null = null;
let index = 0;

const config = {};

function packetHandler(packet: string) {
	if (!intervalId) return;

	const args = packet.split('%');
	const cmd = args[2];

	if (packet.startsWith('%') && cmd === 'uotls') {
		const playerName = args[4]!.toLowerCase();
		if (
			'name' in config &&
			playerName === config.name &&
			'copyWalk' in config &&
			config.copyWalk
		) {
			const move = args[5]!.split(',');

			// const spd = move.find((pkt) => pkt.startsWith('sp:'));
			const xPos = move.find((pkt) => pkt.startsWith('tx:'));
			const yPos = move.find((pkt) => pkt.startsWith('ty:'));

			if (!xPos || !yPos) {
				console.warn('No x or y position found in move packet');
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

		bot.on('packetFromServer', packetHandler);

		const {
			name: og_name,
			skillList: og_skillList,
			skillWait: og_skillWait,
			skillDelay: og_skillDelay,
			copyWalk: og_copyWalk,
		}: {
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

		merge(config, { copyWalk, name, skillList, skillWait, skillDelay });

		intervalId = bot.timerManager.setInterval(async () => {
			if (!bot.player.isReady()) return;

			// eslint-disable-next-line @typescript-eslint/no-loop-func
			while (!bot.flash.call(() => swf.GetCellPlayers(name))) {
				await bot.combat.exit();
				await bot.sleep(1_000);
				bot.world.goto(name);
			}

			bot.world.setSpawnPoint();

			bot.combat.attack('*');
			if (bot.combat.hasTarget()) {
				await bot.combat.useSkill(skillList[index]!, false, skillWait);
				index = (index + 1) % skillList.length;
				await bot.sleep(skillDelay);
			}
		}, 1_000);
	} else if (ev.data.event === IPC_EVENTS.FOLLOWER_STOP) {
		if (!intervalId) {
			return;
		}

		bot.on('packetFromServer', packetHandler);
		void bot.timerManager.clearInterval(intervalId);
		intervalId = null;
	}
}
