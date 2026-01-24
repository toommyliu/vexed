import type { Item } from "@vexed/game";
import {
  getWeaponProcName,
  isBasicEnhancement,
  findEnhancementByName,
  areNamesEqual,
  getCapeProcName,
  getHelmProcName,
  AWE_PROC_VARIANTS,
  FORGE_WEAPON_PROC_VARIANTS,
  WEAPON_PROC_VARIANTS,
  CAPE_PROC_VARIANTS,
  HELM_PROC_VARIANTS,
} from "../../../lib/util/enhancements";
import { Command } from "../../command";

type ItemType = "cape" | "helm" | "weapon";

export class CommandEquipByEnhancement extends Command {
  /**
   * The enhancement name (Lucky, Fighter, etc.) OR "Forge" for Forge procs.
   */
  public enhancementName!: string;

  /**
   * Depending on context:
   * - Item type filter: "weapon", "helm", "cape"
   * - Awe proc: "Spiral Carve", "Awe Blast", etc. (when enhancementName is basic type)
   * - Forge proc: "Arcanas", "Penitence", "Anima", etc. (when enhancementName is "Forge")
   */
  public procOrItemType?: string;

  public override async executeImpl() {
    const targetItem = this.findMatchingItem();

    this.logger.debug(
      `Looking for ${this.enhancementName}${this.procOrItemType ? ` [${this.procOrItemType}]` : ""}.`,
    );

    if (targetItem && !targetItem.isEquipped()) {
      this.logger.debug(`Equipping item: ${targetItem.name}`);
      await this.bot.inventory.equip(targetItem.name);
    } else if (!targetItem) {
      this.logger.debug("No matching item found.");
    }
  }

  private findMatchingItem(): Item | undefined {
    const isForge = this.enhancementName.toLowerCase().trim() === "forge";
    const isBasic = isBasicEnhancement(this.enhancementName);
    const secondArg = (this.procOrItemType ?? "").toLowerCase().trim();
    const isItemTypeFilter = ["weapon", "helm", "cape"].includes(secondArg);
    const isAweProc = this.matchesProcInVariants(secondArg, AWE_PROC_VARIANTS);

    return this.bot.inventory.items.find((item: Item) => {
      if (!item.isWeapon() && !item.isCape() && !item.isHelm()) return false;

      // 1. forge + proc name
      if (isForge) {
        return this.matchesForgeProcByType(item);
      }

      // 2. basic + awe proc (weapon)
      if (isBasic && isAweProc && this.procOrItemType) {
        if (!item.isWeapon()) return false;

        return (
          this.matchesBasicEnhancement(item) &&
          this.matchesWeaponProc(item, this.procOrItemType)
        );
      }

      // 3. basic + item type filter
      if (isBasic && isItemTypeFilter) {
        const itemTypeLower = secondArg as ItemType;
        if (itemTypeLower === "weapon" && !item.isWeapon()) return false;
        if (itemTypeLower === "cape" && !item.isCape()) return false;
        if (itemTypeLower === "helm" && !item.isHelm()) return false;

        return this.matchesBasicEnhancement(item);
      }

      // 4. basic + no second arg (a.k.a. first match)
      if (isBasic && !secondArg) {
        return this.matchesBasicEnhancement(item);
      }

      return false;
    });
  }

  private matchesForgeProcByType(item: Item): boolean {
    const procName = this.procOrItemType ?? "";
    if (!procName) return false;

    if (this.matchesProcInVariants(procName, FORGE_WEAPON_PROC_VARIANTS)) {
      return item.isWeapon() && this.matchesWeaponProc(item, procName);
    }

    if (this.matchesProcInVariants(procName, CAPE_PROC_VARIANTS)) {
      return item.isCape() && this.matchesCapeProc(item, procName);
    }

    if (this.matchesProcInVariants(procName, HELM_PROC_VARIANTS)) {
      return item.isHelm() && this.matchesHelmProc(item, procName);
    }

    // Fallback: try matching against all item types
    if (item.isWeapon()) return this.matchesWeaponProc(item, procName);
    if (item.isCape()) return this.matchesCapeProc(item, procName);
    if (item.isHelm()) return this.matchesHelmProc(item, procName);

    return false;
  }

  private matchesProcInVariants(
    input: string,
    variants: Record<string, string[]>,
  ): boolean {
    const normalized = input.toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(variants)) {
      if (canonical === normalized || aliases.includes(normalized)) {
        return true;
      }
    }

    return false;
  }

  private matchesBasicEnhancement(item: Item): boolean {
    const targetEnhancement = findEnhancementByName(this.enhancementName);
    return item.enhancementPatternId === targetEnhancement?.ID;
  }

  private matchesWeaponProc(item: Item, procName: string): boolean {
    if (item.data?.ProcID === undefined) return false;

    const weaponProcName = getWeaponProcName(item.data.ProcID);
    return areNamesEqual(weaponProcName, procName, WEAPON_PROC_VARIANTS);
  }

  private matchesCapeProc(item: Item, procName: string): boolean {
    const capeProcName = getCapeProcName(item.enhancementPatternId);
    return areNamesEqual(capeProcName, procName, CAPE_PROC_VARIANTS);
  }

  private matchesHelmProc(item: Item, procName: string): boolean {
    const helmProcName = getHelmProcName(item.enhancementPatternId);
    const normalized = procName.toLowerCase().trim();
    const helmNormalized = helmProcName.toLowerCase().trim();

    if (helmNormalized === normalized) return true;

    const aliases = HELM_PROC_VARIANTS[helmNormalized];
    return aliases?.includes(normalized) ?? false;
  }

  public override toString(): string {
    return `Equip item by enhancement: ${this.enhancementName}${
      this.procOrItemType ? ` [${this.procOrItemType}]` : ""
    }`;
  }
}
