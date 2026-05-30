import { describe, expect, it } from "vitest";
import { isValidQueuePacketDraft, replaceQueuePacketAt } from "./queueState";

describe("packet queue state", () => {
  it("replaces only the target queue packet", () => {
    expect(replaceQueuePacketAt(["a", "b", "c"], 1, "edited")).toEqual([
      "a",
      "edited",
      "c",
    ]);
  });

  it("returns the original queue for out-of-range indexes", () => {
    const queue = ["a", "b"];

    expect(replaceQueuePacketAt(queue, -1, "edited")).toBe(queue);
    expect(replaceQueuePacketAt(queue, 2, "edited")).toBe(queue);
    expect(replaceQueuePacketAt(queue, 0.5, "edited")).toBe(queue);
  });

  it("rejects empty queue edit drafts", () => {
    expect(isValidQueuePacketDraft("")).toBe(false);
    expect(isValidQueuePacketDraft("   \n\t")).toBe(false);
    expect(isValidQueuePacketDraft("%xt%zm%")).toBe(true);
  });
});
