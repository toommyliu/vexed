// https://github.com/electron/electron/blob/11-x-y/npm/install.js

if (process.platform !== 'darwin') {
    return;
}

console.log('Downloading Electron 11.5.0 Intel binary');

const fs = require('fs-extra');
const { join } = require('node:path');
const { exec } = require('child_process');
const { downloadArtifact } = require('@electron/get');

(async () => {
    const nodeModules = join(__dirname, '../../../node_modules');
    const electron = join(nodeModules, 'electron');
    const electronDist = join(electron, 'dist');
    const version = join(electronDist, '_version.txt');

    const exists = await fs.pathExists(version);
    if (exists) {
        console.log('Electron Intel binary already exists, skipping download');
        return;
    }

    const zipPath = await downloadArtifact({
        version: '11.5.0',
        artifactName: 'electron',
        force: process.env.force_no_cache === 'true',
        cacheRoot: process.env.electron_config_cache,
        platform: 'darwin',
        arch: 'x64'
    })
        .then((res) => res)
        .catch((err) => {
            console.log('An error occured while downloading the Intel binary', err);
            process.exit(1);
        });

    if (zipPath) {
        try {
            if (await fs.pathExists(electronDist)) {
                await fs.rm(electronDist, { recursive: true });
            }

            exec(`unzip -q ${zipPath} -d ${electronDist}`, (error) => {
                if (error) {
                    console.log('An error occurred while trying to unzip', error);
                    process.exit(1);
                }

                console.log('Unzipped successfully');
            });

            await fs.outputFile(version, '11.5.0');
        } catch (error) {
            console.log('An error occured during the unzip process', error);
        }
    }
})();
