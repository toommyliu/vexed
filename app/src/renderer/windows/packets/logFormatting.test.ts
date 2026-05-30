import { describe, expect, it } from "vitest";
import { formatPacketLogEntries } from "./logFormatting";

describe("packet log formatting", () => {
  const entries = [
    {
      text: "%xt%first%",
      timestamp: new Date(2026, 4, 30, 12, 1, 2, 3).getTime(),
      type: "client",
    },
    {
      text: '{"b":2}',
      timestamp: new Date(2026, 4, 30, 12, 1, 3, 45).getTime(),
      type: "server",
    },
    {
      text: "extension-packet",
      timestamp: new Date(2026, 4, 30, 12, 1, 4, 567).getTime(),
      type: "extension",
    },
  ];

  it("formats all provided packet entries in original order", () => {
    expect(formatPacketLogEntries(entries, false)).toBe(
      [
        "[CLIENT] %xt%first%",
        '[SERVER] {"b":2}',
        "[EXTENSION] extension-packet",
      ].join("\n"),
    );
  });

  it("includes timestamps when requested", () => {
    expect(formatPacketLogEntries(entries.slice(0, 2), true)).toBe(
      [
        "[12:01:02.003] [CLIENT] %xt%first%",
        '[12:01:03.045] [SERVER] {"b":2}',
      ].join("\n"),
    );
  });

  it("formats only the entries supplied by the caller", () => {
    expect(formatPacketLogEntries([entries[1]!], false)).toBe(
      '[SERVER] {"b":2}',
    );
  });
});
