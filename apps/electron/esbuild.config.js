const fs = require('fs-extra');
const path = require('path');

const ts = require('typescript');
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

		/**
		 * Updates any import paths to be relative to the html file, and not the current file.
		 * @type {import('esbuild').Plugin}
		 */
		const pathResolverPlugin = {
			name: 'path-resolver',
			setup(build) {
				build.onLoad({ filter: /\.(ts)$/ }, async (args) => {
					if (
						args.path ===
						'/Users/tommyliu/Documents/projects/repos/vexed/apps/electron/src/renderer/index.d.ts'
					) {
						return;
					}

					const code = await fs.promises.readFile(args.path, 'utf8');

					const rendererSrc = path.join(__dirname, 'src/renderer');
					const rendererDist = path.join(__dirname, 'dist/renderer');

					// ts input path
					const tsPath = args.path;
					// js output path
					const jsPath = `${path
						.join(
							rendererDist,
							args.path.substring(rendererSrc.length),
						)
						.slice(0, -3)}.js`;

					const indexPath = path.resolve(
						__dirname,
						'dist/renderer/index.html',
					);

					const transformedCode = code.replace(
						/import\s+.*?\s+from\s+['"](.*)['"]/g,
						(match, importPath) => {
							if (importPath.startsWith('./')) {
								// api/bot.js
								const pathRelativeToRenderer = path.relative(
									rendererDist,
									jsPath,
								);

								// api
								const pathToGetToTranspiledFile =
									getDirectories(pathRelativeToRenderer);

								// new import path
								const normalizedPath = `${path.join(
									pathToGetToTranspiledFile,
									importPath,
								)}.js`;

								console.log(normalizedPath);

								return match.replace(
									importPath,
									normalizedPath,
								);
							}
							return match;
						},
					);

					return {
						contents: transformedCode,
						loader: 'ts',
					};
				});
			},
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
				plugins: [pathResolverPlugin],
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
