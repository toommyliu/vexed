import { tipc } from "@egoist/tipc";
import { FileManager } from "../../common/FileManager";

const tipcInstance = tipc.create();

export const router = {
  getAccounts: tipcInstance.procedure.action(async () =>
    // eslint-disable-next-line promise/prefer-await-to-then
    FileManager.readJson<Account[]>(FileManager.accountsPath).catch(() => []),
  ),
};

export type Router = typeof router;
