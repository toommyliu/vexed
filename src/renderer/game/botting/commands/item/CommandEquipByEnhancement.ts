import { getWeaponProcName } from "../../../lib/util/enhancements";
import { Command } from "../../command";

const enhancements = [
  {
    ID: 1,
    sName: "Adventurer",
    sDesc: "none",
  },
  {
    ID: 2,
    sName: "Fighter",
    sDesc: "M1",
  },
  {
    ID: 3,
    sName: "Thief",
    sDesc: "M2",
  },
  {
    ID: 4,
    sName: "Armsman",
    sDesc: "M4",
  },
  {
    ID: 5,
    sName: "Hybrid",
    sDesc: "M3",
  },
  {
    ID: 6,
    sName: "Wizard",
    sDesc: "C1",
  },
  {
    ID: 7,
    sName: "Healer",
    sDesc: "C2",
  },
  {
    ID: 8,
    sName: "Spellbreaker",
    sDesc: "C3",
  },
  {
    ID: 9,
    sName: "Lucky",
    sDesc: "S1",
  },
  {
    ID: 23,
    sName: "Depths",
    sDesc: "S1",
  },
  {
    ID: 10,
    sName: "Forge",
    sDesc: "Blacksmith",
  },
  {
    ID: 11,
    sName: "Absolution",
    sDesc: "Smith",
    DIS: true,
  },
  {
    ID: 12,
    sName: "Avarice",
    sDesc: "Smith",
    DIS: true,
  },
  {
    ID: 24,
    sName: "Vainglory",
    sDesc: "Smith",
    DIS: true,
  },
  {
    ID: 25,
    sName: "Vim",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 26,
    sName: "Examen",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 27,
    sName: "Pneuma",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 28,
    sName: "Anima",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 29,
    sName: "Penitence",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 30,
    sName: "Lament",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 32,
    sName: "Hearty",
    sDesc: "Grimskull Troll Enhancement",
    DIS: true,
  },
];

const FORGE_HELM_ENHANCEMENTS = [
  {
    ID: 10,
    sName: "Forge",
    sDesc: "Blacksmith",
  },
  {
    ID: 28,
    sName: "Anima",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 26,
    sName: "Examen",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 10,
    sName: "Forge",
    sDesc: "Blacksmith",
  },
  {
    ID: 32,
    sName: "Hearty",
    sDesc: "Grimskull Troll Enhancement",
    DIS: true,
  },
  {
    ID: 27,
    sName: "Pneuma",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 25,
    sName: "Vim",
    sDesc: "SmithP2",
    DIS: true,
  },
] as const;

const FORGE_CAPE_ENHANCEMENTS = [
  {
    ID: 10,
    sName: "Forge",
    sDesc: "Blacksmith",
  },
  {
    ID: 11,
    sName: "Absolution",
    sDesc: "Smith",
    DIS: true,
  },
  {
    ID: 12,
    sName: "Avarice",
    sDesc: "Smith",
    DIS: true,
  },
  {
    ID: 10,
    sName: "Forge",
    sDesc: "Blacksmith",
  },
  {
    ID: 30,
    sName: "Lament",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 29,
    sName: "Penitence",
    sDesc: "SmithP2",
    DIS: true,
  },
  {
    ID: 24,
    sName: "Vainglory",
    sDesc: "Smith",
    DIS: true,
  },
] as const;

// http://aqwwiki.wikidot.com/abbreviations-acronyms#toc2

/**
 * Compares a weapon proc name with an input name, supporting colloquial variants.
 *
 * @param procName - The actual proc name from the game
 * @param inputName - The name provided by the user
 * @returns True if the names match (accounting for variants)
 */
function areWeaponProcsEqual(procName: string, inputName: string): boolean {
  if (!procName || !inputName) return false;

  const normalizedProc = procName.toLowerCase().trim();
  const normalizedInput = inputName.toLowerCase().trim();

  // Direct match
  if (normalizedProc === normalizedInput) return true;

  const variants: Record<string, string[]> = {
    "spiral carve": ["scarve", "spiral"],
    "health vamp": ["healthvamp", "hvamp", "hp vamp"],
    "mana vamp": ["manavamp", "mvamp", "mp vamp"],
    "powerword die": ["powerword", "pwd", "pw die"],
    "awe blast": ["ablast", "aweblast", "blast"],
    lacerate: ["lac"],
    smite: [],
    valiance: ["val"],
    "arcana's concerto": [/* "arcana",*/ "arcanas", "arcana concerto"],
    acheron: ["ach"],
    elysium: ["ely"],
    praxis: ["prax"],
    dauntless: ["dtl"],
    ravenous: ["rav"],
    absolution: ["abso"],
    avarice: ["ava"],
    lament: ["lam"],
    penitence: ["peni"],
  };

  const matchedProcKey = Object.keys(variants).find(
    (key) => key === normalizedProc,
  );

  // Check if the input matches the proc name or any of its variants
  if (matchedProcKey) {
    return (
      (normalizedInput === matchedProcKey ||
        variants[matchedProcKey]?.includes(normalizedInput)) ??
      false
    );
  }

  return false;
}

function getCapeProcName(procId: number): string {
  const forgeCapeEnhancement = FORGE_CAPE_ENHANCEMENTS.find(
    (enh) => enh.ID === procId,
  );
  return forgeCapeEnhancement?.sName ?? "";
}

function getHelmProcName(procId: number): string {
  const forgeHelmEnhancement = FORGE_HELM_ENHANCEMENTS.find(
    (enh) => enh.ID === procId,
  );
  return forgeHelmEnhancement?.sName ?? "";
}

function areCapeProcsEqual(procName: string, inputName: string): boolean {
  if (!procName || !inputName) return false;

  const normalizedProc = procName.toLowerCase().trim();
  const normalizedInput = inputName.toLowerCase().trim();

  // Direct match
  if (normalizedProc === normalizedInput) return true;

  const variants: Record<string, string[]> = {
    absolution: ["abso"],
    avarice: ["ava"],
    lament: ["lam"],
    penitence: ["peni"],
    vainglory: [],
  };

  const matchedProcKey = Object.keys(variants).find(
    (key) => key === normalizedProc,
  );

  // Check if the input matches the proc name or any of its variants
  if (matchedProcKey) {
    return (
      (normalizedInput === matchedProcKey ||
        variants[matchedProcKey]?.includes(normalizedInput)) ??
      false
    );
  }

  return false;
}

// For Helms
function areHelmProcsEqual(procName: string, inputName: string): boolean {
  if (!procName || !inputName) return false;

  return procName?.toLowerCase()?.trim() === inputName?.toLowerCase()?.trim();
}

export class CommandEquipByEnhancement extends Command {
  public enhancementName!: string;

  public itemType?: string;

  public override async execute() {
    console.log(`Enh name: ${this.enhancementName}`);
    if (this.itemType) {
      console.log(`Item type: ${this.itemType}`);
    }

    // Whether the enhancement name is "simple" to process
    const isSimpleEnh = enhancements
      .filter((enh) => enh.ID >= 1 && enh.ID <= 10)
      .some(
        (enh) => enh.sName.toLowerCase() === this.enhancementName.toLowerCase(),
      );

    console.log(`Is simple enhancement: ${isSimpleEnh}`);

    const item = this.bot.inventory.items.find((invItem) => {
      // Only consider weapons, capes, or helms
      const isValidType =
        invItem.isWeapon() || invItem.isCape() || invItem.isHelm();
      if (!isValidType) {
        return false;
      }

      // If itemType is provided, ensure it matches
      if (this.itemType) {
        const itemTypeLower = this.itemType.toLowerCase();
        const typeMatches =
          (itemTypeLower === "weapon" && invItem.isWeapon()) ||
          (itemTypeLower === "cape" && invItem.isCape()) ||
          (itemTypeLower === "helm" && invItem.isHelm());

        if (!typeMatches) {
          return false;
        }
      }

      // Start looking for the enhancement
      if (isSimpleEnh) {
        // Find the enhancement ID that matches the name
        const targetEnhancement = enhancements.find(
          (enh) =>
            enh.sName.toLowerCase() === this.enhancementName.toLowerCase(),
        );

        return invItem.enhancementPatternId === targetEnhancement?.ID;
      } else if (
        this.itemType?.toLowerCase() === "weapon" &&
        invItem.isWeapon() &&
        invItem?.data?.ProcID !== undefined &&
        areWeaponProcsEqual(
          getWeaponProcName(invItem.data!.ProcID ?? -1),
          this.enhancementName,
        )
      ) {
        return true;
      } else if (
        // (this.itemType?.toLowerCase() === "cape" || true) &&
        invItem.isCape() &&
        areCapeProcsEqual(
          getCapeProcName(invItem.enhancementPatternId),
          this.enhancementName,
        )
      ) {
        return true;
      } else if (
        // (this.itemType?.toLowerCase() === "helm" || true) &&
        invItem.isHelm() &&
        areHelmProcsEqual(
          getHelmProcName(invItem.enhancementPatternId),
          this.enhancementName,
        )
      ) {
        return true;
      }

      return false;
    });

    // console.log(`Final Item: ${item ? item.name : "No item found"}`);

    if (item && !item.isEquipped()) {
      // console.log(`Item ${item?.name} is not equipped.`);
      await this.bot.inventory.equip(item!.name);
      // console.log(`Equipped item: ${item?.name}`);
    }
  }

  public override toString() {
    return `Equip item by enhancement: ${this.enhancementName}`;
  }
}
