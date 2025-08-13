// import { Command } from "@botting/command";
// import { LoadoutConfig } from "../../util/LoadoutConfig";

// export class CommandEquipLoadout extends Command {
//   private static configs: Map<string, LoadoutConfig> = new Map();

//   public loadoutName!: string;

//   public override async execute() {
//     const config =
//       CommandEquipLoadout.configs.get(this.loadoutName) ??
//       new LoadoutConfig(this.loadoutName);

//     if (!CommandEquipLoadout.configs.has(this.loadoutName)) {
//       CommandEquipLoadout.configs.set(this.loadoutName, config);
//     }

//     await config.load();

//     // TODO:
//   }

//   public override toString() {
//     return `Equip loadout: ${this.loadoutName}`;
//   }
// }
