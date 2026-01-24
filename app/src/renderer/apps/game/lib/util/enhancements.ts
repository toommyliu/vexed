import { equalsIgnoreCase } from "@vexed/utils/string";

export type EnhancementP = {
  DIS?: boolean;
  ID: number;
  sDesc: string;
  sName: string;
};

export const ALL_ENHANCEMENTS: EnhancementP[] = [
  { ID: 1, sName: "Adventurer", sDesc: "none" },
  { ID: 2, sName: "Fighter", sDesc: "M1" },
  { ID: 3, sName: "Thief", sDesc: "M2" },
  { ID: 4, sName: "Armsman", sDesc: "M4" }, // don't know
  { ID: 5, sName: "Hybrid", sDesc: "M3" },
  { ID: 6, sName: "Wizard", sDesc: "C1" },
  { ID: 7, sName: "Healer", sDesc: "C2" },
  { ID: 8, sName: "Spellbreaker", sDesc: "C3" },
  { ID: 9, sName: "Lucky", sDesc: "S1" },
  { ID: 23, sName: "Depths", sDesc: "S1" },
  { ID: 10, sName: "Forge", sDesc: "Blacksmith" },
  { ID: 11, sName: "Absolution", sDesc: "Smith", DIS: true },
  { ID: 12, sName: "Avarice", sDesc: "Smith", DIS: true },
  { ID: 24, sName: "Vainglory", sDesc: "Smith", DIS: true },
  { ID: 25, sName: "Vim", sDesc: "SmithP2", DIS: true },
  { ID: 26, sName: "Examen", sDesc: "SmithP2", DIS: true },
  { ID: 27, sName: "Pneuma", sDesc: "SmithP2", DIS: true },
  { ID: 28, sName: "Anima", sDesc: "SmithP2", DIS: true },
  { ID: 29, sName: "Penitence", sDesc: "SmithP2", DIS: true },
  { ID: 30, sName: "Lament", sDesc: "SmithP2", DIS: true },
  { ID: 32, sName: "Hearty", sDesc: "Grimskull Troll Enhancement", DIS: true },
] as const;

export enum EnhancementType {
  Fighter = 2,
  Thief = 3,
  Hybrid = 5,
  Wizard = 6,
  Healer = 7,
  Spellbreaker = 8,
  Lucky = 9,
}

export enum WeaponSpecial {
  /* awe */
  SpiralCarve = 2,
  AweBlast = 3,
  HealthVamp = 4,
  ManaVamp = 5,
  PowerwordDIE = 6,
  /* forge */
  Lacerate = 7,
  Smite = 8,
  Valiance = 9,
  ArcanasConcerto = 10,
  Acheron = 11,
  Elysium = 12,
  Praxis = 13,
  Dauntless = 14,
  Ravenous = 15,
}

export enum CapeSpecial {
  Forge = 10,
  Absolution = 11,
  Avarice = 12,
  Vainglory = 24,
  Penitence = 29,
  Lament = 30,
}

export enum HelmSpecial {
  Forge = 10,
  Vim = 25,
  Examen = 26,
  Pneuma = 27,
  Anima = 28,
  Hearty = 32,
}

export const FORGE_WEAPON_SHOP = 2_142;
export const FORGE_CAPE_SHOP = 2_143;
export const FORGE_HELM_SHOP = 2_164;
export const FORGE_ENHANCEMENT_PATTERN = 10;

// 0-50
const BASIC_SHOPS_LOW: Record<EnhancementType, number> = {
  [EnhancementType.Fighter]: 141,
  [EnhancementType.Thief]: 142,
  [EnhancementType.Hybrid]: 143,
  [EnhancementType.Wizard]: 144,
  [EnhancementType.Healer]: 145,
  [EnhancementType.Spellbreaker]: 146,
  [EnhancementType.Lucky]: 147,
};

// 50+
const BASIC_SHOPS_HIGH: Record<EnhancementType, number> = {
  [EnhancementType.Fighter]: 768,
  [EnhancementType.Thief]: 767,
  [EnhancementType.Hybrid]: 766,
  [EnhancementType.Wizard]: 765,
  [EnhancementType.Healer]: 762,
  [EnhancementType.Spellbreaker]: 764,
  [EnhancementType.Lucky]: 763,
};

const AWE_WEAPON_SHOPS: Partial<Record<EnhancementType, number>> = {
  [EnhancementType.Hybrid]: 633,
  [EnhancementType.Fighter]: 635,
  [EnhancementType.Wizard]: 636,
  [EnhancementType.Thief]: 637,
  [EnhancementType.Healer]: 638,
  [EnhancementType.Lucky]: 639,
};

export function getBasicEnhancementShopId(
  type: EnhancementType,
  playerLevel: number,
): number {
  return playerLevel >= 50 ? BASIC_SHOPS_HIGH[type] : BASIC_SHOPS_LOW[type];
}

export function getAweWeaponShopId(type: EnhancementType): number | undefined {
  return AWE_WEAPON_SHOPS[type];
}

const ENHANCEMENT_TYPE_MAP: Record<string, EnhancementType> = {
  fighter: EnhancementType.Fighter,
  thief: EnhancementType.Thief,
  hybrid: EnhancementType.Hybrid,
  wizard: EnhancementType.Wizard,
  healer: EnhancementType.Healer,
  spellbreaker: EnhancementType.Spellbreaker,
  lucky: EnhancementType.Lucky,
};

const WEAPON_SPECIAL_MAP: Record<string, WeaponSpecial> = {
  "spiral carve": WeaponSpecial.SpiralCarve,
  "awe blast": WeaponSpecial.AweBlast,
  "health vamp": WeaponSpecial.HealthVamp,
  "mana vamp": WeaponSpecial.ManaVamp,
  "powerword die": WeaponSpecial.PowerwordDIE,
  lacerate: WeaponSpecial.Lacerate,
  smite: WeaponSpecial.Smite,
  valiance: WeaponSpecial.Valiance,
  "arcana's concerto": WeaponSpecial.ArcanasConcerto,
  acheron: WeaponSpecial.Acheron,
  elysium: WeaponSpecial.Elysium,
  praxis: WeaponSpecial.Praxis,
  dauntless: WeaponSpecial.Dauntless,
  ravenous: WeaponSpecial.Ravenous,
};

const CAPE_SPECIAL_MAP: Record<string, CapeSpecial> = {
  forge: CapeSpecial.Forge,
  absolution: CapeSpecial.Absolution,
  avarice: CapeSpecial.Avarice,
  vainglory: CapeSpecial.Vainglory,
  penitence: CapeSpecial.Penitence,
  lament: CapeSpecial.Lament,
};

const HELM_SPECIAL_MAP: Record<string, HelmSpecial> = {
  forge: HelmSpecial.Forge,
  vim: HelmSpecial.Vim,
  examen: HelmSpecial.Examen,
  pneuma: HelmSpecial.Pneuma,
  anima: HelmSpecial.Anima,
  hearty: HelmSpecial.Hearty,
};

const WEAPON_SPECIAL_NAMES: Record<WeaponSpecial, string> = {
  [WeaponSpecial.SpiralCarve]: "Spiral Carve",
  [WeaponSpecial.AweBlast]: "Awe Blast",
  [WeaponSpecial.HealthVamp]: "Health Vamp",
  [WeaponSpecial.ManaVamp]: "Mana Vamp",
  [WeaponSpecial.PowerwordDIE]: "Powerword DIE",
  [WeaponSpecial.Lacerate]: "Lacerate",
  [WeaponSpecial.Smite]: "Smite",
  [WeaponSpecial.Valiance]: "Valiance",
  [WeaponSpecial.ArcanasConcerto]: "Arcana's Concerto",
  [WeaponSpecial.Acheron]: "Acheron",
  [WeaponSpecial.Elysium]: "Elysium",
  [WeaponSpecial.Praxis]: "Praxis",
  [WeaponSpecial.Dauntless]: "Dauntless",
  [WeaponSpecial.Ravenous]: "Ravenous",
};

export const AWE_PROC_VARIANTS: Record<string, string[]> = {
  "spiral carve": ["scarve", "spiral"],
  "health vamp": ["healthvamp", "hvamp", "hp vamp"],
  "mana vamp": ["manavamp", "mvamp", "mp vamp"],
  "powerword die": ["powerword", "pwd", "pw die"],
  "awe blast": ["ablast", "aweblast", "blast"],
};

export const FORGE_WEAPON_PROC_VARIANTS: Record<string, string[]> = {
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

export const WEAPON_PROC_VARIANTS: Record<string, string[]> = {
  ...AWE_PROC_VARIANTS,
  ...FORGE_WEAPON_PROC_VARIANTS,
};

export const CAPE_PROC_VARIANTS: Record<string, string[]> = {
  absolution: ["abso"],
  avarice: ["ava"],
  lament: ["lam"],
  penitence: ["peni"],
  vainglory: [],
  forge: [],
};

export const HELM_PROC_VARIANTS: Record<string, string[]> = {
  vim: [],
  examen: [],
  pneuma: [],
  anima: [],
  hearty: [],
  forge: [],
};

/**
 * Generic resolver: tries direct match, then checks variants
 */
function resolveWithVariants<T>(
  name: string,
  map: Record<string, T>,
  variants: Record<string, string[]>,
): T | null {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return null;

  // Direct match
  if (map[normalized] !== undefined) return map[normalized]!;

  // Check variants
  for (const [key, alts] of Object.entries(variants)) {
    if (alts.includes(normalized)) {
      return map[key] ?? null;
    }
  }

  return null;
}

export function resolveEnhancementType(name: string): EnhancementType | null {
  const normalized = name.toLowerCase().trim();
  return ENHANCEMENT_TYPE_MAP[normalized] ?? null;
}

export function resolveWeaponSpecial(name: string): WeaponSpecial | null {
  return resolveWithVariants(name, WEAPON_SPECIAL_MAP, WEAPON_PROC_VARIANTS);
}

export function resolveCapeSpecial(name: string): CapeSpecial | null {
  return resolveWithVariants(name, CAPE_SPECIAL_MAP, CAPE_PROC_VARIANTS);
}

export function resolveHelmSpecial(name: string): HelmSpecial | null {
  return resolveWithVariants(name, HELM_SPECIAL_MAP, HELM_PROC_VARIANTS);
}

export function getWeaponProcName(procId: number): string {
  return WEAPON_SPECIAL_NAMES[procId as WeaponSpecial] ?? "Unknown";
}

export function getCapeProcName(procId: number): string {
  return ALL_ENHANCEMENTS.find((enh) => enh.ID === procId)?.sName ?? "";
}

export function getHelmProcName(procId: number): string {
  return ALL_ENHANCEMENTS.find((enh) => enh.ID === procId)?.sName ?? "";
}

export function getEnhancementName(enhPatternId: number): string {
  return ALL_ENHANCEMENTS.find((enh) => enh.ID === enhPatternId)?.sName ?? "";
}

export function isBasicEnhancement(enhancementName: string): boolean {
  const basicEnhancements = ALL_ENHANCEMENTS.filter(
    (enh) => !enh.DIS && enh.ID <= 10,
  );
  return basicEnhancements.some((enh) =>
    equalsIgnoreCase(enh.sName, enhancementName),
  );
}

export function findEnhancementByName(
  enhancementName: string,
): EnhancementP | undefined {
  return ALL_ENHANCEMENTS.find((enh) =>
    equalsIgnoreCase(enh.sName, enhancementName),
  );
}

export function areNamesEqual(
  actualName: string,
  inputName: string,
  variants: Record<string, string[]>,
): boolean {
  if (!actualName || !inputName) return false;

  if (equalsIgnoreCase(actualName, inputName)) return true;

  const normalizedActual = actualName.toLowerCase().trim();
  const normalizedInput = inputName.toLowerCase().trim();
  const matchedKey = Object.keys(variants).find(
    (key) => key === normalizedActual,
  );

  return matchedKey
    ? (variants[matchedKey]?.includes(normalizedInput) ?? false)
    : false;
}

export function isWeaponProcName(name: string): boolean {
  return resolveWeaponSpecial(name) !== null;
}

export function isCapeProcName(name: string): boolean {
  return resolveCapeSpecial(name) !== null;
}

export function isHelmProcName(name: string): boolean {
  return resolveHelmSpecial(name) !== null;
}

export function isForgeWeaponProc(proc: WeaponSpecial): boolean {
  return proc >= WeaponSpecial.Lacerate;
}

export function isAweProc(proc: WeaponSpecial): boolean {
  return (
    proc >= WeaponSpecial.SpiralCarve && proc <= WeaponSpecial.PowerwordDIE
  );
}
