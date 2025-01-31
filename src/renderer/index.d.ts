import type {
	Account as ogAccount,
	AccountWithServer as ogAccountWithServer,
} from '../common/types';

declare global {
	type Account = ogAccount;
	type AccountWithServer = ogAccountWithServer;
}

export {};
