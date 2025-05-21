import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyEquipSet extends ArmyCommand {
  public setName!: string;

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

    const playerSet = set[`Player${playerNumber}`] as Set;
    if (!playerSet) {
      console.warn(`Player${playerNumber} not found in set.`);
      return;
    }

    for (const item of Object.values(playerSet)) {
      await this.bot.inventory.equip(item);
    }
  }

  public override toString() {
    return `Army equip set: ${this.setName}`;
  }
}

type Set = {
  Cape: string;
  Class: string;
  Helm: string;
  Pet?: string;
  Weapon: string;
};
