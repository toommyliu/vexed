const doc = require('doxxx');

const fs = require('fs-extra');
const readdir = require('fs').promises.readdir;

const { join } = require('node:path');
const { inspect } = require('node:util');

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

const typePatterns = [
	{
		regex: /^(\?)?boolean(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',
	},
	{
		regex: /^(\?)?number(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
	},
	{
		regex: /^(\?)?string(\[\])?$/,
		url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
	},
	{ regex: /^(\?)?Bot(\[\])?$/, url: '/api/bot' },
	{ regex: /^(\?)?Server(\[\])?$/, url: '/api/struct/server' },
	{ regex: /^(\?)?Avatar(\[\])?$/, url: '/api/struct/avatar' },
	{ regex: /^(\?)?Faction(\[\])?$/, url: '/api/struct/faction' },
	{ regex: /^(\?)?Item(\[\])?$/, url: '/api/struct/item' },
	{ regex: /^(\?)?BankItem(\[\])?$/, url: '/api/struct/bankitem' },
	{ regex: /^(\?)?HouseItem(\[\])?$/, url: '/api/struct/houseitem' },
	{ regex: /^(\?)?InventoryItem(\[\])?$/, url: '/api/struct/inventoryitem' },
	{
		regex: /^(\?)?TempInventoryItem(\[\])?$/,
		url: '/api/struct/tempinventoryitem',
	},
	{ regex: /^(\?)?Monster(\[\])?$/, url: '/api/struct/monster' },
	{ regex: /^(\?)?Quest(\[\])?$/, url: '/api/struct/quest' },
	{ regex: /^(\?)?PlayerState(\[\])?$/, url: '/api/enums/playerstate' },
	{ regex: /^(\?)?GameAction(\[\])?$/, url: '/api/enums/gameaction' },
	{ regex: /^(\?)?AvatarData(\[\])?$/, url: '/api/typedefs/avatardata' },
	{ regex: /^(\?)?MonsterData(\[\])?$/, url: '/api/typedefs/monsterdata' },
	{ regex: /^(\?)?FactionData(\[\])?$/, url: '/api/typedefs/factiondata' },
	{ regex: /^(\?)?ServerData(\[\])?$/, url: '/api/typedefs/serverdata' },
	{ regex: /^(\?)?ShopInfo(\[\])?$/, url: '/api/typedefs/shopinfo' },
];

const getTypeLink = (type) => {
	for (const { regex, url } of typePatterns) {
		if (regex.test(type)) {
			return url;
		}
	}
	return null;
};

async function gen() {
	const inputs = await readdir(inputDir, {
		recursive: true,
		withFileTypes: true,
	});

	console.log(`Found ${inputs.length} files to parse...`);

	const enums = {};
	const typedefs = {};

	for (const input of inputs.filter((i) => i.isFile())) {
		const path = join(input.path, input.name);
		const code = await fs.readFile(path, 'utf-8');
		const ast = doc.parseComments(code);

		// No jsdoc found
		if (!ast.length) {
			console.warn(`No jsdoc found in ${input.name}, skipping...`);
			continue;
		}

		const title = input.name.split('.')[0];

		const md = ['---', `title: ${title}`, 'outline: deep', '---'];

		const props = [];
		const methods = [];

		console.log(`Parsing ${input.name} now`);

		md.push(`# ${title}`);
		md.push('');

		// Is this class/type documented?
		if (ast[0].ctx.type === 'class' || ast[0].tags[0].tagType === 'type') {
			const isClass = ast[0].ctx.type === 'class';
			const _extends = ast[0].ctx.extends;
			if (isClass && _extends !== '') {
				const extendedClass = _extends;
				const typeURL = getTypeLink(extendedClass);
				const returnTypeStr = typeURL
					? `<a href="${typeURL}">${extendedClass}</a>`
					: extendedClass;
				md[md.length - 2] += `<Badge>extends ${returnTypeStr}</Badge>`;
			}

			for (const line of ast[0].description.summary.split('\n')) {
				md.push(line);
				md.push('');
				md.push('');
			}
		}

		for (let i = 0; i < ast.length; i++) {
			const obj = ast[i];
			if (!obj?.ctx) {
				// console.log(
				// 	`Skipping ${input.name} because of missing ctx`,
				// 	obj,
				// );
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

			// if (input.name === 'Settings.js') {
			// 	console.log(obj);
			// }

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
					props.push(`### ${obj.ctx.name}<Badge text="getter" />`);

					// Whether the next tag is a setter
					const nextObj = ast[i + 1];
					if (nextObj?.code?.startsWith('set')) {
						props[props.length - 1] += '<Badge text="setter" />';
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
					props.push(`Type: ${returnTypeStr}`);
				}
			} else if (obj.ctx.type === 'method') {
				const isPrivate = obj.tags.some((t) => t.tagType === 'private');
				// Don't bother with @private methods since they should be meant for internal use
				if (isPrivate) {
					continue;
				}

				if (methods.length === 0) {
					methods.push('## Methods');
				}

				// Append a newline before
				if (methods[methods.length] !== '') {
					methods.push('');
				}

				if (obj.ctx.name === 'addDrop') {
					console.log(obj);
				}

				methods.push(`### ${obj.ctx.name}`);
				if (obj.description.summary) {
					methods.push(obj.description.summary);
				}

				const returnTag = obj.tags.find((t) => t.tagType === 'returns');
				const returnType = returnTag.type;

				const hasParams = obj.tags.some((t) => t.tagType === 'param');
				if (hasParams) {
					methods.push('| Parameter | Type | Description |');
					methods.push('| --------- | ---- | ----------- |');
					for (const param of obj.tags.filter(
						(t) => t.tagType === 'param',
					)) {
						methods.push(
							`| ${param.name} | ${param.type.replaceAll(/\|/g, '\\|').replaceAll(' ', '')} | ${param.description ?? ''} |`,
						);
					}
				}

				methods.push('');

				const typeURL = getTypeLink(returnType);
				const returnTypeStr = typeURL
					? `<code><a href="${typeURL}">${returnType}</a></code>`
					: '`' + returnType + '`';

				methods.push('');
				methods.push('');
				methods.push(`**Returns:** ${returnTypeStr}`);
				if (returnTag.description) {
					methods.push('');
					methods.push('');
					methods.push(returnTag.description);
				}
			}
		}

		// Write the file
		let outPath;

		if (input.path.endsWith('struct')) {
			outPath = join(outputDir, 'struct');
		} else {
			outPath = join(outputDir);
		}
		outPath = join(outPath, `${title.toLowerCase()}.md`);

		await fs.ensureFile(outPath);
		await fs.writeFile(
			outPath,
			`${md.join('\n')}

${props.length ? props.join('\n') : ''}

${methods.length ? methods.join('\n') : ''}`,
		);
	}

	console.log('');

	if (Object.keys(enums).length > 0) {
		console.log(`Found ${Object.keys(enums).length} enums to write...`);

		for (const [enumName, enumValues] of Object.entries(enums)) {
			console.log(`Writing enum ${enumName}...`);
			const enumPath = join(
				outputDir,
				'enums',
				`${enumName.toLowerCase()}.md`,
			);
			await fs.ensureFile(enumPath);
			await fs.writeFile(enumPath, enumValues.join('\n'));
		}
	}

	console.log('');

	if (Object.keys(typedefs).length > 0) {
		console.log(
			`Found ${Object.keys(typedefs).length} typedefs to write...`,
		);

		for (const [typedefName, typedefValues] of Object.entries(typedefs)) {
			console.log(`Writing typedef ${typedefName}`);
			const typedefPath = join(
				outputDir,
				'typedefs',
				`${typedefName.toLowerCase()}.md`,
			);
			await fs.ensureFile(typedefPath);
			await fs.writeFile(typedefPath, typedefValues.join('\n'));
		}
	}
}

(async () => {
	const now = performance.now();

	try {
		await gen();
	} catch (error) {
		console.log('An error occured while parsing jsdoc:');
		console.log(error);
	} finally {
		console.log('');
		console.log(`Parsing took ${Math.floor(performance.now() - now)}ms`);
	}
})();
