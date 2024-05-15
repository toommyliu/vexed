var ipc = require('electron').ipcRenderer;
var bot = Bot.getInstance();

var opts = {
	infiniteRange: false,
	provoke: false,
	enemyMagnet: false,
	lagKiller: false,
	hidePlayers: false,
	skipCutscenes: false,
};

ipc.on('options:infiniteRange', (event, value) => {
	opts.infiniteRange = value;
});
ipc.on('options:provokeMonsters', (event, value) => {
	opts.provoke = value;
});
ipc.on('options:enemyMagnet', (event, value) => {
	bot.settings.setEnemyMagnet();
});
ipc.on('options:lagKiller', (event, value) => {
	opts.lagKiller = value;
});
ipc.on('options:hidePlayers', (event, value) => {
	opts.hidePlayers = value;
});
ipc.on('options:skipCutscenes', (event, value) => {
	opts.skipCutscenes = value;
});

setInterval(() => {
	if (!bot.auth.loggedIn || bot.world.loading) return;

	if (opts.infiniteRange) {
		bot.settings.setInfiniteRange();
	}

	if (opts.provoke) {
		bot.settings.setProvokeMonsters();
	}

	if (opts.enemyMagnet) {
		bot.settings.setEnemyMagnet();
	}

	bot.settings.setLagKiller(opts.lagKiller);

	if (opts.hidePlayers) {
		bot.settings.hidePlayers();
	}

	if (opts.skipCutscenes) {
		bot.settings.skipCutscenes();
	}
}, 300);
