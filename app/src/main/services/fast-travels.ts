import type { FsJsonParseError, FsReadError } from "@vexed/fs";
import { readJson, writeJson } from "@vexed/fs";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { Result, TaggedError } from "better-result";
import { DEFAULT_FAST_TRAVELS, FAST_TRAVELS_PATH } from "~/shared/constants";
import type { FastTravel } from "~/shared/types";
import { createLogger } from "./logger";

const logger = createLogger("service:fast-travels");

export class FastTravelFileError extends TaggedError("FastTravelFileError")<{
  cause?: unknown;
  message: string;
  path: string;
}>() {}

export class FastTravelNotFoundError extends TaggedError(
  "FastTravelNotFoundError",
)<{
  message: string;
  name: string;
}>() {}

export class FastTravelDuplicateNameError extends TaggedError(
  "FastTravelDuplicateNameError",
)<{
  message: string;
  name: string;
}>() {}

async function save(
  fastTravels: FastTravel[],
): Promise<Result<void, FastTravelFileError>> {
  return Result.gen(async function* () {
    const result = await writeJson(FAST_TRAVELS_PATH, fastTravels);
    if (result.isErr()) {
      logger.error("Failed to write fast travels file", result.error);
    }
    yield* result.mapError(
      (error) =>
        new FastTravelFileError({
          cause: error,
          message: "Failed to write fast travels file",
          path: FAST_TRAVELS_PATH,
        }),
    );
    return Result.ok();
  });
}

export const fastTravels = {
  async add(
    fastTravel: FastTravel,
  ): Promise<
    Result<
      void,
      | FastTravelDuplicateNameError
      | FastTravelFileError
      | FsJsonParseError
      | FsReadError
    >
  > {
    const fastTravelsResult = await this.getAll();
    if (fastTravelsResult.isErr()) return fastTravelsResult;
    const fastTravels = fastTravelsResult.value;
    const exists = fastTravels.some((ft) =>
      equalsIgnoreCase(ft.name, fastTravel.name),
    );
    if (exists) {
      return Result.err(
        new FastTravelDuplicateNameError({
          message: `Fast travel with name "${fastTravel.name}" already exists`,
          name: fastTravel.name,
        }),
      );
    }

    fastTravels.push(fastTravel);
    return save(fastTravels);
  },

  async getAll(): Promise<
    Result<FastTravel[], FsJsonParseError | FsReadError>
  > {
    return Result.gen(async function* () {
      const result = await readJson<FastTravel[]>(FAST_TRAVELS_PATH);
      if (result.isErr()) {
        logger.error("Failed to read fast travels file", result.error);
      }
      const data = yield* result;
      if (!Array.isArray(data)) return Result.ok([...DEFAULT_FAST_TRAVELS]);
      return Result.ok(data);
    });
  },

  async remove(
    name: string,
  ): Promise<
    Result<
      void,
      | FastTravelFileError
      | FastTravelNotFoundError
      | FsJsonParseError
      | FsReadError
    >
  > {
    const fastTravelsResult = await this.getAll();
    if (fastTravelsResult.isErr()) return fastTravelsResult;
    const fastTravels = fastTravelsResult.value;
    const idx = fastTravels.findIndex((ft) => equalsIgnoreCase(ft.name, name));
    if (idx === -1) {
      return Result.err(
        new FastTravelNotFoundError({
          message: `Fast travel with name "${name}" not found`,
          name,
        }),
      );
    }

    fastTravels.splice(idx, 1);
    return save(fastTravels);
  },

  async update(
    originalName: string,
    updated: FastTravel,
  ): Promise<
    Result<
      void,
      | FastTravelDuplicateNameError
      | FastTravelFileError
      | FastTravelNotFoundError
      | FsJsonParseError
      | FsReadError
    >
  > {
    const fastTravelsResult = await this.getAll();
    if (fastTravelsResult.isErr()) return fastTravelsResult;
    const fastTravels = fastTravelsResult.value;
    const idx = fastTravels.findIndex((ft) =>
      equalsIgnoreCase(ft.name, originalName),
    );
    if (idx === -1) {
      return Result.err(
        new FastTravelNotFoundError({
          message: `Fast travel with name "${originalName}" not found`,
          name: originalName,
        }),
      );
    }

    if (!equalsIgnoreCase(updated.name, originalName)) {
      const exists = fastTravels.some((ft) =>
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

    fastTravels[idx] = updated;
    return save(fastTravels);
  },
};
