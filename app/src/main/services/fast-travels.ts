import { readJson, writeJson } from "@vexed/fs";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { Result } from "better-result";
import { DEFAULT_FAST_TRAVELS } from "../defaults";
import {
  type FastTravelError,
  FastTravelDuplicateNameError,
  FastTravelNotFoundError,
} from "~/shared/fast-travels/errors";
import type { FastTravel } from "~/shared/fast-travels/types";
import { createLogger } from "./logger";
import { FAST_TRAVELS_PATH } from "../constants";

const logger = createLogger("service:fast-travels");

type FastTravelResult<T = void> = Promise<Result<T, FastTravelError>>;

export const fastTravels = {
  getAll: async (): FastTravelResult<FastTravel[]> =>
    Result.gen(async function* () {
      const result = await readJson<FastTravel[]>(FAST_TRAVELS_PATH);
      if (result.isErr())
        logger.error("Failed to read fast travels file", result.error);
      const data = yield* result;
      if (!Array.isArray(data)) return Result.ok([...DEFAULT_FAST_TRAVELS]);
      return Result.ok(data);
    }),

  add: async (fastTravel: FastTravel): FastTravelResult =>
    Result.gen(async function* () {
      const allFastTravels = yield* Result.await(fastTravels.getAll());
      const exists = allFastTravels.some((ft) =>
        equalsIgnoreCase(ft.name, fastTravel.name),
      );
      if (exists)
        return Result.err(
          new FastTravelDuplicateNameError({
            message: `Fast travel with name "${fastTravel.name}" already exists`,
            name: fastTravel.name,
          }),
        );
      const updated = [...allFastTravels, fastTravel];
      const writeResult = await writeJson(FAST_TRAVELS_PATH, updated);
      if (writeResult.isErr())
        logger.error("Failed to write fast travels file", writeResult.error);
      yield* writeResult;
      return Result.ok();
    }),

  remove: async (name: string): FastTravelResult =>
    Result.gen(async function* () {
      const allFastTravels = yield* Result.await(fastTravels.getAll());
      const idx = allFastTravels.findIndex((ft) =>
        equalsIgnoreCase(ft.name, name),
      );
      if (idx === -1)
        return Result.err(
          new FastTravelNotFoundError({
            message: `Fast travel with name "${name}" not found`,
            name,
          }),
        );
      const updated = allFastTravels.filter((_, currIdx) => currIdx !== idx);
      const writeResult = await writeJson(FAST_TRAVELS_PATH, updated);
      if (writeResult.isErr())
        logger.error("Failed to write fast travels file", writeResult.error);
      yield* writeResult;
      return Result.ok();
    }),

  update: async (originalName: string, updated: FastTravel): FastTravelResult =>
    Result.gen(async function* () {
      const allFastTravels = yield* Result.await(fastTravels.getAll());
      const idx = allFastTravels.findIndex((ft) =>
        equalsIgnoreCase(ft.name, originalName),
      );
      if (idx === -1)
        return Result.err(
          new FastTravelNotFoundError({
            message: `Fast travel with name "${originalName}" not found`,
            name: originalName,
          }),
        );

      if (!equalsIgnoreCase(updated.name, originalName)) {
        const exists = allFastTravels.some((ft) =>
          equalsIgnoreCase(ft.name, updated.name),
        );
        if (exists)
          return Result.err(
            new FastTravelDuplicateNameError({
              message: `Fast travel with name "${updated.name}" already exists`,
              name: updated.name,
            }),
          );
      }

      const copy = [...allFastTravels];
      copy[idx] = updated;
      const writeResult = await writeJson(FAST_TRAVELS_PATH, copy);
      if (writeResult.isErr())
        logger.error("Failed to write fast travels file", writeResult.error);
      yield* writeResult;
      return Result.ok();
    }),
};
