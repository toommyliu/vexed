let script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.min.js';
script.defer = true;

script.onload = () => {
	const fwddec = require('./lua/fwddec');
	const { fengari } = window;

	for (const tbl of Object.keys(fwddec)) {
		window[tbl] = fwddec[tbl];

		// push the table
		fengari.interop.push(fengari.L, window[tbl]);
		// set the variable
		fengari.lua.lua_setglobal(fengari.L, fengari.to_luastring(tbl));
	}

	window.executeLua = function (code) {
		return fengari.load(code)();
	};

	console.log('Loaded lua runtime');
};

document.body.appendChild(script);