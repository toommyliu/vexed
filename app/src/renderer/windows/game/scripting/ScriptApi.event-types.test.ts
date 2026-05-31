import { expect, test } from "vitest";
import type { ScriptEventsApi } from "./ScriptApi";

const assertEventTypes = (events: ScriptEventsApi) => {
  const monsterDeath = events.waitFor("monsterDeath");
  const questComplete = events.waitFor("questComplete");
  const afk = events.waitFor("afk");

  // @ts-expect-error waitFor is intentionally semantic-only.
  const packetFromClient = events.waitFor("packetFromClient");
  // @ts-expect-error waitFor is intentionally semantic-only.
  const packetFromServer = events.waitFor("packetFromServer");
  // @ts-expect-error waitFor is intentionally semantic-only.
  const extensionResponse = events.waitFor("extensionResponse");

  void monsterDeath;
  void questComplete;
  void afk;
  void packetFromClient;
  void packetFromServer;
  void extensionResponse;
};

void assertEventTypes;

test("script event waitFor packet exclusions are compile-time checked", () => {
  expect(true).toBe(true);
});
