import { ArmyCommand } from "./ArmyCommand";

const ALLOWED_KEYS = ["armor", "cape", "class", "helm", "pet", "weapon"];

export class CommandArmyEquipSet extends ArmyCommand {
  public setName!: string;

  // When true, resolves item names through a common lookup table.
  public refMode: boolean = false;

  public override async execute(): Promise<void> {
    const set = this.bot.army.config.get(this.setName) as unknown as Record<
      string,
      Set
    >;

    if (!set) {
      this.logger.warn(`set "${this.setName}" not found in config`);
      return;
    }

    const playerNumber = this.bot.army.getPlayerNumber();
    if (playerNumber === -1) {
      this.logger.warn("could not determine player number");
      return;
    }

    let playerSet = set[`Player${playerNumber}`] as Set;

    if (!playerSet || typeof playerSet !== "object") {
      // Try to fallback to Default set
      playerSet = set?.["Default"] as Set;

      if (!playerSet || typeof playerSet !== "object") {
        this.logger.warn("no default or player set found");
        return;
      }
    }

    for (const [key, item] of Object.entries(playerSet)) {
      if (!ALLOWED_KEYS.includes(key.toLowerCase())) continue;

      const resItem = this.#resolveItem(item);
      if (resItem) {
        this.logger.debug(`equipping ${key} -> ${resItem}`);
        await this.bot.inventory.equip(resItem);
      }
    }
  }

  public override toString() {
    return `Army equip set: ${this.setName}${this.refMode ? " [ref mode]" : ""}`;
  }

  #resolveItem(item: string): string | null {
    if (this.refMode) {
      const res = this.bot.army.config.get(item);
      return typeof res === "string" ? res : null;
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
  Weapon?: string;
};
