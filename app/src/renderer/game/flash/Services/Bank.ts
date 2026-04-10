import { ServiceMap } from "effect";
import type { BridgeEffect } from "./Bridge";

export interface BankShape {
  contains(item: unknown, quantity?: number): BridgeEffect<boolean>;
  deposit(key: unknown): BridgeEffect<boolean>;
  getItem(item: unknown): BridgeEffect<Record<string, unknown>>;
  getItems(): BridgeEffect<unknown[]>;
  getSlots(): BridgeEffect<number>;
  getUsedSlots(): BridgeEffect<number>;
  isOpen(): BridgeEffect<boolean>;
  loadItems(force?: boolean): BridgeEffect<void>;
  open(): BridgeEffect<void>;
  swap(invKey: unknown, bankKey: unknown): BridgeEffect<boolean>;
  withdraw(key: unknown): BridgeEffect<boolean>;
}

export class Bank extends ServiceMap.Service<Bank, BankShape>()(
  "flash/Services/Bank",
) {}
