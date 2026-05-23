import { Effect, Layer, ServiceMap, SynchronizedRef } from "effect";
import {
  cloneCombatProfileLibrary,
  DEFAULT_COMBAT_PROFILE_LIBRARY,
  normalizeCombatProfileLibrary,
  type CombatProfileLibrary,
} from "../../../shared/combat-profiles";
import { MainEnvironment } from "../../app/MainEnvironment";
import { Observability } from "../../app/MainObservability";
import { Persistence, type PersistenceError } from "../Persistence";

export interface CombatProfileRepositoryShape {
  readonly path: string;
  readonly get: Effect.Effect<CombatProfileLibrary, PersistenceError>;
  readonly set: (
    library: CombatProfileLibrary,
  ) => Effect.Effect<CombatProfileLibrary, PersistenceError>;
  readonly update: (
    f: (library: CombatProfileLibrary) => CombatProfileLibrary,
  ) => Effect.Effect<CombatProfileLibrary, PersistenceError>;
}

export class CombatProfileRepository extends ServiceMap.Service<
  CombatProfileRepository,
  CombatProfileRepositoryShape
>()("main/CombatProfileRepository") {}

export const CombatProfileRepositoryLive = Layer.effect(
  CombatProfileRepository,
)(
  Effect.gen(function* () {
    const env = yield* MainEnvironment;
    const persistence = yield* Persistence;
    const observability = yield* Observability;
    const path = env.appDataPath("combat-profiles.json");
    const ref = yield* SynchronizedRef.make<CombatProfileLibrary | null>(null);
    const defaults = (): CombatProfileLibrary =>
      cloneCombatProfileLibrary(DEFAULT_COMBAT_PROFILE_LIBRARY);

    const load = Effect.gen(function* () {
      const result = yield* persistence.readJson(path);
      if (result.status === "missing") {
        return defaults();
      }

      if (result.status === "malformed") {
        const quarantinePath = yield* persistence.quarantineMalformed(
          path,
          result.error.message,
        );
        yield* observability.warn(
          "combat-profiles",
          "Malformed combat profile storage file",
          { path, quarantinePath, error: result.error },
        );
        const fallback = defaults();
        yield* persistence.writeJson(path, fallback);
        return fallback;
      }

      return normalizeCombatProfileLibrary(result.value);
    });

    const get = SynchronizedRef.updateAndGetEffect(ref, (current) =>
      current === null ? load : Effect.succeed(current),
    ).pipe(Effect.map((library) => library ?? defaults()));

    const set = (library: CombatProfileLibrary) =>
      Effect.gen(function* () {
        const normalized = normalizeCombatProfileLibrary(library);
        yield* persistence.writeJson(path, normalized);
        yield* SynchronizedRef.set(ref, normalized);
        return normalized;
      });

    const update = (
      f: (library: CombatProfileLibrary) => CombatProfileLibrary,
    ) =>
      SynchronizedRef.updateAndGetEffect(ref, (current) =>
        Effect.gen(function* () {
          const base = current ?? (yield* load);
          const normalized = normalizeCombatProfileLibrary(f(base));
          yield* persistence.writeJson(path, normalized);
          return normalized;
        }),
      ).pipe(Effect.map((library) => library ?? defaults()));

    return { path, get, set, update };
  }),
);
