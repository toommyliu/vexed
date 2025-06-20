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
      console.warn(`${this.setName} not found in config file.`);
      return;
    }

    const playerNumber = this.bot.army.getPlayerNumber();
    if (playerNumber === -1) {
      console.warn("Player number not found.");
      return;
    }

    let playerSet = set[`Player${playerNumber}`] as Set;

    if (!playerSet || typeof playerSet !== "object") {
      // Try to fallback to Default set
      playerSet = set?.["Default"] as Set;

      if (!playerSet || typeof playerSet !== "object") {
        console.warn(`Player${playerNumber} and Default set not found in set.`);
        return;
      }
    }

    for (const [key, item] of Object.entries(playerSet)) {
      if (!ALLOWED_KEYS.includes(key.toLowerCase())) continue;

      const resItem = this.#resolveItem(item);
      if (resItem) {
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
