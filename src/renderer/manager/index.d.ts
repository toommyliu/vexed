import type { IpcRendererEvent } from 'electron';
import type { IPC_EVENTS } from '../../common/ipc-events';

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		ipc: {
			addAccount(account: Account): Promise<{ success: boolean }>;
			getAccounts(): Promise<Account[]>;
			launchGame(account: AccountWithServer): void;
			removeAccount(username: string): void;
		};

		ipcEvents: typeof IPC_EVENTS;
		ipcRenderer: {
			on(
				event: string,
				listener: (ev: IpcRendererEvent, ...args: unknown[]) => void,
			): void;
		};
	}
}

export {};
