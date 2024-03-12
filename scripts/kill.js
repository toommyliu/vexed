const pkgJson = require('../package.json');

try {
	require('child_process').exec('pkill ' + pkgJson.name);
} catch {}
