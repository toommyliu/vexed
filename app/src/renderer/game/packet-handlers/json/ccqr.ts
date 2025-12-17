import type { JsonPacketHandler } from "../types";

export default {
  cmd: "ccqr",
  type: "json",
  run: () => {},
} satisfies JsonPacketHandler<unknown>;
