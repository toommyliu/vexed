import type { Bot } from "./Bot";
import { BankItem } from "./models/BankItem";
import type { ItemData } from "./models/Item";

export class Bank {
  // Whether bank items have been loaded.
  private isLoaded = false;

  public constructor(public bot: Bot) {}

  /**
   * The list of items in the bank.
   */
  public get items(): BankItem[] {
    const ret = this.bot.flash.call(() => swf.bankGetItems());
    return Array.isArray(ret)
      ? ret.map((item: ItemData) => new BankItem(item))
      : [];
  }

  /**
   * Gets an item from the Bank.
   *
   * @remarks
   * Bank items must have been loaded beforehand to retrieve an item.
   * @param key - The name or ID of the item.
   */
  public get(key: number | string): BankItem | null {
    return this.bot.flash.call(() => {
      const item = swf.bankGetItem(key);
      if (!item) return null;

      return new BankItem(item);
    });
  }

  /**
   * Whether an item meets the quantity in the bank.
   *
   * @remarks If the item is a Class, the quantity is ignored.
   * @param key - The name or ID of the item.
   * @param quantity - The quantity of the item.
   */
  public contains(key: number | string, quantity: number = 1): boolean {
    return this.bot.flash.call(() => swf.bankContains(key, quantity));
  }

  /**
   * The number of bank slots.
   */
  public get totalSlots(): number {
    return this.bot.flash.call(() => swf.bankGetSlots());
  }

  /**
   * The number of bank slots currently in use.
   */
  public get usedSlots(): number {
    return this.bot.flash.call(() => swf.bankGetUsedSlots());
  }

  /**
   * The number of bank slots available.
   */
  public get availableSlots(): number {
    return this.totalSlots - this.usedSlots;
  }

  /**
   * Puts an item into the bank.
   *
   * @param key - The name or ID of the item.
   */
  public async deposit(key: number | string): Promise<void> {
    if (!this.bot.inventory.get(key)) {
      throw new Error("Item not found in inventory");
    }

    await this.open();

    this.bot.flash.call<boolean>(() => swf.bankDeposit(key));
    await this.bot.waitUntil(
      () => this.get(key) !== null && this.bot.inventory.get(key) === null,
      () => this.bot.auth.isLoggedIn(),
      3,
    );
  }

  /**
   * Puts multiple items into the bank.
   *
   * @param items - The list of items to deposit.
   */
  public async depositMultiple(items: (number | string)[]): Promise<void> {
    if (!Array.isArray(items) || !items.length) return;

    await Promise.all(items.map(async (item) => this.deposit(item)));
  }

  /**
   * Takes an item out of the bank.
   *
   * @param key - The name or ID of the item.
   */
  public async withdraw(key: number | string): Promise<void> {
    await this.open();

    if (!this.get(key)) {
      return;
    }

    if (this.bot.inventory.get(key)) {
      return;
    }

    this.bot.flash.call<boolean>(() => swf.bankWithdraw(key));

    await this.bot.waitUntil(
      () => this.get(key) === null && this.bot.inventory.get(key) !== null,
      () => this.bot.auth.isLoggedIn(),
      3,
    );
  }

  public async withdrawMultiple(items: (number | string)[]): Promise<void> {
    if (!Array.isArray(items) || !items.length) return;

    await Promise.all(items.map(async (item) => this.withdraw(item)));
  }

  /**
   * Swaps an item from the bank with an item from the inventory.
   *
   * @param bankItem - The name or ID of the item from the Bank.
   * @param inventoryItem - The name or ID of the item from the Inventory.
   */
  public async swap(
    bankItem: number | string,
    inventoryItem: number | string,
  ): Promise<void> {
    await this.open();

    const isInBank = () => Boolean(this.get(bankItem));
    const isInInventory = () => Boolean(this.bot.inventory.get(inventoryItem));

    if (!isInBank() || !isInInventory()) {
      return;
    }

    this.bot.flash.call(() => swf.bankSwap(inventoryItem, bankItem));
    await this.bot.waitUntil(
      () => !isInBank() && !isInInventory(),
      () => this.bot.player.isReady(),
      3,
    );
  }

  /**
   * Swaps multiple items between the bank and inventory.
   *
   * @param items - A list of item pairs to swap.
   */
  public async swapMultiple(
    items: [number | string, number | string][],
  ): Promise<void> {
    if (!Array.isArray(items) || !items.length) return;

    await Promise.all(
      items.map(async ([bankItem, inventoryItem]) =>
        this.swap(bankItem, inventoryItem),
      ),
    );
  }

  /**
   * Opens the bank ui, and loads all items if needed.
   *
   * @param force - Whether to force open the bank ui, regardless of whether it's open.
   * @param loadItems - Whether to load all items in the bank, regardless of whether they've been loaded.
   */
  public async open(
    force: boolean = false,
    loadItems: boolean = false,
  ): Promise<void> {
    if (!force && this.isOpen()) {
      return;
    }

    // If it's already open, close it first
    if (this.isOpen()) {
      this.bot.flash.call(() => swf.bankOpen());
      await this.bot.waitUntil(() => !this.isOpen());
      await this.bot.sleep(500);
    }

    // Open the ui
    this.bot.flash.call(() => swf.bankOpen());
    await this.bot.waitUntil(() => this.isOpen());

    // Load items if needed
    if (!this.isLoaded || loadItems) {
      this.bot.flash.call(() => swf.bankLoadItems());
      this.isLoaded = true;
    }

    await this.bot.waitUntil(
      () => this.items.length > 0 /* wait until something is loaded */,
      () => this.bot.player.isReady() && this.isOpen(),
      10,
    );
  }

  /**
   * Whether the bank ui is open.
   */
  public isOpen(): boolean {
    return this.bot.flash.call(() => swf.bankIsOpen());
  }
}
