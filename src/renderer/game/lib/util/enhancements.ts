import { Bot } from "../Bot";

const enhancements: EnhancementP[] = [
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

export function getEnhancements(): EnhancementP[] {
  if (!enhancements.length) {
    const bot = Bot.getInstance();
    enhancements.push(...bot.flash.get<EnhancementP[]>("world.enhp", true)!);

    console.log("Enhancements loaded:", enhancements);
  }

  return enhancements;
}

/**
 * Get the ID of a proc by its name.
 *
 * @param procName - The name of the proc.
 *  @returns The ID of the proc, or -1 if not found.
 */

export function getProcIdFromName(procName: string): number {
  switch (procName) {
    case "Spiral Carve":
      return 2;
    case "AweBlast":
    case "Awe Blast":
      return 3;
    case "HealthVamp":
    case "Health Vamp":
      return 4;
    case "Mana Vamp":
      return 5;
    case "Powerword DIE":
      return 6;
    case "Lacerate":
      return 7;
    case "Smite":
      return 8;
    case "Valiance":
      return 9;
    case "Arcanas":
    case "ArcanasConcerto":
    case "Arcana's Concerto":
      return 10;
    case "Acheron":
      return 11;
    case "Elysium":
      return 12;
    case "Praxis":
      return 13;
    case "Dauntless":
      return 14;
    case "Ravenous":
      return 15;
    default:
      return -1;
  }
}

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

type EnhancementP = {
  DIS?: boolean;
  ID: number;
  sDesc: string;
  sName: string;
};

// (window as any).getEnhancements = getEnhancements;
// (window as any).bot = Bot.getInstance();
