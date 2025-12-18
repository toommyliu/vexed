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

const AWE_PROC_VARIANTS: Record<string, string[]> = {
  "spiral carve": ["scarve", "spiral"],
  "health vamp": ["healthvamp", "hvamp", "hp vamp"],
  "mana vamp": ["manavamp", "mvamp", "mp vamp"],
  "powerword die": ["powerword", "pwd", "pw die"],
  "awe blast": ["ablast", "aweblast", "blast"],
};

const FORGE_WEAPON_PROC_VARIANTS: Record<string, string[]> = {
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

const HELM_PROC_VARIANTS: Record<string, string[]> = {
  anima: [],
  vim: [],
  examen: [],
};

// Combined weapon procs for lookup
const ALL_WEAPON_PROC_VARIANTS: Record<string, string[]> = {
  ...AWE_PROC_VARIANTS,
  ...FORGE_WEAPON_PROC_VARIANTS,
};

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

  private findMatchingItem(): InventoryItem | undefined {
    const isForge = this.enhancementName.toLowerCase().trim() === "forge";
    const isBasic = isBasicEnhancement(this.enhancementName);
    const secondArg = (this.procOrItemType ?? "").toLowerCase().trim();
    const isItemTypeFilter = ["weapon", "helm", "cape"].includes(secondArg);
    const isAweProc = this.matchesProcInVariants(secondArg, AWE_PROC_VARIANTS);

    return this.bot.inventory.items.find((item: InventoryItem) => {
      if (!item.isWeapon() && !item.isCape() && !item.isHelm()) return false;

      // Mode 1: Forge + proc name
      if (isForge) {
        return this.matchesForgeProcByType(item);
      }

      // Mode 2: Basic enhancement + Awe proc (weapons only)
      if (isBasic && isAweProc && this.procOrItemType) {
        if (!item.isWeapon()) return false;

        return (
          this.matchesBasicEnhancement(item) &&
          this.matchesWeaponProc(item, this.procOrItemType)
        );
      }

      // Mode 3: Basic enhancement + item type filter
      if (isBasic && isItemTypeFilter) {
        const itemTypeLower = secondArg as ItemType;
        if (itemTypeLower === "weapon" && !item.isWeapon()) return false;
        if (itemTypeLower === "cape" && !item.isCape()) return false;
        if (itemTypeLower === "helm" && !item.isHelm()) return false;

        return this.matchesBasicEnhancement(item);
      }

      // Mode 4: Colloquial - just enhancement/proc name, auto-detect
      return this.matchesEnhancement(item);
    });
  }

  private matchesForgeProcByType(item: InventoryItem): boolean {
    const procName = this.procOrItemType ?? "";
    if (!procName) return false;

    // Auto-detect item type based on proc name
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

  private matchesProcInVariants(input: string, variants: Record<string, string[]>): boolean {
    const normalized = input.toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(variants)) {
      if (canonical === normalized || aliases.includes(normalized)) {
        return true;
      }
    }

    return false;
  }

  private matchesEnhancement(item: InventoryItem): boolean {
    const isBasic = isBasicEnhancement(this.enhancementName);

    if (isBasic) return this.matchesBasicEnhancement(item);
    if (item.isWeapon()) return this.matchesWeaponProc(item, this.enhancementName);
    if (item.isCape()) return this.matchesCapeProc(item, this.enhancementName);
    if (item.isHelm()) return this.matchesHelmProc(item, this.enhancementName);

    return false;
  }

  private matchesBasicEnhancement(item: InventoryItem): boolean {
    const targetEnhancement = findEnhancementByName(this.enhancementName);

    return item.enhancementPatternId === targetEnhancement?.ID;
  }

  private matchesWeaponProc(item: InventoryItem, procName: string): boolean {
    if (item.data?.ProcID === undefined) return false;

    const weaponProcName = getWeaponProcName(item.data.ProcID);

    return areNamesEqual(weaponProcName, procName, ALL_WEAPON_PROC_VARIANTS);
  }

  private matchesCapeProc(item: InventoryItem, procName: string): boolean {
    const capeProcName = getCapeProcName(item.enhancementPatternId);

    return areNamesEqual(capeProcName, procName, CAPE_PROC_VARIANTS);
  }

  private matchesHelmProc(item: InventoryItem, procName: string): boolean {
    const helmProcName = getHelmProcName(item.enhancementPatternId);
    const normalized = procName.toLowerCase().trim();
    const helmNormalized = helmProcName.toLowerCase().trim();

    // Check exact match or variants
    if (helmNormalized === normalized) return true;

    const aliases = HELM_PROC_VARIANTS[helmNormalized];

    return aliases?.includes(normalized) ?? false;
  }

  public override toString(): string {
    return `Equip item by enhancement: ${this.enhancementName}${this.procOrItemType ? ` [${this.procOrItemType}]` : ""
      }`;
  }
}

