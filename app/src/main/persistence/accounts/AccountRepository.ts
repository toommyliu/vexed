import { Effect, Layer, ServiceMap, SynchronizedRef } from "effect";
import type { AccountManagerState } from "../../../shared/ipc";
import { MainEnvironment } from "../../app/MainEnvironment";
import { Observability } from "../../app/MainObservability";
import { Persistence, type PersistenceError } from "../Persistence";
import {
  ACCOUNT_MANAGER_STORAGE_FILE,
  emptyAccountManagerStorage,
  normalizeAccountManagerStorage,
  serializeAccountManagerStorage,
  type AccountManagerStorage,
} from "./AccountStore";

export interface AccountManagerRepositoryShape {
  readonly storagePath: string;
  readonly get: Effect.Effect<AccountManagerStorage, PersistenceError>;
  readonly set: (
    storage: AccountManagerStorage,
  ) => Effect.Effect<AccountManagerStorage, PersistenceError>;
  readonly update: (
    f: (storage: AccountManagerStorage) => AccountManagerStorage,
  ) => Effect.Effect<AccountManagerStorage, PersistenceError>;
  readonly toState: (
    sessions: AccountManagerState["sessions"],
  ) => Effect.Effect<AccountManagerState, PersistenceError>;
}

export class AccountManagerRepository extends ServiceMap.Service<
  AccountManagerRepository,
  AccountManagerRepositoryShape
>()("main/AccountManagerRepository") {}

export const AccountManagerRepositoryLive = Layer.effect(
  AccountManagerRepository,
)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;
    const observability = yield* Observability;
    const storagePath = env.appDataPath(ACCOUNT_MANAGER_STORAGE_FILE);
    const ref = yield* SynchronizedRef.make<AccountManagerStorage | null>(null);

    const load = Effect.gen(function* () {
      const result = yield* persistence.readJson(storagePath);
      if (result.status === "missing") {
        return emptyAccountManagerStorage();
      }

      if (result.status === "malformed") {
        const quarantinePath = yield* persistence.quarantineMalformed(
          storagePath,
          result.error.message,
        );
        yield* observability.warn(
          "accounts",
          "Malformed account storage file",
          {
            path: storagePath,
            quarantinePath,
            error: result.error,
          },
        );
        const defaults = emptyAccountManagerStorage();
        yield* persistence.writeJson(storagePath, defaults);
        return defaults;
      }

      return normalizeAccountManagerStorage(result.value);
    });

    const get = SynchronizedRef.updateAndGetEffect(ref, (current) =>
      current === null ? load : Effect.succeed(current),
    ).pipe(Effect.map((storage) => storage ?? emptyAccountManagerStorage()));

    const set = (storage: AccountManagerStorage) =>
      Effect.gen(function* () {
        const normalized = serializeAccountManagerStorage(storage);
        yield* persistence.writeJson(storagePath, normalized);
        yield* SynchronizedRef.set(ref, normalized);
        return normalized;
      });

    const update = (
      f: (storage: AccountManagerStorage) => AccountManagerStorage,
    ) =>
      SynchronizedRef.updateAndGetEffect(ref, (current) =>
        Effect.gen(function* () {
          const base = current ?? (yield* load);
          const normalized = serializeAccountManagerStorage(f(base));
          yield* persistence.writeJson(storagePath, normalized);
          return normalized;
        }),
      ).pipe(Effect.map((storage) => storage ?? emptyAccountManagerStorage()));

    return {
      storagePath,
      get,
      set,
      update,
      toState: (sessions) =>
        get.pipe(
          Effect.map((storage) => ({
            accounts: storage.accounts,
            groups: storage.groups,
            sessions,
            storagePath,
          })),
        ),
    };
  }),
);
