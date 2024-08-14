const now = performance.now();

const doc = require('doxxx');
const fs = require('node:fs');
const fse = require('fs-extra');
const { join } = require('node:path');
const { inspect } = require('node:util');

// Recognize async methods
doc.contextPatternMatchers.push(function (str, parentContext) {
	// Matches async class methods
	if (/^\s*async\s+([\w$]+)\s*\(/.exec(str)) {
		return {
			type: 'method',
			constructor: parentContext.name,
			cons: parentContext.name,
			name: RegExp.$1,
			text:
				(parentContext && parentContext.name
					? parentContext.name + '.prototype.'
					: '') +
				RegExp.$1 +
				'()',
		};
	}
});

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
		case 'string[]':
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
		case 'Item':
			return '/api/struct/item';
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
		case 'PlayerState':
			return '/api/enums/playerstate';
		case 'GameAction':
			return '/api/enums/gameaction';
		case 'AvatarData':
			return '/api/typedefs/avatardata';
		case 'MonsterData':
			return '/api/typedefs/monsterdata';
		case 'FactionData':
			return '/api/typedefs/factiondata';
		case 'ServerData':
			return '/api/typedefs/serverdata';
		case 'ShopInfo':
			return '/api/typedefs/shopinfo';
	}
	return null;
};

async function gen() {
	const inputs = await fs.promises.readdir(inputDir, {
		recursive: true,
		withFileTypes: true,
	});

	console.log(`Found ${inputs.length} files to parse`);

	const enums = {};
	const typedefs = {};

	for (const input of inputs.filter((i) => i.isFile())) {
		const base = ['---', 'outline: deep', '---'];

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
			const isClass = jsdocAST[0].ctx.type === 'class';
			const _extends = jsdocAST[0].ctx.extends;
			if (isClass && _extends !== '') {
				const extendedClass = _extends;
				const typeURL = getTypeLink(extendedClass);
				const returnTypeStr = typeURL
					? `<code><a href="${typeURL}">${extendedClass}</a></code>`
					: '`' + extendedClass + '`';
				base.push(`Extends: ${returnTypeStr}`);
				base.push('');
			}
			base.push(jsdocAST[0].description.summary);
		}

		for (let i = 0; i < jsdocAST.length; i++) {
			const obj = jsdocAST[i];
			if (!obj?.ctx) {
				console.log(
					`Skipping ${input.name} because of missing ctx`,
					obj,
				);
				continue;
			}

			// Start enum declaration
			if (obj?.ctx?.type === 'declaration') {
				const enumName = obj.ctx.name;
				enums[enumName] ??= [
					'---',
					'outline: deep',
					'---',
					'',
					'',
					`# ${enumName}`,
					'',
					obj.description.summary,
					'',
					'',
					'## Members',
				];
			} else if (obj?.tags[0]?.tagType === 'typedef') {
				const typedefName = obj.type;
				typedefs[typedefName] ??= [
					'---',
					'outline: deep',
					'---',
					'',
					'',
					`# ${typedefName}`,
					'',
					'',
					'Type: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)',
					obj.description.summary,
					'',
					'',
					'## Properties',
				];

				// Loop through properties
				// obj.tags[0] is typedef tag
				for (let i = 1; i < obj.tags.length; ++i) {
					const curr = obj.tags[i];

					typedefs[typedefName].push(`### ${curr.name}`);
					typedefs[typedefName].push('');
					typedefs[typedefName].push('');
					if (curr.description.length > 0) {
						typedefs[typedefName].push(curr.description);
						typedefs[typedefName].push('');
						typedefs[typedefName].push('');
					}
					const returnType = curr.type;
					const typeURL = getTypeLink(returnType);
					const returnTypeStr = typeURL
						? `<code><a href="${typeURL}">${returnType}</a></code>`
						: '`' + returnType + '`';
					typedefs[typedefName].push(`Type: ${returnTypeStr}`);
				}
			}

			// Current is the enum key
			if (obj?.tags?.[0]?.tagType === 'memberof') {
				const enumName = obj.tags[0].tagValue;

				const entry = enums[enumName];
				entry.push(`### ${obj.ctx.name}`);
				entry.push(
					`${obj.ctx.name} = \`${obj.ctx.value.replaceAll(',', '')}\``,
				);
				entry.push('');
				entry.push('');
				entry.push(obj.description.summary);
				entry.push('');
				entry.push('');

				const returnType = obj.tags.find(
					(t) => t.tagType === 'type',
				).type;
				const typeURL = getTypeLink(returnType);
				const returnTypeStr = typeURL
					? `<code><a href="${typeURL}">${returnType}</a></code>`
					: '`' + returnType + '`';

				entry.push(`Type: ${returnTypeStr}`);
				// Skip to next block
				continue;
			}

			if (input.name === 'Bank.js') {
				console.log(obj);
			}

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
						props.push('');

						// Skip the next block since it's already parsed
						++i;
					}
				} else {
					props.push(`### ${obj.ctx.name}`);
				}
				props.push(obj.description.summary);

				if (
					obj.tags?.[0]?.tagType === 'returns' ||
					obj.tags?.[0]?.tagType === 'type'
				) {
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
						const isOptional = t.isOptional;
						return `${t.name}${isOptional ? '?' : ''}: ${t.type}${isOptional ? ` = ${t.types.includes('STRING_VALUE') ? `"${t.defaultValue}"` : t.defaultValue}` : ''}`;
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

		await fs.promises.writeFile(
			join(outPath, `${fileName.toLowerCase()}.md`),
			`${base.join('\n')}

${props.length > 1 ? props.join('\n') : ''}

${methods.length > 1 ? methods.join('\n') : ''}`,
		);
	}

	if (Object.keys(enums).length > 0) {
		console.log(`Found ${Object.keys(enums).length} enums to write`);

		for (const [enumName, enumValues] of Object.entries(enums)) {
			console.log(`Writing enum ${enumName}...`);
			const enumPath = join(
				outputDir,
				'enums',
				`${enumName.toLowerCase()}.md`,
			);
			await fse.ensureFile(enumPath);
			await fs.promises.writeFile(enumPath, enumValues.join('\n'));
		}
	}

	if (Object.keys(typedefs).length > 0) {
		console.log(`Found ${Object.keys(typedefs).length} typedefs to write`);

		for (const [typedefName, typedefValues] of Object.entries(typedefs)) {
			console.log(`Writing typedef ${typedefName}...`);
			const typedefPath = join(
				outputDir,
				'typedefs',
				`${typedefName.toLowerCase()}.md`,
			);
			await fse.ensureFile(typedefPath);
			await fs.promises.writeFile(typedefPath, typedefValues.join('\n'));
		}
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
