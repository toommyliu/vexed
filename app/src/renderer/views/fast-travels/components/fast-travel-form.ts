import type { FastTravel } from "~/shared/fast-travels/types";

export type FastTravelFormValues = {
  cell: string;
  map: string;
  name: string;
  pad: string;
};

export type FastTravelFieldError = "map" | "name";

export type FastTravelSubmitResult =
  | {
      error: string;
      fieldError?: FastTravelFieldError;
      ok: false;
    }
  | {
      ok: true;
    };

export function createFastTravelFormValues(
  fastTravel: FastTravel | null,
): FastTravelFormValues {
  return {
    cell: fastTravel?.cell ?? "",
    map: fastTravel?.map ?? "",
    name: fastTravel?.name ?? "",
    pad: fastTravel?.pad ?? "",
  };
}

export function normalizeFastTravelFormValues(values: FastTravelFormValues):
  | {
      error: string;
      fieldError: FastTravelFieldError;
      ok: false;
    }
  | {
      ok: true;
      value: FastTravel;
    } {
  const cleanName = values.name.trim();
  const cleanMap = values.map.trim().toLowerCase();
  const cleanCell = values.cell.trim();
  const cleanPad = values.pad.trim();

  if (!cleanName) {
    return {
      error: "Name is required",
      fieldError: "name",
      ok: false,
    };
  }

  if (!cleanMap) {
    return {
      error: "Map is required",
      fieldError: "map",
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      name: cleanName,
      map: cleanMap,
      ...(cleanCell ? { cell: cleanCell } : {}),
      ...(cleanPad ? { pad: cleanPad } : {}),
    },
  };
}
