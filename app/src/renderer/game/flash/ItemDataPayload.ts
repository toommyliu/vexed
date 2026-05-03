import type { ItemData } from "@vexed/game";
import { asRecord } from "./PacketPayload";

export const asItemData = (value: unknown): ItemData | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  if (
    typeof record["ItemID"] !== "number" ||
    typeof record["iQty"] !== "number" ||
    typeof record["sName"] !== "string"
  ) {
    return null;
  }

  return record as unknown as ItemData;
};
