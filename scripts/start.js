const { exec } = require('child_process');
const { join } = require('path');
const pkgJson = require('../package.json');

const { name } = pkgJson;

const path = join(__dirname, `../out/${name}-darwin-x64/${name}.app`);

try {
	exec(`open -a ${path}`);
} catch {}
