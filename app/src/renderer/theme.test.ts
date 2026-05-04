import { describe, expect, it } from "vitest";
import { getTextSizeTokens } from "./theme";

describe("renderer typography tokens", () => {
  it("derives text size tokens from the configured sans base size", () => {
    expect(getTextSizeTokens(13)).toEqual({
      "--text-2xs": "10px",
      "--text-xs": "11px",
      "--text-sm": "12px",
      "--text-base": "13px",
      "--text-md": "14px",
      "--text-lg": "15px",
      "--text-xl": "16px",
      "--text-2xl": "18px",
      "--text-3xl": "20px",
      "--text-4xl": "24px",
      "--text-5xl": "28px",
    });

    expect(getTextSizeTokens(20)).toMatchObject({
      "--text-sm": "18.4615px",
      "--text-base": "20px",
      "--text-5xl": "43.0769px",
    });
  });
});
