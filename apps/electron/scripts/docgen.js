const fs = require('fs-extra');
const path = require('path');
const typedoc = require('typedoc');

const { inspect } = require('util');

/**
 * Converts a TypeDoc comment into a Markdown string.
 */
function concatComments(comments) {
	return (
		comments?.summary
			?.map((comment) => {
				if (
					(comment.kind === 'text' || comment.kind === 'code') &&
					comment?.text?.length > 0
				) {
					return comment.text;
				}
			})
			.join(' ') ?? ''
	);
}

async function docgen() {
	const jsonPath = path.join(__dirname, '../docs.json');
	const outDir = path.join(__dirname, '../../docs/api');

	// TODO: exclude examples from filter
	// await fs.rm(jsonPath, { force: true });

	// Generate docs.json
	const app = await typedoc.Application.bootstrap({
		entryPoints: ['./src/renderer/api/**/*.ts'],
		json: true,
		out: jsonPath,
	});

	const project = await app.convert();

	if (project) {
		await app.generateJson(project, jsonPath);

		console.log('Docs generated, starting to parse into Markdown now...');

		const json = await fs.readJSON(jsonPath, { encoding: 'utf8' });
		if (!('children' in json)) {
			return;
		}

		for (const cls of json.children.filter((ch) => ch.kind === 2)) {
			// We only need the first child which is the class/the named
			const child = cls.children[0];

			const md = [
				`---`,
				`title: ${child.name}`,
				`outline: deep`,
				`---`,
				`# ${child.name}`,
			];

			// enum
			if (child.kind === 8) {
				if (child.comment?.summary) {
					md.push(concatComments(child.comment));
					md.push('');
				}

				md.push('## Members');

				for (const child_ of child.children) {
					if (child_.kind === 16) {
						md.push(`### ${child_.name}`);

						if (child_.comment?.summary) {
							md.push(concatComments(child_.comment));
							md.push('');
						}

						const type = typeof child_.type.value;

						md.push(
							`\`${child.name}.${child_.name}\` = \`${type === 'string' ? '"' : ''}${child_.type.value}${type === 'string' ? '"' : ''}\``,
						);

						md.push('');
						md.push('');

						md.push(`Type: ${type}`);

						md.push('');
						md.push('');
					}
				}

				const outPath = path.join(outDir, 'enums', `${child.name}.md`);

				await fs.ensureFile(outPath);
				await fs.writeFile(outPath, md.join('\n')).catch((err) => err);
			} else if (child.kind === 128) {
				if (child.comment) {
					md.push(concatComments(child.comment));
				}

				const properties = [];
				const methods = [];

				for (const child_ of child.children) {
					if (
						!child_?.flags?.isPublic ||
						child_.name.startsWith('#') ||
						child_.name.startsWith('_')
					) {
						continue;
					}

					switch (child_.kind) {
						case 1024: // class property declaration
						case 262144: // properties/getters
							properties.push(`### ${child_.name}`);
							if (child_.getSignature) {
								const desc = concatComments(
									child_.getSignature.comment,
								);
								if (desc) {
									properties.push(desc);
								}
							}
							properties.push('');
							properties.push('');
							break;
						case 2048: // method
							{
								// console.log(
								// 	inspect(cls, { depth: Infinity, colors: true }),
								// );

								const name = child_.signatures[0].name; // the name of the method
								const desc =
									child_.signatures[0].comment?.summary?.find(
										(n) => n.kind === 'text' && n.text,
									)?.text;
								// const params =
								// 	child_.signatures[0].parameters?.map(
								// 		(param) => {
								// 			if (name === 'accept') {
								// 				console.log(
								// 					inspect(param, {
								// 						depth: Infinity,
								// 						colors: true,
								// 					}),
								// 				);
								// 			}

								// 			const types =
								// 				param.type.type === 'union'
								// 					? `${param.type.types
								// 							.map(
								// 								(p) =>
								// 									p.name ??
								// 									`"${p.value}"`, // string literals
								// 							)
								// 							.join(
								// 								' | ',
								// 							)}${param.defaultValue ? ` = ${param.defaultValue.replaceAll("'", '"')}` : ''}`
								// 					: param.type.name;

								// 			return `${param.name}: ${types}`;
								// 		},
								// 	) ?? [];
								// const returnType = child_.signatures[0].type.name;

								// console.log(
								// 	`${name}(${params.join(', ')}) -> ${returnType}`,
								// );

								methods.push(`### ${name}`);
								if (desc) {
									methods.push(desc);
								}
								methods.push('');
								methods.push('');
							}
							break;
					}
				}

				if (properties.length > 0) {
					md.push('## Properties');
					md.push(...properties);
					md.push('');
					md.push('');
				}

				if (methods.length > 0) {
					md.push('## Methods');
					md.push(...methods);
				}

				const outPath = path.join(outDir, `${cls.name}.md`);

				await fs.ensureFile(outPath);
				await fs.writeFile(outPath, md.join('\n'));
			}
		}
	}
}

const start = performance.now();
docgen()
	.then(() => {
		console.log(
			`Took ${Math.floor(performance.now() - start).toFixed(2)}ms`,
		);
	})
	.catch(console.log);
