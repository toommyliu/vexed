import { contextBridge, ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc-events';

contextBridge.exposeInMainWorld('ipc', {
	async getAccounts(): Promise<Account[]> {
		return ipcRenderer.invoke(IPC_EVENTS.GET_ACCOUNTS);
	},
	launchGame(username: string, password: string, server: string) {
		void ipcRenderer.invoke(
			IPC_EVENTS.LAUNCH_GAME,
			username,
			password,
			server,
		);
	},
	async addAccount(username: string, password: string) {
		return ipcRenderer.invoke(IPC_EVENTS.ADD_ACCOUNT, username, password);
	},
	removeAccount(username: string) {
		void ipcRenderer.invoke(IPC_EVENTS.REMOVE_ACCOUNT, username);
	},
});
contextBridge.exposeInMainWorld('ipcRenderer', {
	on(event: string, listener: (...args: unknown[]) => void) {
		if (event === IPC_EVENTS.ENABLE_BUTTON) {
			ipcRenderer.on(event, listener);
		}
	},
});
contextBridge.exposeInMainWorld('ipcEvents', IPC_EVENTS);
