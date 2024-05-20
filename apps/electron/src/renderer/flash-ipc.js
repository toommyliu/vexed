function packetFromServer([packet]) {
	if (packet.startsWith('{"')) {
		const pkt = JSON.parse(packet);
		// console.log(pkt);

		switch (pkt.b.o.cmd) {
			case "dropItem":
				{
					/**
					 * @type {Bot}
					 */
					const bot = Bot.getInstance();
					/**
					 * @type {BankItemData}
					 */
					const item = Object.values(pkt.b.o.items)[0];
					bot.drops.add(item);
				}
				break;
		}
	}
}

function packetFromClient([packet]) {
	// console.log(packet);
}

function connection([state]) {
	const bot = Bot.getInstance();
	switch (state) {
		case "OnConnection":
			break;
		case "OnConnectionLost":
			{
				// TODO: improve during script execution
				if (bot.isRunning && bot.options.autoRelogin) {
					(async () => {
						await bot.sleep(bot.options.autoReloginDelay);
						bot.auth.resetServers();
						bot.auth.login();
						await bot.waitUntil(() => bot.auth.servers.length > 0, null, 5);

						if (!bot.auth.servers.length) {
							console.log("Didn't get servers in time.");
							return;
						}

						const server =
							bot.options.autoReloginServer === "*"
								? bot.auth.servers[
									Math.floor(Math.random() * bot.auth.servers.length)
								].name
								: bot.options.autoReloginServer;

						bot.auth.connect(server);
						await bot.sleep(bot.options.autoReloginDelay);
					})();
				}
			}
			break;
	}
}
