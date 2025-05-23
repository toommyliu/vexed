const ALL_ENHANCEMENTS: EnhancementP[] = [
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
] as const;

// Enhancement constants for forge items
const FORGE_HELM_ENHANCEMENTS = [
  { ID: 10, sName: "Forge", sDesc: "Blacksmith" },
  { ID: 28, sName: "Anima", sDesc: "SmithP2", DIS: true },
  { ID: 26, sName: "Examen", sDesc: "SmithP2", DIS: true },
  { ID: 32, sName: "Hearty", sDesc: "Grimskull Troll Enhancement", DIS: true },
  { ID: 27, sName: "Pneuma", sDesc: "SmithP2", DIS: true },
  { ID: 25, sName: "Vim", sDesc: "SmithP2", DIS: true },
] as const;

const FORGE_CAPE_ENHANCEMENTS = [
  { ID: 10, sName: "Forge", sDesc: "Blacksmith" },
  { ID: 11, sName: "Absolution", sDesc: "Smith", DIS: true },
  { ID: 12, sName: "Avarice", sDesc: "Smith", DIS: true },
  { ID: 30, sName: "Lament", sDesc: "SmithP2", DIS: true },
  { ID: 29, sName: "Penitence", sDesc: "SmithP2", DIS: true },
  { ID: 24, sName: "Vainglory", sDesc: "Smith", DIS: true },
] as const;

/**
 * Get the name of a proc by its ID.
 *
 * @param procId - The ID of the proc.
 * @returns The name of the proc, or "Unknown" if not found.
 */
export function getWeaponProcName(procId: number): string {
  switch (procId) {
    case 2:
      return "Spiral Carve";
    case 3:
      return "Awe Blast";
    case 4:
      return "Health Vamp";
    case 5:
      return "Mana Vamp";
    case 6:
      return "Powerword DIE";
    case 7:
      return "Lacerate";
    case 8:
      return "Smite";
    case 9:
      return "Valiance";
    case 10:
      return "Arcana's Concerto";
    case 11:
      return "Acheron";
    case 12:
      return "Elysium";
    case 13:
      return "Praxis";
    case 14:
      return "Dauntless";
    case 15:
      return "Ravenous";
    default:
      return "Unknown";
  }
}

export function isBasicEnhancement(enhancementName: string): boolean {
  const basicEnhancements = ALL_ENHANCEMENTS.filter(
    (enh) => !enh.DIS && enh.ID <= 10,
  );
  return basicEnhancements.some(
    (enh) => enh.sName.toLowerCase() === enhancementName.toLowerCase(),
  );
}

export function findEnhancementByName(
  enhancementName: string,
): EnhancementP | undefined {
  return ALL_ENHANCEMENTS.find(
    (enh) => enh.sName.toLowerCase() === enhancementName.toLowerCase(),
  );
}

export function areNamesEqual(
  actualName: string,
  inputName: string,
  variants: Record<string, string[]>,
): boolean {
  if (!actualName || !inputName) return false;

  const normalizedActual = actualName.toLowerCase().trim();
  const normalizedInput = inputName.toLowerCase().trim();

  if (normalizedActual === normalizedInput) return true;

  const matchedKey = Object.keys(variants).find(
    (key) => key === normalizedActual,
  );
  return matchedKey
    ? (variants[matchedKey]?.includes(normalizedInput) ?? false)
    : false;
}

/**
 * Get the cape proc name by enhancement pattern ID.
 */
export function getCapeProcName(procId: number): string {
  return FORGE_CAPE_ENHANCEMENTS.find((enh) => enh.ID === procId)?.sName ?? "";
}

/**
 * Get the helm proc name by enhancement pattern ID.
 */
export function getHelmProcName(procId: number): string {
  return FORGE_HELM_ENHANCEMENTS.find((enh) => enh.ID === procId)?.sName ?? "";
}

type EnhancementP = {
  DIS?: boolean;
  ID: number;
  sDesc: string;
  sName: string;
};
