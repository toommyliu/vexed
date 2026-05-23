import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface Outfit {
  readonly name: string;
  readonly data: Record<string, unknown>;
}

export interface OutfitEquipOptions {
  readonly keepColors?: boolean;
}

export interface OutfitsShape {
  getAll(): BridgeEffect<readonly Outfit[]>;
  get(name: string): BridgeEffect<Outfit | null>;
  equip(name: string, options?: OutfitEquipOptions): BridgeEffect<boolean>;
  wear(name: string, options?: OutfitEquipOptions): BridgeEffect<boolean>;
}

export class Outfits extends ServiceMap.Service<Outfits, OutfitsShape>()(
  "flash/Services/Outfits",
) {}
