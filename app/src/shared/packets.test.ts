import { describe, expect, it } from "vitest";
import {
  PACKET_QUEUE_DEFAULT_DELAY_MS,
  PACKET_QUEUE_MIN_DELAY_MS,
  clampPacketQueueDelay,
  hasSupportedPacketPlaceholders,
  isPacketSendTarget,
  normalizePacketQueuePayload,
  normalizePacketText,
  resolvePacketPlaceholders,
  type PacketPlaceholderContext,
} from "./packets";

describe("packet helpers", () => {
  const placeholderContext: PacketPlaceholderContext = {
    mapId: 12,
    mapName: "battleon",
    playerName: "Artix",
    roomNumber: 34567,
  };

  it("normalizes captured client packets to sendable text", () => {
    expect(
      normalizePacketText("[Sending - STR]: %xt%zm%mv%1%100%200%", "client"),
    ).toBe("%xt%zm%mv%1%100%200%");
    expect(normalizePacketText("%xt%zm%mv%1%100%200%", "client")).toBe(
      "%xt%zm%mv%1%100%200%",
    );
  });

  it("does not rewrite non-client packet text", () => {
    const packet = '{"t":"xt","b":{"o":{"cmd":"ct"}}}';

    expect(normalizePacketText(packet, "server")).toBe(packet);
    expect(normalizePacketText(packet, "extension")).toBe(packet);
  });

  it("validates packet send targets", () => {
    expect(isPacketSendTarget("server-string")).toBe(true);
    expect(isPacketSendTarget("client-json")).toBe(true);
    expect(isPacketSendTarget("server")).toBe(false);
  });

  it("clamps queue delays to a predictable minimum", () => {
    expect(clampPacketQueueDelay(1)).toBe(PACKET_QUEUE_MIN_DELAY_MS);
    expect(clampPacketQueueDelay("250")).toBe(250);
    expect(clampPacketQueueDelay("1e3")).toBe(1000);
    expect(clampPacketQueueDelay("10.6")).toBe(11);
    expect(clampPacketQueueDelay("")).toBe(PACKET_QUEUE_DEFAULT_DELAY_MS);
    expect(clampPacketQueueDelay("not-a-number")).toBe(
      PACKET_QUEUE_DEFAULT_DELAY_MS,
    );
  });

  it("normalizes queue payloads with at least one packet", () => {
    expect(
      normalizePacketQueuePayload({
        delayMs: "1e3",
        packets: ["%xt%", 42, "%json%"],
        target: "server-string",
      }),
    ).toEqual({
      delayMs: 1000,
      packets: ["%xt%", "%json%"],
      target: "server-string",
    });
  });

  it("rejects queue payloads without sendable packets", () => {
    expect(() =>
      normalizePacketQueuePayload({
        delayMs: 250,
        packets: [42, null],
        target: "server-string",
      }),
    ).toThrow("Packet queue is empty");
  });

  it("resolves semantic packet placeholders", () => {
    expect(
      resolvePacketPlaceholders(
        "%xt%zm%cmd%{MAP_ID}%{ROOM_NUMBER}%{MAP_NAME}%{PLAYER_NAME}%{PLAYER_NAME}%",
        placeholderContext,
      ),
    ).toBe("%xt%zm%cmd%12%34567%battleon%Artix%Artix%");
  });

  it("detects only supported packet placeholders", () => {
    expect(hasSupportedPacketPlaceholders("%xt%{ROOM_NUMBER}%")).toBe(true);
    expect(hasSupportedPacketPlaceholders("{ROOM_ID}:{UNKNOWN}")).toBe(false);
    expect(hasSupportedPacketPlaceholders("%xt%zm%cmd%1%")).toBe(false);
  });

  it("leaves unsupported placeholders unchanged", () => {
    expect(
      resolvePacketPlaceholders(
        "{ROOM_ID}:{GETMAP}:PLAYERNAME:{UNKNOWN}",
        placeholderContext,
      ),
    ).toBe("{ROOM_ID}:{GETMAP}:PLAYERNAME:{UNKNOWN}");
  });
});
