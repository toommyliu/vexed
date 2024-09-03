const fs = require('fs-extra');
const path = require('path');

const esbuild = require('esbuild');

const readdirp = async (dir, ext, files = []) => {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			await readdirp(fullPath, ext, files);
		} else if (ext.includes(path.extname(entry.name))) {
			files.push(fullPath);
		}
	}
	return files;
};

async function transpile() {
	{
		const now = performance.now();

		await esbuild
			.build({
				entryPoints: await readdirp('./src/main/', ['.ts']),
				outdir: 'dist/main/',
				platform: 'node',
				target: 'node12',
				format: 'cjs',
			})
			.then(() => {
				console.log(
					`Built for main in ${(performance.now() - now).toFixed(2)}ms`,
				);
			});
	}

	{
		const now = performance.now();

		const getDirectories = (filePath) => {
			const directories = [];
			let currentPath = filePath;

			while (currentPath !== path.dirname(currentPath)) {
				currentPath = path.dirname(currentPath);
				// Exclude the current directory ('.') if present
				if (currentPath !== '.') {
					directories.unshift(path.basename(currentPath));
				}
			}

			return directories.join('/');
		};

		await esbuild
			.build({
				entryPoints: (await readdirp('./src/renderer/', ['.ts'])).map(
					(f) => path.join(__dirname, f),
				),
				outdir: 'dist/renderer/',
				platform: 'node',
				target: 'chrome80',
				format: 'cjs',
			})
			.then(() => {
				console.log(
					`Built for renderer in ${(performance.now() - now).toFixed(2)}ms`,
				);
			});
	}
}

transpile().catch((error) => {
	console.log(`An error occurred while transpiling: ${error}`);
});
