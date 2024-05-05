// https://github.com/electron/electron/blob/11-x-y/npm/install.js

console.log('Downloading Electron 11.5.0 Intel binary');

const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { downloadArtifact } = require('@electron/get');

(async () => {
	const zipPath = await downloadArtifact({
		version: '11.5.0',
		artifactName: 'electron',
		force: process.env.force_no_cache === 'true',
		cacheRoot: process.env.electron_config_cache,
		platform: 'darwin',
		arch: 'x64',
	})
		.then((res) => res)
		.catch((err) => {
			console.error('An error occured while downloading the Intel binary:', err.stack);
			process.exit(1);
		});

	if (zipPath) {
		const nodeModules = path.join(__dirname, '../../../node_modules');
		const electron = path.join(nodeModules, 'electron');
		const electronDist = path.join(electron, 'dist');

		try {
			await fs.promises.rm(electronDist, { recursive: true });
		} catch (error) {
			console.log(error);
		} finally {
			await extract(zipPath, { dir: electronDist });
		}
	}
})();
