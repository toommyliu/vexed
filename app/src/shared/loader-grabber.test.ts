import { describe, expect, it } from "vitest";
import {
  LoaderGrabberValidationError,
  normalizeLoaderGrabberGrabRequest,
  normalizeLoaderGrabberLoadRequest,
} from "./loader-grabber";

describe("loader grabber request normalization", () => {
  it("normalizes load requests that require IDs", () => {
    expect(
      normalizeLoaderGrabberLoadRequest({ id: "42", type: "shop" }),
    ).toEqual({
      id: 42,
      type: "shop",
    });
  });

  it("normalizes load requests without IDs for armor customizer", () => {
    expect(
      normalizeLoaderGrabberLoadRequest({
        id: "not-used",
        type: "armor-customizer",
      }),
    ).toEqual({ type: "armor-customizer" });
  });

  it("rejects invalid load IDs and sources", () => {
    expect(() =>
      normalizeLoaderGrabberLoadRequest({ id: 0, type: "quest" }),
    ).toThrow(LoaderGrabberValidationError);
    expect(() =>
      normalizeLoaderGrabberLoadRequest({ id: 1.9, type: "quest" }),
    ).toThrow(LoaderGrabberValidationError);
    expect(() =>
      normalizeLoaderGrabberLoadRequest({ id: "1.9", type: "quest" }),
    ).toThrow(LoaderGrabberValidationError);
    expect(() =>
      normalizeLoaderGrabberLoadRequest({ id: 1, type: "missing" }),
    ).toThrow(LoaderGrabberValidationError);
  });

  it("normalizes grab requests and rejects unknown sources", () => {
    expect(normalizeLoaderGrabberGrabRequest({ type: "inventory" })).toEqual({
      type: "inventory",
    });
    expect(() =>
      normalizeLoaderGrabberGrabRequest({ type: "missing" }),
    ).toThrow(LoaderGrabberValidationError);
  });
});
