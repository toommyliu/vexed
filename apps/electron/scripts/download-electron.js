// https://github.com/electron/electron/blob/11-x-y/npm/install.js

// TODO: cleanup

console.log('downloading electron binary...');

const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { downloadArtifact } = require('@electron/get');

const platformPath = 'Electron.app/Contents/MacOS/Electron';

downloadArtifact({
	version: '11.5.0',
	artifactName: 'electron',
	force: process.env.force_no_cache === 'true',
	cacheRoot: process.env.electron_config_cache,
	platform: 'darwin',
	arch: 'x64',
})
	.then(extractFile)
	.catch((err) => {
		console.error(err.stack);
		process.exit(1);
	});

// function isInstalled() {
// 	const nodeModules = path.join(__dirname, '..', 'node_modules');
// 	const electron = path.join(nodeModules, 'electron');

// 	try {
// 		if (fs.readFileSync(path.join(electron, 'dist', 'version'), 'utf-8').replace(/^v/, '') !== version) {
// 			return false;
// 		}

// 		if (fs.readFileSync(path.join(electron, 'path.txt'), 'utf-8') !== platformPath) {
// 			return false;
// 		}
// 	} catch (ignored) {
// 		return false;
// 	}

// 	const electronPath = path.join(electron, 'dist', platformPath);

// 	return fs.existsSync(electronPath);
// }

// unzips and makes path.txt point at the correct executable
function extractFile(zipPath) {
	return new Promise((resolve, reject) => {
		const nodeModules = path.join(__dirname, '..', 'node_modules');
		const electron = path.join(nodeModules, 'electron');
		fs.rmdir(path.join(electron, 'dist'), { recursive: true }, (err) => {
			if (err) return reject(err);
			extract(zipPath, { dir: path.join(electron, 'dist') }, (err) => {
				if (err) return reject(err);

				fs.writeFile(path.join(__dirname, 'path.txt'), platformPath, (err) => {
					if (err) return reject(err);

					resolve();
				});
			});
		});
	});
}
