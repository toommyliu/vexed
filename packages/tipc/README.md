# @vexed/tipc

[@egoist/tipc](https://github.com/egoist/tipc) but targetting electron 6.1.12.

# Changes Made
1. Add `ipcMain.handle()` and `ipcRenderer.invoke()` polyfill (which was added in v7)
2. Use `@lukeed/uuid` instead of `node:crypto` crypto.randomUUID() (runtime incompatible)
3. Added support for CommonJS imports
4. Nestable router handlers

# Original README
[ORIGINAL-README.md](ORIGINAL-README.md)
