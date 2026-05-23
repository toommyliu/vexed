import { describe, expect, it } from "vitest";
import {
  formatErrorInfo,
  makeRecordLine,
  normalizeObservabilityInput,
  sanitizeLogValue,
} from "./observability";

describe("observability sanitization", () => {
  it("redacts sensitive object keys", () => {
    expect(
      sanitizeLogValue({
        username: "main",
        password: "secret",
        headers: {
          authorization: "token",
        },
      }),
    ).toEqual({
      username: "main",
      password: "[REDACTED]",
      headers: "[REDACTED]",
    });
  });

  it("handles circular objects and non-json primitives", () => {
    const value: Record<string, unknown> = {
      id: 1,
      count: BigInt(2),
    };
    value["self"] = value;

    expect(sanitizeLogValue(value)).toEqual({
      id: 1,
      count: "2",
      self: "[Circular]",
    });
  });

  it("formats errors without leaking undefined optional fields", () => {
    const error = new Error("boom");
    delete (error as { stack?: string }).stack;

    expect(formatErrorInfo(error)).toEqual({
      name: "Error",
      message: "boom",
    });
  });

  it("normalizes renderer log input", () => {
    expect(
      normalizeObservabilityInput({
        level: "warn",
        source: "renderer",
        component: "settings",
        message: " preference changed ",
        data: {
          token: "secret",
        },
      }),
    ).toEqual({
      level: "warn",
      source: "renderer",
      component: "settings",
      message: "preference changed",
      data: {
        token: "[REDACTED]",
      },
    });
  });

  it("truncates primitive renderer messages", () => {
    const input = normalizeObservabilityInput("x".repeat(9_000));

    expect(input.message).toHaveLength(8_014);
    expect(input.message.endsWith("...[truncated]")).toBe(true);
  });

  it("keeps oversized record lines bounded", () => {
    const line = makeRecordLine({
      id: 1,
      runId: "run",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "error",
      source: "renderer",
      component: "renderer",
      message: "x".repeat(200_000),
      data: { payload: "y".repeat(200_000) },
      error: {
        message: "z".repeat(200_000),
        stack: "s".repeat(200_000),
      },
    });

    expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(128_001);
  });
});
