const { resolve } = require('path');
const { readdir } = require('fs-extra');
const { build, context } = require('esbuild');

const watch = process.argv.includes('--watch');

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const readdirp = async (dir) => {
	const dirents = await readdir(dir, { withFileTypes: true });
	const filtered = dirents.filter((dirent) => {
		if (dirent.isFile()) {
			return !dirent.name.startsWith('.') && dirent.name.endsWith('.ts');
		}
		return true;
	});
	const files = await Promise.all(
		filtered.map((dirent) => {
			const res = resolve(dir, dirent.name);
			return dirent.isDirectory() ? readdirp(res) : res;
		}),
	);
	return Array.prototype.concat(...files);
};

/**
 * @returns {Promise<void>}
 */
async function transpile() {
	try {
		/**
		 * @type {import('esbuild').BuildOptions}
		 */
		const config = {
			platform: 'node',
			target: 'chrome80',
			format: 'cjs',
			minify: true,
			sourcemap: true,
			treeShaking: true,
		};

		if (watch) {
			const createRebuildPlugin = (context) => ({
				name: `rebuild-logger-${context}`,
				setup(build) {
					build.onStart(() => {
						console.time(`${context} rebuild`);
					});

					build.onEnd((result) => {
						const timestamp = new Date().toLocaleTimeString();
						if (result.errors.length > 0) {
							console.error(
								`[${timestamp}] ${context} rebuild failed:`,
								result.errors,
							);
						} else {
							console.timeEnd(`${context} rebuild`);
							console.log(
								`[${timestamp}] ${context} rebuilt successfully`,
							);
						}
					});
				},
			});

			const mainCtx = await context({
				...config,
				entryPoints: await readdirp('./src/main/'),
				outdir: 'dist/main/',
				plugins: [createRebuildPlugin('Main')],
			});

			const commonCtx = await context({
				...config,
				entryPoints: await readdirp('./src/common/'),
				outdir: 'dist/common/',
				plugins: [createRebuildPlugin('Common')],
			});

			const rendererCtx = await context({
				...config,
				entryPoints: await readdirp('./src/renderer/'),
				outdir: 'dist/renderer/',
				plugins: [createRebuildPlugin('Renderer')],
			});

			await mainCtx.watch();
			await commonCtx.watch();
			await rendererCtx.watch();

			console.log('Watching for changes...');
		} else {
			// One-time build
			console.time('Main took');
			await build({
				...config,
				entryPoints: await readdirp('./src/main/'),
				outdir: 'dist/main/',
			});
			console.timeEnd('Main took');

			console.time('Common took');
			await build({
				...config,
				entryPoints: await readdirp('./src/common/'),
				outdir: 'dist/common/',
			});
			console.timeEnd('Common took');

			console.time('Renderer took');
			await build({
				...config,
				entryPoints: await readdirp('./src/renderer/'),
				outdir: 'dist/renderer/',
			});
			console.timeEnd('Renderer took');
		}
	} catch (error) {
		console.log(`An error occurred while transpiling: ${error}`);

		if (!watch) {
			process.exit(1);
		}
	}
}

transpile();
