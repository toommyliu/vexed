import type { SetIntervalAsyncTimer } from '../api/util/TimerManager';

const { timerManager, auth, world, player, flash, combat } = bot;

let timer: SetIntervalAsyncTimer<unknown[]> | null = null;

let index = 0;

const config: FollowerConfig = {
	on: false,
	player: '',
	skills: [],
	skillWait: false,
	skillDelay: 150,
	attackPriority: [],
	copyWalk: false,
};

let tries = 5;

const isFollowerOn = () => config.on;

const stop = async () => {
	if (timer) {
		bot.removeListener('packetFromServer', onPacketFromServer);
		await timerManager.clearInterval(timer);
		timer = null;
		config.on = false;
		index = 0;
		tries = 5;
	}
};

const isPlayerInMap = () => {
	return flash.call(swf.GetCellPlayers, config.player);
};

const onPacketFromServer = async (packet: string) => {
	if (isFollowerOn() && config!.copyWalk && packet.startsWith('%xt')) {
		const args = packet.split('%');
		const key = args[2];
		if (key === 'uotls') {
			const playerName = args[4]!.toLowerCase();
			if (playerName === config.player) {
				const move = args[5]!.split(',');
				// ?
				if (move.length !== 4) {
					// idk
					return;
				}
				const x = Number.parseInt(move[1]!.split(':')[1]!, 10);
				const y = Number.parseInt(move[2]!.split(':')[1]!, 10);
				player.walkTo(x, y);
			}
		} else if (key === 'server') {
			//%xt%server%-1%PLAYERNAME is ignoring goto requests.%
		}
	}
};

window.addEventListener('message', async (ev) => {
	if (!ev.data.event.startsWith('follower:')) {
		return;
	}

	const {
		data: { event, args },
	} = ev;

	const eventName = event.split(':')[1];

	if (eventName === 'start') {
		if (timer) {
			await bot.timerManager.clearInterval(timer);
			bot.removeListener('packetFromServer', onPacketFromServer);
			timer = null;
			await bot.sleep(1000);
		}

		if (!args.player || args.player === '') {
			args.player = auth.username.toLowerCase();
		}

		const og_config = args as FollowerConfigRaw;
		config.player = og_config.player.toLowerCase();

		const delay = Number.parseInt(og_config.skillDelay, 10);
		config.skillDelay = Number.isNaN(delay) ? 150 : delay;
		config.skills = og_config.skills;
		config.skillWait = og_config.skillWait;
		config.attackPriority = og_config.attackPriority;
		config.copyWalk = og_config.copyWalk;
		config.on = true;

		bot.on('packetFromServer', onPacketFromServer);

		const isReady = () => {
			return auth.loggedIn && !world.loading && player.isLoaded();
		};

		timer = timerManager.setInterval(async () => {
			if (!isReady() || tries <= 0) {
				if (tries <= 0) {
					stop();

					ev.source!.postMessage({
						event: 'follower:stop',
					});
				}
				return;
			}

			if (!isPlayerInMap() && tries !== 0) {
				await combat.exit();
				await bot.sleep(2000);
				bot.world.goto(config.player);
				await bot.waitUntil(isReady);
				if (!isPlayerInMap()) {
					tries--;
					return;
				}
			} else {
				tries = 5;
			}

			world.setSpawnPoint();

			if (config.attackPriority.length > 0) {
				for (const mon of config.attackPriority) {
					if (world.isMonsterAvailable(mon)) {
						combat.attack(mon);
						break;
					}
				}
			}

			if (!combat.hasTarget()) {
				combat.attack('*');
			}

			if (combat.hasTarget()) {
				await combat.useSkill(
					config.skills[index]!,
					false,
					config.skillWait,
				);
				index = (index + 1) % config.skills.length;
				await bot.sleep(config.skillDelay);
			}
		}, config.skillDelay);
	} else if (eventName === 'stop') {
		await stop();
	} else if (eventName === 'me') {
		ev.source!.postMessage({
			event: 'follower:me',
			args: auth.username,
		});
	}
});

type FollowerConfig = {
	on: boolean;
	player: string;
	skills: string | string[];
	skillWait: boolean;
	skillDelay: number;
	attackPriority: string | string[];
	copyWalk: boolean;
};
type FollowerConfigRaw = {
	player: string;
	skills: string | string[];
	skillWait: boolean;
	skillDelay: string;
	attackPriority: string | string[];
	copyWalk: boolean;
};
