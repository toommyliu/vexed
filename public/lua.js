let script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.min.js';

document.body.appendChild(script);

script = document.createElement('script');
script.textContent = `
	window.lua_ready = false;
	window.load_lua_runtime = function () {
		if (window.lua_ready) {
			return;
		}

		const fwddec = require('./lua/fwddec');
		const { fengari } = window;

		for (const tbl of Object.keys(fwddec)) {
			window[tbl] = fwddec[tbl];

			// push the table
			fengari.interop.push(fengari.L, window[tbl]);
			// set the variable
			fengari.lua.lua_setglobal(fengari.L, fengari.to_luastring(tbl));
		}

		window.lua_ready = true;
	}

	function executeLua(code) {
		if (!window.lua_ready) {
			window.load_lua_runtime();
		}

		return fengari.load(code)();
	}
`;

document.body.appendChild(script);
