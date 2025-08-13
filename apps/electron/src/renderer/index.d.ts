import type {
  Account as ogAccount,
  AccountWithServer as ogAccountWithServer,
} from "../common/types";

declare global {
  type Account = ogAccount & {
    scriptPath?: string;
  };
  type AccountWithServer = Account & ogAccountWithServer;
}

export {};
