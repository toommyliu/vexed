function packetFromServer([packet]) {
	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);

		switch (pkt.b.o.cmd) {
			case 'dropItem':
				{
					/**
					 * @type {BankItemData}
					 */
					const item = Object.values(pkt.b.o.items)[0];
					Bot.getInstance().world.dropStack.add(item);
				}
				break;
		}
	}
}

function connection([state]) {
	const bot = Bot.getInstance();
	switch (state) {
		case 'OnConnection':
			break;
		case 'OnConnectionLost':
			{
				if (bot.isRunning && bot.options.autoRelogin) {
					(async () => {
						await bot.sleep(bot.options.autoReloginDelay);
						bot.auth.login();
						bot.auth.resetServers();
						await bot.waitUntil(() => bot.auth.servers.length > 0, null, 5);

						if (!bot.auth.servers.length) return;

						const server =
							bot.options.autoReloginServer === '*'
								? bot.auth.servers[Math.floor(Math.random() * bot.auth.servers.length)].name
								: bot.options.autoReloginServer;

						bot.auth.connect(server);
						await bot.sleep(bot.options.autoReloginDelay);
					})();
				}
			}
			break;
	}
}
