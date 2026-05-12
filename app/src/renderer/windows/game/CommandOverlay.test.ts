import { describe, expect, it } from "vitest";
import {
  formatCommandIndex,
  getClampedOverlayPosition,
  getClampedOverlaySize,
  getScrollTopForVisibleIndex,
  getVirtualRange,
} from "./CommandOverlay";

describe("command overlay virtualization", () => {
  it("returns an overscanned visible window", () => {
    expect(getVirtualRange(1000, 280, 140, 28, 2)).toEqual({
      start: 8,
      end: 17,
    });
  });

  it("clamps the range at list boundaries", () => {
    expect(getVirtualRange(5, 0, 84, 28, 6)).toEqual({
      start: 0,
      end: 5,
    });
    expect(getVirtualRange(0, 0, 84, 28, 6)).toEqual({
      start: 0,
      end: 0,
    });
  });

  it("clamps draggable position inside the game viewport", () => {
    expect(
      getClampedOverlayPosition(
        { x: 900, y: -20 },
        { width: 1000, height: 700 },
        { width: 260, height: 180 },
        8,
      ),
    ).toEqual({ x: 732, y: 8 });
  });

  it("clamps resized dimensions to the remaining viewport", () => {
    expect(
      getClampedOverlaySize(
        { width: 900, height: 20 },
        { x: 100, y: 120 },
        { width: 500, height: 360 },
        { width: 240, height: 96 },
        8,
      ),
    ).toEqual({ width: 392, height: 96 });
  });

  it("clamps resized height to loaded command content", () => {
    expect(
      getClampedOverlaySize(
        { width: 320, height: 420 },
        { x: 24, y: 32 },
        { width: 900, height: 700 },
        { width: 240, height: 96 },
        8,
        180,
      ),
    ).toEqual({ width: 320, height: 180 });
  });

  it("formats stable zero-padded command indices", () => {
    expect(formatCommandIndex(0, 6)).toBe("01");
    expect(formatCommandIndex(8, 128)).toBe("009");
    expect(formatCommandIndex(127, 128)).toBe("128");
  });

  it("keeps a fully visible active command at the current scroll offset", () => {
    expect(getScrollTopForVisibleIndex(4, 84, 84, 280, 28, 4)).toBe(84);
  });

  it("scrolls upward when the active command is clipped above the viewport", () => {
    expect(getScrollTopForVisibleIndex(3, 88, 84, 280, 28, 4)).toBe(56);
  });

  it("scrolls downward when the active command is clipped below the viewport", () => {
    expect(getScrollTopForVisibleIndex(6, 84, 84, 280, 28, 4)).toBe(140);
  });

  it("leaves extra context around the active command in taller viewports", () => {
    expect(getScrollTopForVisibleIndex(8, 84, 196, 560, 28, 4)).toBe(112);
  });

  it("uses compact padding when the viewport cannot fit surrounding commands", () => {
    expect(getScrollTopForVisibleIndex(3, 56, 56, 280, 28, 4)).toBe(60);
  });

  it("clamps active command scrolling to the valid scroll range", () => {
    expect(getScrollTopForVisibleIndex(0, 12, 84, 280, 28, 4)).toBe(0);
    expect(getScrollTopForVisibleIndex(9, 160, 84, 280, 28, 4)).toBe(196);
  });
});
