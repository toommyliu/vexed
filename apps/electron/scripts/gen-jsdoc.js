const now = performance.now();

const doc = require('doxxx');
const fs = require('node:fs');
const { join } = require('node:path');
const { inspect } = require('node:util');

const inputDir = join(__dirname, '../src/renderer/game/botting/api');
const outputDir = join(__dirname, '../../docs/api');

const getTypeLink = (type) => {
	// TODO: improve
	switch (type) {
		case 'boolean':
			return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean';
		case 'number':
			return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number';
		case 'string':
			return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String';
		case 'Bot':
			return '/api/bot';
		case 'Server':
		case 'Server[]':
			return '/api/struct/server';
		case 'Avatar':
		case 'Avatar[]':
			return '/api/struct/avatar';
		case 'Faction':
		case 'Faction[]':
			return '/api/struct/faction';
		case '?BankItem':
		case 'BankItem':
		case 'BankItem[]':
			return '/api/struct/bankitem';
		case 'HouseItem':
		case 'HouseItem[]':
			return '/api/struct/houseitem';
		case '?InventoryItem':
		case 'InventoryItem':
		case 'InventoryItem[]':
			return '/api/struct/inventoryitem';
		case '?TempInventoryItem':
		case 'TempInventoryItem':
		case 'TempInventoryItem[]':
			return '/api/struct/tempinventoryitem';
		case 'Monster':
		case 'Monster[]':
			return '/api/struct/monster';
		case '?Quest':
		case 'Quest':
		case 'Quest[]':
			return '/api/struct/quest';
	}
	return null;
};

async function gen() {
	const inputs = await fs.promises.readdir(inputDir, {
		recursive: true,
		withFileTypes: true,
	});

	console.log(`Found ${inputs.length} files to parse`);

	for (const input of inputs.filter((i) => i.isFile())) {
		const base = ['---', 'outline: deep', '---'];
		// const base = [];

		const props = [];
		const methods = [];

		const path = join(input.path, input.name);
		const fBody = await fs.promises
			.readFile(path, 'utf-8')
			.catch((error) => {
				console.error(`Failed to read file ${input.name}`);
				if (error) {
					console.log('Reason: ', error);
				}
			});

		const jsdocAST = doc.parseComments(fBody);

		// Empty class? (e.g class MyClass extends BaseClass)
		if (jsdocAST.length === 0) {
			continue;
		}

		console.log(`Parsing ${input.name} now...`);

		base.push(`# ${input.name.split('.')[0]}`);
		base.push('');

		// Is this class/type documented?
		if (
			jsdocAST[0].ctx.type === 'class' ||
			jsdocAST[0].tags[0].tagType === 'type'
		) {
			base.push(jsdocAST[0].description.summary);
		}

		for (let i = 0; i < jsdocAST.length; i++) {
			const obj = jsdocAST[i];
			if (!obj?.ctx) {
				// console.log('Skipping this', obj);
				continue;
			}

			// console.log(obj);
			if (obj.ctx.type === 'property') {
				// Properties with no description are not useful to developers
				// TODO: make these properties private?
				if (!obj.description.summary) {
					continue;
				}

				if (props.length === 0) {
					props.push('## Properties');
				}

				// Append a newline before
				if (props[props.length] !== '') {
					props.push('');
				}

				const isGetter = obj.code.startsWith('get');

				if (isGetter) {
					props.push(`### ${obj.ctx.name}`);
					props.push('*Getter*');
					props.push('');

					// Whether the next tag is a setter
					const nextObj = jsdocAST[i + 1];
					if (nextObj?.code?.startsWith('set')) {
						props.push('*Has setter*');

						// Skip the next block since it's already parsed
						++i;
					}
				} else {
					props.push(`### ${obj.ctx.name}`);
				}
				props.push(obj.description.summary);

				if (obj.tags.length > 0 && obj.tags[0].tagType === 'returns') {
					const returnType = obj.tags[0].type;
					const typeURL = getTypeLink(returnType);
					const returnTypeStr = typeURL
						? `<code><a href="${typeURL}">${returnType}</a></code>`
						: '`' + returnType + '`';

					props.push('');
					props.push('');
					props.push(`Return type: ${returnTypeStr}`);
				}
			} else if (obj.ctx.type === 'method') {
				// console.log(inspect(obj, { colors: true, depth: Infinity }));
				// console.log('------');

				if (methods.length === 0) {
					methods.push('## Methods');
				}

				// Append a newline before
				if (methods[methods.length] !== '') {
					methods.push('');
				}

				const params = obj.tags
					.filter((t) => t.tagType === 'param')
					.map((t) => {
						return `${t.name}${t.isOptional ? '?' : ''}: ${t.type}`;
					})
					.join(', ');
				const returnType = obj.tags.find(
					(t) => t.tagType === 'returns',
				).type;

				methods.push(`### ${obj.ctx.name}`);
				methods.push(`Signature: \`${obj.ctx.name}(${params})\``);

				methods.push('');
				if (obj.description.summary) {
					methods.push(obj.description.summary);
				}

				const typeURL = getTypeLink(returnType);
				const returnTypeStr = typeURL
					? `<code><a href="${typeURL}">${returnType}</a></code>`
					: '`' + returnType + '`';

				if (input.name === 'Bank.js') {
					console.log(obj);
				}

				methods.push('');
				methods.push('');
				methods.push(`Return type: ${returnTypeStr}`);
			}
		}

		// Write to struct dir
		let outPath;
		let fileName = input.name.split('.')[0];

		if (input.path.endsWith('struct')) {
			outPath = join(outputDir, 'struct');
		} else {
			outPath = join(outputDir);
		}

		// console.log(input.name, outPath);

		await fs.promises.writeFile(
			join(outPath, `${fileName.toLowerCase()}.md`),
			`${base.join('\n')}

${props.length > 1 ? props.join('\n') : ''}

${methods.length > 1 ? methods.join('\n') : ''}`,
		);
	}
}

(async () => {
	try {
		await gen();
	} catch (error) {
		console.error('An error occurred while generating JSDoc');
		console.error(error);
	} finally {
		console.log(
			`JSDoc finished in ${Math.floor(performance.now() - now)}ms`,
		);
	}
})();
