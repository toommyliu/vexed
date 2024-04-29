/// <reference path="../../types/window.d.ts" />

async function mount(table: string) {
	const content = await fetch(`./dist/renderer/lua/${table}.lua`)
		.then((res) => res?.text())
		.catch(() => null);

	if (!content) return false;

	await window.lua!.doString(content);
	return true;
}

async function mountLibs() {
	let count = 0;
	const libs = ['auth', 'bank', 'combat', 'flash', 'house', 'inventory', 'map', 'player', 'settings', 'temp_inv'];

	for (const lib of libs) {
		(await mount(lib)) && count++;
	}

	console.log(`[lua] registered ${count}/${libs.length} libs.`);
}

async function createRuntime() {
	window.lua_factory ??= new window.wasmoon.LuaFactory();

	const lf = window.lua_factory;

	window.lua ??= await lf.createEngine({ injectObjects: true });

	const lua = window.lua;

	lua.global.set('swf', window.swf);
	lua.global.set('util', {
		yield: (length: number) => new Promise((r) => setTimeout(r, length)),
		str_to_bool: (input: string) => !!input?.toLowerCase(),
		set_interval: (fn: Function, delay: number) => setInterval(fn, delay),
		clear_interval: (interval_id: number) => clearInterval(interval_id),
	});

	lua.global.set('json', {
		parse: JSON.parse,
		stringify: JSON.stringify,
	});

	await lua.doString(String.raw`
	function string:contains(sub)
		return self:find(sub, 1, true) ~= nil
	end

	function string:startswith(start)
		return self:sub(1, #start) == start
	end

	function string:endswith(ending)
		return ending == "" or self:sub(-#ending) == ending
	end

	function string:split(delimiter)
		local result = {}
		local from  = 1
		local delim_from, delim_to = string.find(self, delimiter, from)
		while delim_from do
			table.insert(result, string.sub(self, from , delim_from-1))
			from = delim_to + 1
			delim_from,delim_to = string.find(self, delimiter, from)
		end
		table.insert(result, string.sub(self, from))
		return result
	end
	`);

	await mountLibs();

	console.log('[lua] ready!');
}

async function closeRuntime() {
	try {
		window.lua!.global.close();

		delete window.lua;
	} catch {}

	console.log('[lua] closed.');
}

async function resetRuntime() {
	if (window.lua && window.lua_factory) {
		await closeRuntime();
		await createRuntime();
	}
}
