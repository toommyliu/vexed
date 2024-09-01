const fs = require('fs-extra');
const path = require('path');

const esbuild = require('esbuild');
const { tsconfigPathsPlugin } = require('esbuild-plugin-tsconfig-paths');

const readdirp = (dir, ext, files = []) => {
	fs.readdirSync(dir).forEach((file) => {
		const fullPath = path.join(dir, file);
		if (fs.statSync(fullPath).isDirectory()) {
			readdirp(fullPath, ext, files);
		} else if (ext.includes(path.extname(file))) {
			files.push(fullPath);
		}
	});
	return files;
};

{
	const now = performance.now();

	esbuild
		.build({
			entryPoints: readdirp('./src/main/', ['.ts']),
			outdir: 'dist/main/',
			platform: 'node',
			target: 'node12',
			format: 'cjs',
		})
		.then(() => {
			console.log(
				`Built main in ${(performance.now() - now).toFixed(2)}ms`,
			);
		});
}

{
	const now = performance.now();

	esbuild
		.build({
			// entryPoints: readdirp('./src/renderer/', ['.ts']).map((f) =>
			// 	path.join(__dirname, f),
			// ),
			// bundle: true,
			// outfile: 'dist/renderer/script.js',
			entryPoints: ['src/renderer/script.ts'],
			inject: readdirp('./src/renderer/', ['.ts'])
				.filter((f) => f !== 'script.ts')
				.map((f) => path.join(__dirname, f)),
			bundle: true,
			platform: 'node',
			target: 'chrome80',
			format: 'cjs',
			plugins: [
				tsconfigPathsPlugin({
					cwd: process.cwd(),
					tsconfig: 'tsconfig.json',
					filter: /.*/,
				}),
			],
		})
		.then(() => {
			console.log(
				`Built renderer in ${(performance.now() - now).toFixed(2)}ms`,
			);
		});
}
