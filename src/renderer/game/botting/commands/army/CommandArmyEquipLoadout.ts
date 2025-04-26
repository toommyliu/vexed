import { Command } from "../../command";
import { LoadoutConfig } from "../../util/LoadoutConfig";

export class CommandArmyEquipLoadout extends Command {
  private static configs: Map<string, LoadoutConfig> = new Map();

  public loadoutName!: string;

  public override async execute() {
    if (!this.bot.army.isInitialized) {
      console.warn("Army is not initialized. Cannot equip loadout.");
      return;
    }

    const config =
      CommandArmyEquipLoadout.configs.get(this.loadoutName) ??
      new LoadoutConfig(this.loadoutName);

    if (!CommandArmyEquipLoadout.configs.has(this.loadoutName)) {
      CommandArmyEquipLoadout.configs.set(this.loadoutName, config);
    }

    await config.load();

    const playerNumber = this.bot.army.getPlayerNumber();
    if (playerNumber === -1) {
      console.warn("EquipLoadout: Player number not found");
      return;
    }

    // console.log(config.getPlayerLoadout(playerNumber));
    await this.bot.player.equipLoadout(config.getPlayerLoadout(playerNumber));
  }

  public override toString() {
    return `Army equip loadout: ${this.loadoutName}`;
  }
}
