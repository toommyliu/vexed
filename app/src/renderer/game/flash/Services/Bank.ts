import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface BankShape {
  contains(item: ItemIdentifierToken, quantity?: number): BridgeEffect<boolean>;
  deposit(item: ItemIdentifierToken): BridgeEffect<boolean>;
  depositMany(...items: ItemIdentifierToken[]): BridgeEffect<void>;
  getItem(item: ItemIdentifierToken): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<unknown[]>;
  getSlots(): BridgeEffect<number>;
  getUsedSlots(): BridgeEffect<number>;
  getAvailableSlots(): BridgeEffect<number>;
  isOpen(): BridgeEffect<boolean>;
  open(force?: boolean): BridgeEffect<void>;
  swap(
    invKey: ItemIdentifierToken,
    bankKey: ItemIdentifierToken,
  ): BridgeEffect<boolean>;
  withdraw(key: ItemIdentifierToken): BridgeEffect<boolean>;
  withdrawMany(...items: ItemIdentifierToken[]): BridgeEffect<void>;
}

export class Bank extends ServiceMap.Service<Bank, BankShape>()(
  "flash/Services/Bank",
) {}
