const { contextBridge } = require('electron/renderer');

const asyncMutex = require('async-mutex');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async');

contextBridge.exposeInMainWorld('globals', {
    mutex: asyncMutex,
    setIntervalAsync,
    clearIntervalAsync
});
