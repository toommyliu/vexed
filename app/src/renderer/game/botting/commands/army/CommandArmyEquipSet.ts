import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyEquipSet extends ArmyCommand {
  public setName!: string;

  // When true, resolves item names through a common lookup table.
  public refMode: boolean = false;

  public override async executeImpl() {
    const set = this.bot.army.config.get(this.setName) as unknown as Record<
      string,
      Set
    >;

    if (!set) {
      this.logger.warn(`Set "${this.setName}" not found in config.`);
      return;
    }

    const playerNumber = this.bot.army.getPlayerNumber();
    if (playerNumber === -1) {
      this.logger.warn("Could not determine player number.");
      return;
    }

    let playerSet = set[`Player${playerNumber}`] as Set;

    if (!playerSet || typeof playerSet !== "object") {
      playerSet = set?.["Default"] as Set;

      if (!playerSet || typeof playerSet !== "object") {
        this.logger.warn("No set found.");
        return;
      }
    }

    await this.#equipItem(playerSet.SafeClass, "SafeClass");
    await this.#equipItem(playerSet.SafePot, "SafePot");
    await this.#equipItem(playerSet.Class, "Class");
    await this.#equipItem(playerSet.SafePot, "SafePot");
    await this.#equipItem(playerSet.Weapon, "Weapon");
    await this.#equipItem(playerSet.Cape, "Cape");
    await this.#equipItem(playerSet.Helm, "Helm");

    if (playerSet.Pots && Array.isArray(playerSet.Pots)) {
      for (const pot of playerSet.Pots) {
        const resPot = this.#resolveItem(pot);
        if (resPot)
          await this.#drinkConsumable(resPot);
      }
    }

    await this.#equipItem(playerSet.Scroll, "Scroll");
  }

  public override toString() {
    return `Army equip set: ${this.setName}${this.refMode ? " [ref mode]" : ""}`;
  }

  async #equipItem(item: string | undefined, label: string): Promise<void> {
    if (!item) {
      this.logger.warn(`No item found for ${label}.`);
      return;
    }

    const resItem = this.#resolveItem(item);
    if (resItem) {
      this.logger.debug(`Equipping ${resItem} (${label}).`);
      await this.bot.inventory.equip(resItem);
    } else {
      this.logger.warn(`Could not resolve ${item} (${label}).`);
    }
  }

  async #drinkConsumable(item: string): Promise<void> {
    this.logger.debug(`Drinking consumable: ${item}.`);
    await this.bot.inventory.equip(item);

    const res = await this.bot.waitUntil(
      () => this.bot.flash.get("world.lockdownPots", true) === false,
    );
    if (res.isErr() && res.error === "timeout")
      this.logger.warn("Timed out but potions are still locked...");

    await this.bot.combat.useSkill(5, true, true);
    await this.bot.sleep(1_000);
  }

  #resolveItem(item: string): string | null {
    if (this.refMode) {
      const res = this.bot.army.config.get(item);
      if (typeof res === "string") return res;

      this.logger.debug(`Ref "${item}" not found, using as item name.`);
      return item;
    }

    return item;
  }
}

type Set = {
  Armor?: string;
  Cape?: string;
  Class?: string;
  Helm?: string;
  Pet?: string;
  Pots?: string[];
  SafeClass?: string;
  SafePot?: string;
  Scroll?: string;
  Weapon?: string;
};
