import { readJson, writeJson } from "@vexed/fs";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { Result, TaggedError } from "better-result";
import { DEFAULT_FAST_TRAVELS, FAST_TRAVELS_PATH } from "~/shared/constants";
import type { FastTravel } from "~/shared/types";

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

export class FastTravelsService {
  public async add(
    fastTravel: FastTravel,
  ): Promise<Result<void, FastTravelDuplicateNameError | FastTravelFileError>> {
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
    return this.save(fastTravels);
  }

  public async getAll(): Promise<Result<FastTravel[], FastTravelFileError>> {
    return Result.tryPromise({
      try: async () => {
        const result = await readJson<FastTravel[]>(FAST_TRAVELS_PATH);
        if (!result.isOk()) return [];
        if (!Array.isArray(result.value)) return [...DEFAULT_FAST_TRAVELS];
        return result.value;
      },
      catch: (error) =>
        new FastTravelFileError({
          cause: error,
          message: "Failed to read fast travels file",
          path: FAST_TRAVELS_PATH,
        }),
    });
  }

  public async remove(
    name: string,
  ): Promise<Result<void, FastTravelFileError | FastTravelNotFoundError>> {
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
    return this.save(fastTravels);
  }

  public async update(
    originalName: string,
    updated: FastTravel,
  ): Promise<
    Result<
      void,
      | FastTravelDuplicateNameError
      | FastTravelFileError
      | FastTravelNotFoundError
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
    return this.save(fastTravels);
  }

  private async save(
    fastTravels: FastTravel[],
  ): Promise<Result<void, FastTravelFileError>> {
    return Result.tryPromise({
      try: async () => writeJson(FAST_TRAVELS_PATH, fastTravels),
      catch: (error) =>
        new FastTravelFileError({
          cause: error,
          message: "Failed to write fast travels file",
          path: FAST_TRAVELS_PATH,
        }),
    });
  }
}

export const fastTravelsService = new FastTravelsService();
