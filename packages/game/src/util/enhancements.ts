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

export type VariantMap = Readonly<Record<string, readonly string[]>>;

export type EnhancementSlot = "weapon" | "cape" | "helm" | "armor";

export type EquipItemTypeFilter = "weapon" | "cape" | "helm" | "armor";

export interface EnhancementItemLike {
  readonly category: string;
  readonly data: {
    readonly ProcID?: unknown;
  };
  readonly enhancementLevel: number;
  readonly enhancementPatternId: number;
  readonly id: number;
  readonly level: number;
  isArmor(): boolean;
  isCape(): boolean;
  isClass(): boolean;
  isHelm(): boolean;
  isWeapon(): boolean;
}

export interface EnhancementShopItemLike {
  readonly data: {
    readonly EnhID?: unknown;
    readonly EnhPatternID?: unknown;
    readonly ItemProcID?: unknown;
    readonly PatternID?: unknown;
    readonly ProcID?: unknown;
  };
  readonly itemGroup: string;
}

export interface EnhancementComparableLike {
  readonly enhancementLevel: number;
  readonly id: number;
  readonly level: number;
}

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

// Basic enhancements

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
  // Awe
  SpiralCarve: 2,
  AweBlast: 3,
  HealthVamp: 4,
  ManaVamp: 5,
  PowerwordDIE: 6,
  // Forge
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

export type AweWeaponSpecial =
  | typeof WeaponSpecial.SpiralCarve
  | typeof WeaponSpecial.AweBlast
  | typeof WeaponSpecial.HealthVamp
  | typeof WeaponSpecial.ManaVamp
  | typeof WeaponSpecial.PowerwordDIE;

export type ForgeWeaponSpecial = Exclude<WeaponSpecial, AweWeaponSpecial>;

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

export type BasicEnhancementIntent = {
  readonly enhancementType: EnhancementType;
  readonly kind: "basic";
  readonly patternId: EnhancementType;
  readonly procId: 0;
  readonly slot: EnhancementSlot;
};

export type AweWeaponEnhancementIntent = {
  readonly enhancementType: EnhancementType;
  readonly kind: "awe-weapon";
  readonly patternId: EnhancementType;
  readonly proc: AweWeaponSpecial;
  readonly procId: AweWeaponSpecial;
  readonly slot: "weapon";
};

export type ForgeWeaponEnhancementIntent = {
  readonly kind: "forge-weapon";
  readonly patternId: typeof FORGE_ENHANCEMENT_PATTERN;
  readonly proc?: ForgeWeaponSpecial;
  readonly procId: ForgeWeaponSpecial | 0;
  readonly slot: "weapon";
};

export type ForgeCapeEnhancementIntent = {
  readonly kind: "forge-cape";
  readonly patternId: CapeSpecial;
  readonly proc?: CapeSpecial;
  readonly procId: 0;
  readonly slot: "cape";
};

export type ForgeHelmEnhancementIntent = {
  readonly kind: "forge-helm";
  readonly patternId: HelmSpecial;
  readonly proc?: HelmSpecial;
  readonly procId: 0;
  readonly slot: "helm";
};

export type EnhancementIntent =
  | BasicEnhancementIntent
  | AweWeaponEnhancementIntent
  | ForgeWeaponEnhancementIntent
  | ForgeCapeEnhancementIntent
  | ForgeHelmEnhancementIntent;

export type EnhancementStrategy = {
  readonly intent: EnhancementIntent;
  readonly map?: "forge" | "museum";
  readonly patternId: number;
  readonly procId: number;
  readonly shopId: number;
  readonly slot: EnhancementSlot;
};

export type EnhancementResolution =
  | {
      readonly ok: true;
      readonly strategy: EnhancementStrategy;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

export type EquipEnhancementFilter =
  | {
      readonly enhancementType: EnhancementType;
      readonly kind: "basic";
      readonly procId: 0;
      readonly slot?: EquipItemTypeFilter;
    }
  | {
      readonly enhancementType: EnhancementType;
      readonly kind: "basic-awe";
      readonly proc: AweWeaponSpecial;
      readonly procId: AweWeaponSpecial;
      readonly slot: "weapon";
    }
  | {
      readonly kind: "forge-cape";
      readonly patternId: CapeSpecial;
      readonly procId: 0;
      readonly slot: "cape";
    }
  | {
      readonly kind: "forge-helm";
      readonly patternId: HelmSpecial;
      readonly procId: 0;
      readonly slot: "helm";
    }
  | {
      readonly kind: "forge-weapon";
      readonly patternId: typeof FORGE_ENHANCEMENT_PATTERN;
      readonly proc: ForgeWeaponSpecial;
      readonly procId: ForgeWeaponSpecial;
      readonly slot: "weapon";
    };

export type EquipFilterResolution =
  | {
      readonly filter: EquipEnhancementFilter;
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    };

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

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

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
    aliases: ["arcanas", "arcana concerto", "concerto"],
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
  high: {
    [EnhancementType.Fighter]: 768,
    [EnhancementType.Healer]: 762,
    [EnhancementType.Hybrid]: 766,
    [EnhancementType.Lucky]: 763,
    [EnhancementType.Spellbreaker]: 764,
    [EnhancementType.Thief]: 767,
    [EnhancementType.Wizard]: 765,
  },
  low: {
    [EnhancementType.Fighter]: 141,
    [EnhancementType.Healer]: 145,
    [EnhancementType.Hybrid]: 143,
    [EnhancementType.Lucky]: 147,
    [EnhancementType.Spellbreaker]: 146,
    [EnhancementType.Thief]: 142,
    [EnhancementType.Wizard]: 144,
  },
} as const satisfies Record<"high" | "low", Record<EnhancementType, number>>;

const AWE_WEAPON_SHOPS: Partial<Record<EnhancementType, number>> = {
  [EnhancementType.Fighter]: 635,
  [EnhancementType.Healer]: 638,
  [EnhancementType.Hybrid]: 633,
  [EnhancementType.Lucky]: 639,
  [EnhancementType.Thief]: 637,
  [EnhancementType.Wizard]: 636,
} as const;

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

export function isForgeWeaponProc(proc: WeaponSpecial): proc is ForgeWeaponSpecial {
  return proc >= WeaponSpecial.Lacerate;
}

export function isAweProc(proc: WeaponSpecial): proc is AweWeaponSpecial {
  return proc >= WeaponSpecial.SpiralCarve && proc <= WeaponSpecial.PowerwordDIE;
}

export function getItemProcId(item: Pick<EnhancementItemLike, "data">): number {
  return toNumber(item.data.ProcID) ?? 0;
}

export function resolveEnhancementSlot(item: EnhancementItemLike): EnhancementSlot | null {
  if (item.isWeapon()) {
    return "weapon";
  }

  if (item.isCape()) {
    return "cape";
  }

  if (item.isHelm()) {
    return "helm";
  }

  if (item.isArmor() || item.isClass()) {
    return "armor";
  }

  return null;
}

const resolveItemTypeFilter = (value: string): EquipItemTypeFilter | null => {
  const normalized = normalizeName(value);
  if (normalized === "weapon") {
    return "weapon";
  }

  if (normalized === "cape") {
    return "cape";
  }

  if (normalized === "helm") {
    return "helm";
  }

  if (normalized === "armor" || normalized === "class") {
    return "armor";
  }

  return null;
};

const resolveIntentForSlot = (
  slot: EnhancementSlot,
  enhancementName: string,
  procName?: string,
):
  | {
      readonly intent: EnhancementIntent;
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly reason: string;
    } => {
  const normalizedEnhancement = normalizeName(enhancementName);
  const normalizedProc = normalizeName(procName ?? "");
  const basicType = resolveEnhancementType(normalizedEnhancement);
  const weaponProc = normalizedProc ? resolveWeaponSpecial(normalizedProc) : null;
  const capeProc = normalizedProc ? resolveCapeSpecial(normalizedProc) : null;
  const helmProc = normalizedProc ? resolveHelmSpecial(normalizedProc) : null;
  const isForge = normalizedEnhancement === "forge";

  if (slot === "weapon") {
    if (weaponProc !== null) {
      if (isForgeWeaponProc(weaponProc)) {
        if (!isForge) {
          return {
            ok: false,
            reason: `Forge proc ${getWeaponProcName(weaponProc)} requires enhancement type Forge`,
          };
        }

        return {
          intent: {
            kind: "forge-weapon",
            patternId: FORGE_ENHANCEMENT_PATTERN,
            proc: weaponProc,
            procId: weaponProc,
            slot: "weapon",
          },
          ok: true,
        };
      }

      if (basicType === null) {
        return {
          ok: false,
          reason: `Awe proc ${getWeaponProcName(weaponProc)} requires a basic enhancement type`,
        };
      }

      return {
        intent: {
          enhancementType: basicType,
          kind: "awe-weapon",
          patternId: basicType,
          proc: weaponProc,
          procId: weaponProc,
          slot: "weapon",
        },
        ok: true,
      };
    }

    if (isForge) {
      return {
        intent: {
          kind: "forge-weapon",
          patternId: FORGE_ENHANCEMENT_PATTERN,
          procId: 0,
          slot: "weapon",
        },
        ok: true,
      };
    }

    if (basicType !== null) {
      return {
        intent: {
          enhancementType: basicType,
          kind: "basic",
          patternId: basicType,
          procId: 0,
          slot: "weapon",
        },
        ok: true,
      };
    }

    if (capeProc !== null || helmProc !== null) {
      return {
        ok: false,
        reason: `Proc ${procName ?? ""} does not apply to weapon enhancements`,
      };
    }

    return {
      ok: false,
      reason: `Unknown enhancement type: ${enhancementName}`,
    };
  }

  if (slot === "cape") {
    if (isForge) {
      if (!normalizedProc) {
        return {
          intent: {
            kind: "forge-cape",
            patternId: CapeSpecial.Forge,
            procId: 0,
            slot: "cape",
          },
          ok: true,
        };
      }

      if (capeProc === null) {
        return {
          ok: false,
          reason: `Unknown forge cape proc: ${procName ?? ""}`,
        };
      }

      return {
        intent: {
          kind: "forge-cape",
          patternId: capeProc,
          proc: capeProc,
          procId: 0,
          slot: "cape",
        },
        ok: true,
      };
    }

    if (normalizedProc) {
      return {
        ok: false,
        reason: `Cape enhancements do not support proc ${procName ?? ""} unless Forge is selected`,
      };
    }

    if (basicType === null) {
      return {
        ok: false,
        reason: `Unknown enhancement type: ${enhancementName}`,
      };
    }

    return {
      intent: {
        enhancementType: basicType,
        kind: "basic",
        patternId: basicType,
        procId: 0,
        slot: "cape",
      },
      ok: true,
    };
  }

  if (slot === "helm") {
    if (isForge) {
      if (!normalizedProc) {
        return {
          intent: {
            kind: "forge-helm",
            patternId: HelmSpecial.Forge,
            procId: 0,
            slot: "helm",
          },
          ok: true,
        };
      }

      if (helmProc === null) {
        return {
          ok: false,
          reason: `Unknown forge helm proc: ${procName ?? ""}`,
        };
      }

      return {
        intent: {
          kind: "forge-helm",
          patternId: helmProc,
          proc: helmProc,
          procId: 0,
          slot: "helm",
        },
        ok: true,
      };
    }

    if (normalizedProc) {
      return {
        ok: false,
        reason: `Helm enhancements do not support proc ${procName ?? ""} unless Forge is selected`,
      };
    }

    if (basicType === null) {
      return {
        ok: false,
        reason: `Unknown enhancement type: ${enhancementName}`,
      };
    }

    return {
      intent: {
        enhancementType: basicType,
        kind: "basic",
        patternId: basicType,
        procId: 0,
        slot: "helm",
      },
      ok: true,
    };
  }

  if (isForge) {
    return {
      ok: false,
      reason: "Forge enhancement does not apply to armor/class items",
    };
  }

  if (normalizedProc) {
    return {
      ok: false,
      reason: `Armor/class enhancements do not support proc ${procName ?? ""}`,
    };
  }

  if (basicType === null) {
    return {
      ok: false,
      reason: `Unknown enhancement type: ${enhancementName}`,
    };
  }

  return {
    intent: {
      enhancementType: basicType,
      kind: "basic",
      patternId: basicType,
      procId: 0,
      slot: "armor",
    },
    ok: true,
  };
};

export function resolveEnhancementStrategy(
  item: EnhancementItemLike,
  enhancementName: string,
  playerLevel: number,
  procName?: string,
): EnhancementResolution {
  const slot = resolveEnhancementSlot(item);
  if (slot === null) {
    return {
      ok: false,
      reason: `Item category ${item.category} cannot be enhanced`,
    };
  }

  const intent = resolveIntentForSlot(slot, enhancementName, procName);
  if (!intent.ok) {
    return intent;
  }

  if (intent.intent.kind === "basic") {
    return {
      ok: true,
      strategy: {
        intent: intent.intent,
        patternId: intent.intent.patternId,
        procId: 0,
        shopId: getBasicEnhancementShopId(intent.intent.enhancementType, playerLevel),
        slot,
      },
    };
  }

  if (intent.intent.kind === "awe-weapon") {
    const aweShopId = getAweWeaponShopId(intent.intent.enhancementType);
    if (aweShopId === undefined) {
      return {
        ok: false,
        reason: `No awe enhancement shop found for type ${getEnhancementName(intent.intent.enhancementType)}`,
      };
    }

    return {
      ok: true,
      strategy: {
        intent: intent.intent,
        map: "museum",
        patternId: intent.intent.patternId,
        procId: intent.intent.procId,
        shopId: aweShopId,
        slot: "weapon",
      },
    };
  }

  if (intent.intent.kind === "forge-weapon") {
    return {
      ok: true,
      strategy: {
        intent: intent.intent,
        map: "forge",
        patternId: intent.intent.patternId,
        procId: intent.intent.procId,
        shopId: FORGE_WEAPON_SHOP,
        slot: "weapon",
      },
    };
  }

  if (intent.intent.kind === "forge-cape") {
    return {
      ok: true,
      strategy: {
        intent: intent.intent,
        map: "forge",
        patternId: intent.intent.patternId,
        procId: 0,
        shopId: FORGE_CAPE_SHOP,
        slot: "cape",
      },
    };
  }

  return {
    ok: true,
    strategy: {
      intent: intent.intent,
      map: "forge",
      patternId: intent.intent.patternId,
      procId: 0,
      shopId: FORGE_HELM_SHOP,
      slot: "helm",
    },
  };
}

export function resolveEquipEnhancementFilter(
  enhancementName: string,
  procOrItemType?: string,
): EquipFilterResolution {
  const normalizedEnhancement = normalizeName(enhancementName);
  const normalizedSecond = normalizeName(procOrItemType ?? "");

  if (normalizedEnhancement === "forge") {
    if (!normalizedSecond) {
      return {
        ok: false,
        reason: "Forge equip filter requires a proc name (weapon/cape/helm)",
      };
    }

    const weaponProc = resolveWeaponSpecial(normalizedSecond);
    if (weaponProc !== null && isForgeWeaponProc(weaponProc)) {
      return {
        filter: {
          kind: "forge-weapon",
          patternId: FORGE_ENHANCEMENT_PATTERN,
          proc: weaponProc,
          procId: weaponProc,
          slot: "weapon",
        },
        ok: true,
      };
    }

    const capeProc = resolveCapeSpecial(normalizedSecond);
    if (capeProc !== null) {
      return {
        filter: {
          kind: "forge-cape",
          patternId: capeProc,
          procId: 0,
          slot: "cape",
        },
        ok: true,
      };
    }

    const helmProc = resolveHelmSpecial(normalizedSecond);
    if (helmProc !== null) {
      return {
        filter: {
          kind: "forge-helm",
          patternId: helmProc,
          procId: 0,
          slot: "helm",
        },
        ok: true,
      };
    }

    return {
      ok: false,
      reason: `Unknown Forge proc filter: ${procOrItemType ?? ""}`,
    };
  }

  const basicType = resolveEnhancementType(normalizedEnhancement);
  if (basicType === null) {
    return {
      ok: false,
      reason: `Unknown enhancement type: ${enhancementName}`,
    };
  }

  if (!normalizedSecond) {
    return {
      filter: {
        enhancementType: basicType,
        kind: "basic",
        procId: 0,
      },
      ok: true,
    };
  }

  const typeFilter = resolveItemTypeFilter(normalizedSecond);
  if (typeFilter !== null) {
    return {
      filter: {
        enhancementType: basicType,
        kind: "basic",
        procId: 0,
        slot: typeFilter,
      },
      ok: true,
    };
  }

  const weaponProc = resolveWeaponSpecial(normalizedSecond);
  if (weaponProc !== null) {
    if (!isAweProc(weaponProc)) {
      return {
        ok: false,
        reason: `Proc ${getWeaponProcName(weaponProc)} requires Forge enhancement for equip filtering`,
      };
    }

    return {
      filter: {
        enhancementType: basicType,
        kind: "basic-awe",
        proc: weaponProc,
        procId: weaponProc,
        slot: "weapon",
      },
      ok: true,
    };
  }

  return {
    ok: false,
    reason: `Unknown proc or item type filter: ${procOrItemType ?? ""}`,
  };
}

const matchSlot = (slot: EnhancementSlot, filterSlot?: EquipItemTypeFilter): boolean => {
  if (!filterSlot) {
    return true;
  }

  return slot === filterSlot;
};

export function matchesEquipEnhancementFilter(
  item: EnhancementItemLike,
  filter: EquipEnhancementFilter,
): boolean {
  const slot = resolveEnhancementSlot(item);
  if (!slot) {
    return false;
  }

  if (filter.kind === "basic") {
    return (
      item.enhancementPatternId === filter.enhancementType &&
      matchSlot(slot, filter.slot)
    );
  }

  if (filter.kind === "basic-awe") {
    return (
      slot === "weapon" &&
      item.enhancementPatternId === filter.enhancementType &&
      getItemProcId(item) === filter.procId
    );
  }

  if (filter.kind === "forge-weapon") {
    return (
      slot === "weapon" &&
      item.enhancementPatternId === filter.patternId &&
      getItemProcId(item) === filter.procId
    );
  }

  return slot === filter.slot && item.enhancementPatternId === filter.patternId;
}

export function compareEnhancementCandidates(
  left: EnhancementComparableLike,
  right: EnhancementComparableLike,
): number {
  if (right.enhancementLevel !== left.enhancementLevel) {
    return right.enhancementLevel - left.enhancementLevel;
  }

  if (right.level !== left.level) {
    return right.level - left.level;
  }

  return left.id - right.id;
}

export function rankEnhancementCandidates<T extends EnhancementComparableLike>(
  candidates: readonly T[],
): T[] {
  return [...candidates].sort(compareEnhancementCandidates);
}

export function matchesAppliedEnhancement(
  item: EnhancementItemLike,
  strategy: Pick<EnhancementStrategy, "patternId" | "procId">,
): boolean {
  if (item.enhancementPatternId !== strategy.patternId) {
    return false;
  }

  if (strategy.procId <= 0) {
    return true;
  }

  return getItemProcId(item) === strategy.procId;
}

const SLOT_GROUP: Record<EnhancementSlot, string> = {
  armor: "ar",
  cape: "ba",
  helm: "he",
  weapon: "weapon",
};

export function matchesEnhancementShopCandidate(
  shopItem: EnhancementShopItemLike,
  strategy: Pick<EnhancementStrategy, "patternId" | "procId" | "slot">,
): boolean {
  if (normalizeName(shopItem.itemGroup) !== SLOT_GROUP[strategy.slot]) {
    return false;
  }

  const data = shopItem.data;
  const itemPatternId =
    toNumber(data.PatternID) ??
    toNumber(data.EnhPatternID) ??
    toNumber(data.EnhID) ??
    0;
  const itemProcId = toNumber(data.ItemProcID) ?? toNumber(data.ProcID) ?? 0;

  if (strategy.procId > 0) {
    return (
      itemProcId === strategy.procId &&
      (itemPatternId <= 0 || itemPatternId === strategy.patternId)
    );
  }

  return itemPatternId === strategy.patternId && itemProcId === 0;
}
