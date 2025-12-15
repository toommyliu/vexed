import { Command } from "~/botting/command";
import type { InventoryItem } from "~/lib/models/InventoryItem";
import {
  getWeaponProcName,
  isBasicEnhancement,
  findEnhancementByName,
  areNamesEqual,
  getCapeProcName,
  getHelmProcName,
} from "~/lib/util/enhancements";

type ItemType = "cape" | "helm" | "weapon";

const WEAPON_PROC_VARIANTS: Record<string, string[]> = {
  "spiral carve": ["scarve", "spiral"],
  "health vamp": ["healthvamp", "hvamp", "hp vamp"],
  "mana vamp": ["manavamp", "mvamp", "mp vamp"],
  "powerword die": ["powerword", "pwd", "pw die"],
  "awe blast": ["ablast", "aweblast", "blast"],
  lacerate: ["lac"],
  smite: [],
  valiance: ["val"],
  "arcana's concerto": ["arcanas", "arcana concerto"],
  acheron: ["ach"],
  elysium: ["ely"],
  praxis: ["prax"],
  dauntless: ["dtl"],
  ravenous: ["rav"],
};

const CAPE_PROC_VARIANTS: Record<string, string[]> = {
  absolution: ["abso"],
  avarice: ["ava"],
  lament: ["lam"],
  penitence: ["peni"],
  vainglory: [],
};

export class CommandEquipByEnhancement extends Command {
  public enhancementName!: string;

  public itemType?: string;

  public override async executeImpl() {
    const targetItem = this.findMatchingItem();

    this.logger.debug(
      `Looking for ${this.enhancementName}${this.itemType ? ` [${this.itemType}]` : ""}.`,
    );

    if (targetItem && !targetItem.isEquipped()) {
      this.logger.debug(`Equipping item: ${targetItem.name}`);
      await this.bot.inventory.equip(targetItem.name);
    } else if (!targetItem) {
      this.logger.debug("No matching item found.");
    }
  }

  private findMatchingItem(): InventoryItem | undefined {
    return this.bot.inventory.items.find((item: InventoryItem) => {
      if (this.itemType) {
        const itemTypeLower = this.itemType.toLowerCase() as ItemType;
        if (itemTypeLower === "weapon" && !item.isWeapon()) return false;
        if (itemTypeLower === "cape" && !item.isCape()) return false;
        if (itemTypeLower === "helm" && !item.isHelm()) return false;
      }

      if (!item.isWeapon() && !item.isCape() && !item.isHelm()) return false;

      return this.matchesEnhancement(item);
    });
  }

  private matchesEnhancement(item: InventoryItem): boolean {
    const isBasic = isBasicEnhancement(this.enhancementName);

    if (isBasic) return this.matchesBasicEnhancement(item);
    if (item.isWeapon()) return this.matchesWeaponProc(item);
    if (item.isCape()) return this.matchesCapeProc(item);
    if (item.isHelm()) return this.matchesHelmProc(item);

    return false;
  }

  private matchesBasicEnhancement(item: InventoryItem): boolean {
    const targetEnhancement = findEnhancementByName(this.enhancementName);
    return item.enhancementPatternId === targetEnhancement?.ID;
  }

  private matchesWeaponProc(item: InventoryItem): boolean {
    if (item.data?.ProcID === undefined) return false;

    const weaponProcName = getWeaponProcName(item.data.ProcID);
    return areNamesEqual(
      weaponProcName,
      this.enhancementName,
      WEAPON_PROC_VARIANTS,
    );
  }

  private matchesCapeProc(item: InventoryItem): boolean {
    const capeProcName = getCapeProcName(item.enhancementPatternId);
    return areNamesEqual(
      capeProcName,
      this.enhancementName,
      CAPE_PROC_VARIANTS,
    );
  }

  private matchesHelmProc(item: InventoryItem): boolean {
    const helmProcName = getHelmProcName(item.enhancementPatternId);
    return (
      helmProcName.toLowerCase().trim() ===
      this.enhancementName.toLowerCase().trim()
    );
  }

  public override toString(): string {
    return `Equip item by enhancement: ${this.enhancementName}${
      this.itemType ? ` [${this.itemType}]` : ""
    }`;
  }
}
