"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const electron_1 = require("electron");
{
    const flashTrust = require('nw-flash-trust');
    electron_1.app.commandLine.appendSwitch('ppapi-flash-path', (0, path_1.join)(__dirname, '../vendor/PepperFlashPlayer.plugin'));
    const flashPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'Pepper Data', 'Shockwave Flash', 'WritableRoot');
    const trustManager = flashTrust.initSync("Vexed", flashPath);
    trustManager.empty();
    trustManager.add((0, path_1.join)(__dirname, '../public/'));
}
electron_1.app.once('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    const window = new electron_1.BrowserWindow({
        width: 960,
        height: 550,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            plugins: true,
        },
    });
    yield window.loadFile((0, path_1.join)(__dirname, '../public/index.html'));
    window.webContents.openDevTools({ mode: 'detach' });
}));
electron_1.app.on('window-all-closed', () => {
    electron_1.app.quit();
});
