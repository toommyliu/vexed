export type EnhancementP = {
  readonly DIS?: boolean;
  readonly ID: number;
  readonly sDesc: string;
  readonly sName: string;
};

type NamedId<TId extends number = number> = {
  readonly id: TId;
  readonly name: string;
  readonly aliases?: readonly string[];
};

type VariantMap = Readonly<Record<string, readonly string[]>>;

const normalizeName = (name: string): string => name.toLowerCase().trim();

const indexById = <T extends { readonly ID: number }>(
  entries: readonly T[],
): ReadonlyMap<number, T> => new Map(entries.map((entry) => [entry.ID, entry]));

const indexByName = <T extends NamedId>(
  entries: readonly T[],
): ReadonlyMap<string, T> => {
  const index = new Map<string, T>();

  for (const entry of entries) {
    index.set(normalizeName(entry.name), entry);

    for (const alias of entry.aliases ?? []) {
      index.set(normalizeName(alias), entry);
    }
  }

  return index;
};

const variantsFromEntries = (entries: readonly NamedId[]): VariantMap =>
  Object.fromEntries(
    entries.map((entry) => [
      normalizeName(entry.name),
      [...(entry.aliases ?? [])],
    ]),
  );

const resolveNamedId = <TId extends number>(
  name: string,
  index: ReadonlyMap<string, NamedId<TId>>,
): TId | null => index.get(normalizeName(name))?.id ?? null;

export const ALL_ENHANCEMENTS = [
  { ID: 1, sName: "Adventurer", sDesc: "none" },
  { ID: 2, sName: "Fighter", sDesc: "M1" },
  { ID: 3, sName: "Thief", sDesc: "M2" },
  { ID: 4, sName: "Armsman", sDesc: "M4" },
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
] as const satisfies readonly EnhancementP[];

export const EnhancementType = {
  Fighter: 2,
  Thief: 3,
  Hybrid: 5,
  Wizard: 6,
  Healer: 7,
  Spellbreaker: 8,
  Lucky: 9,
} as const;

export type EnhancementType =
  (typeof EnhancementType)[keyof typeof EnhancementType];

export const WeaponSpecial = {
  SpiralCarve: 2,
  AweBlast: 3,
  HealthVamp: 4,
  ManaVamp: 5,
  PowerwordDIE: 6,
  Lacerate: 7,
  Smite: 8,
  Valiance: 9,
  ArcanasConcerto: 10,
  Acheron: 11,
  Elysium: 12,
  Praxis: 13,
  Dauntless: 14,
  Ravenous: 15,
} as const;

export type WeaponSpecial = (typeof WeaponSpecial)[keyof typeof WeaponSpecial];

export const CapeSpecial = {
  Forge: 10,
  Absolution: 11,
  Avarice: 12,
  Vainglory: 24,
  Penitence: 29,
  Lament: 30,
} as const;

export type CapeSpecial = (typeof CapeSpecial)[keyof typeof CapeSpecial];

export const HelmSpecial = {
  Forge: 10,
  Vim: 25,
  Examen: 26,
  Pneuma: 27,
  Anima: 28,
  Hearty: 32,
} as const;

export type HelmSpecial = (typeof HelmSpecial)[keyof typeof HelmSpecial];

export const FORGE_WEAPON_SHOP = 2_142;
export const FORGE_CAPE_SHOP = 2_143;
export const FORGE_HELM_SHOP = 2_164;
export const FORGE_ENHANCEMENT_PATTERN = 10;

const BASIC_ENHANCEMENT_TYPES = [
  { id: EnhancementType.Fighter, name: "Fighter" },
  { id: EnhancementType.Thief, name: "Thief" },
  { id: EnhancementType.Hybrid, name: "Hybrid" },
  { id: EnhancementType.Wizard, name: "Wizard" },
  { id: EnhancementType.Healer, name: "Healer" },
  { id: EnhancementType.Spellbreaker, name: "Spellbreaker" },
  { id: EnhancementType.Lucky, name: "Lucky" },
] as const satisfies readonly NamedId<EnhancementType>[];

const WEAPON_SPECIALS = [
  {
    id: WeaponSpecial.SpiralCarve,
    name: "Spiral Carve",
    aliases: ["scarve", "spiral"],
  },
  {
    id: WeaponSpecial.AweBlast,
    name: "Awe Blast",
    aliases: ["ablast", "aweblast", "blast"],
  },
  {
    id: WeaponSpecial.HealthVamp,
    name: "Health Vamp",
    aliases: ["healthvamp", "hvamp", "hp vamp"],
  },
  {
    id: WeaponSpecial.ManaVamp,
    name: "Mana Vamp",
    aliases: ["manavamp", "mvamp", "mp vamp"],
  },
  {
    id: WeaponSpecial.PowerwordDIE,
    name: "Powerword DIE",
    aliases: ["powerword", "pwd", "pw die"],
  },
  { id: WeaponSpecial.Lacerate, name: "Lacerate", aliases: ["lac"] },
  { id: WeaponSpecial.Smite, name: "Smite" },
  { id: WeaponSpecial.Valiance, name: "Valiance", aliases: ["val"] },
  {
    id: WeaponSpecial.ArcanasConcerto,
    name: "Arcana's Concerto",
    aliases: ["arcanas", "arcana concerto"],
  },
  { id: WeaponSpecial.Acheron, name: "Acheron", aliases: ["ach"] },
  { id: WeaponSpecial.Elysium, name: "Elysium", aliases: ["ely"] },
  { id: WeaponSpecial.Praxis, name: "Praxis", aliases: ["prax"] },
  { id: WeaponSpecial.Dauntless, name: "Dauntless", aliases: ["dtl"] },
  { id: WeaponSpecial.Ravenous, name: "Ravenous", aliases: ["rav"] },
] as const satisfies readonly NamedId<WeaponSpecial>[];

const CAPE_SPECIALS = [
  { id: CapeSpecial.Forge, name: "Forge" },
  { id: CapeSpecial.Absolution, name: "Absolution", aliases: ["abso"] },
  { id: CapeSpecial.Avarice, name: "Avarice", aliases: ["ava"] },
  { id: CapeSpecial.Vainglory, name: "Vainglory" },
  { id: CapeSpecial.Penitence, name: "Penitence", aliases: ["peni"] },
  { id: CapeSpecial.Lament, name: "Lament", aliases: ["lam"] },
] as const satisfies readonly NamedId<CapeSpecial>[];

const HELM_SPECIALS = [
  { id: HelmSpecial.Forge, name: "Forge" },
  { id: HelmSpecial.Vim, name: "Vim" },
  { id: HelmSpecial.Examen, name: "Examen" },
  { id: HelmSpecial.Pneuma, name: "Pneuma" },
  { id: HelmSpecial.Anima, name: "Anima" },
  { id: HelmSpecial.Hearty, name: "Hearty" },
] as const satisfies readonly NamedId<HelmSpecial>[];

const ENHANCEMENT_BY_ID = indexById(ALL_ENHANCEMENTS);
const BASIC_ENHANCEMENT_NAMES = new Set(
  ALL_ENHANCEMENTS.filter(
    (enhancement) =>
      !("DIS" in enhancement) && enhancement.ID <= FORGE_ENHANCEMENT_PATTERN,
  ).map((enhancement) => normalizeName(enhancement.sName)),
);
const ENHANCEMENT_TYPE_BY_NAME = indexByName(BASIC_ENHANCEMENT_TYPES);
const WEAPON_SPECIAL_BY_NAME = indexByName(WEAPON_SPECIALS);
const CAPE_SPECIAL_BY_NAME = indexByName(CAPE_SPECIALS);
const HELM_SPECIAL_BY_NAME = indexByName(HELM_SPECIALS);
const WEAPON_SPECIAL_BY_ID = new Map(
  WEAPON_SPECIALS.map((entry) => [entry.id, entry]),
) as ReadonlyMap<number, NamedId<WeaponSpecial>>;

const BASIC_SHOPS = {
  low: {
    [EnhancementType.Fighter]: 141,
    [EnhancementType.Thief]: 142,
    [EnhancementType.Hybrid]: 143,
    [EnhancementType.Wizard]: 144,
    [EnhancementType.Healer]: 145,
    [EnhancementType.Spellbreaker]: 146,
    [EnhancementType.Lucky]: 147,
  },
  high: {
    [EnhancementType.Fighter]: 768,
    [EnhancementType.Thief]: 767,
    [EnhancementType.Hybrid]: 766,
    [EnhancementType.Wizard]: 765,
    [EnhancementType.Healer]: 762,
    [EnhancementType.Spellbreaker]: 764,
    [EnhancementType.Lucky]: 763,
  },
} as const satisfies Record<"low" | "high", Record<EnhancementType, number>>;

const AWE_WEAPON_SHOPS: Partial<Record<EnhancementType, number>> = {
  [EnhancementType.Hybrid]: 633,
  [EnhancementType.Fighter]: 635,
  [EnhancementType.Wizard]: 636,
  [EnhancementType.Thief]: 637,
  [EnhancementType.Healer]: 638,
  [EnhancementType.Lucky]: 639,
} as const satisfies Partial<Record<EnhancementType, number>>;

export const AWE_PROC_VARIANTS = variantsFromEntries(
  WEAPON_SPECIALS.filter((entry) => isAweProc(entry.id)),
);

export const FORGE_WEAPON_PROC_VARIANTS = variantsFromEntries(
  WEAPON_SPECIALS.filter((entry) => isForgeWeaponProc(entry.id)),
);

export const WEAPON_PROC_VARIANTS = {
  ...AWE_PROC_VARIANTS,
  ...FORGE_WEAPON_PROC_VARIANTS,
} as const satisfies VariantMap;

export const CAPE_PROC_VARIANTS = variantsFromEntries(CAPE_SPECIALS);
export const HELM_PROC_VARIANTS = variantsFromEntries(HELM_SPECIALS);

export function getBasicEnhancementShopId(
  type: EnhancementType,
  playerLevel: number,
): number {
  return BASIC_SHOPS[playerLevel >= 50 ? "high" : "low"][type];
}

export function getAweWeaponShopId(type: EnhancementType): number | undefined {
  return AWE_WEAPON_SHOPS[type];
}

export function resolveEnhancementType(name: string): EnhancementType | null {
  return resolveNamedId(name, ENHANCEMENT_TYPE_BY_NAME);
}

export function resolveWeaponSpecial(name: string): WeaponSpecial | null {
  return resolveNamedId(name, WEAPON_SPECIAL_BY_NAME);
}

export function resolveCapeSpecial(name: string): CapeSpecial | null {
  return resolveNamedId(name, CAPE_SPECIAL_BY_NAME);
}

export function resolveHelmSpecial(name: string): HelmSpecial | null {
  return resolveNamedId(name, HELM_SPECIAL_BY_NAME);
}

export function getWeaponProcName(procId: number): string {
  return WEAPON_SPECIAL_BY_ID.get(procId)?.name ?? "Unknown";
}

export function getCapeProcName(procId: number): string {
  return getEnhancementName(procId);
}

export function getHelmProcName(procId: number): string {
  return getEnhancementName(procId);
}

export function getEnhancementName(enhPatternId: number): string {
  return ENHANCEMENT_BY_ID.get(enhPatternId)?.sName ?? "";
}

export function isBasicEnhancement(enhancementName: string): boolean {
  return BASIC_ENHANCEMENT_NAMES.has(normalizeName(enhancementName));
}

export function findEnhancementByName(
  enhancementName: string,
): EnhancementP | undefined {
  const normalized = normalizeName(enhancementName);
  return ALL_ENHANCEMENTS.find(
    (enhancement) => normalizeName(enhancement.sName) === normalized,
  );
}

export function areNamesEqual(
  actualName: string,
  inputName: string,
  variants: VariantMap,
): boolean {
  const normalizedActual = normalizeName(actualName);
  const normalizedInput = normalizeName(inputName);

  if (!normalizedActual || !normalizedInput) return false;
  if (normalizedActual === normalizedInput) return true;

  return (
    variants[normalizedActual]?.some(
      (alias) => normalizeName(alias) === normalizedInput,
    ) ?? false
  );
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
