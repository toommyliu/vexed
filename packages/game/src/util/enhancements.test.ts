import { describe, expect, test } from "vitest";
import {
  HelmSpecial,
  matchesEquipEnhancementFilter,
  rankEnhancementCandidates,
  resolveEquipEnhancementFilter,
  type EnhancementItemLike,
} from "./enhancements";

type TestItem = EnhancementItemLike & {
  readonly name: string;
};

const makeItem = ({
  category,
  enhancementLevel = 100,
  enhancementPatternId,
  id,
  itemGroup,
  level = 1,
  name = String(id),
  procId = 0,
}: {
  readonly category: string;
  readonly enhancementLevel?: number;
  readonly enhancementPatternId: number;
  readonly id: number;
  readonly itemGroup: string;
  readonly level?: number;
  readonly name?: string;
  readonly procId?: number;
}): TestItem => ({
  category,
  data: procId > 0 ? { ProcID: procId } : {},
  enhancementLevel,
  enhancementPatternId,
  id,
  level,
  name,
  isArmor: () => itemGroup === "co",
  isCape: () => itemGroup === "ba",
  isClass: () => category === "Class",
  isHelm: () => itemGroup === "he",
  isWeapon: () => itemGroup === "Weapon",
});

describe("resolveEquipEnhancementFilter", () => {
  test("resolves base Forge helm selectors", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "forge",
      slot: "helm",
    });

    expect(resolution).toMatchObject({
      filter: {
        kind: "forge-helm",
        patternId: HelmSpecial.Forge,
        slot: "helm",
      },
      ok: true,
    });

    if (!resolution.ok) {
      throw new Error(resolution.reason);
    }

    const zilla = makeItem({
      category: "Helm",
      enhancementPatternId: 10,
      id: 62_990,
      itemGroup: "he",
      name: "Zilla Maid Headdress",
    });
    const dragon = makeItem({
      category: "Helm",
      enhancementPatternId: 10,
      id: 56_725,
      itemGroup: "he",
      name: "Ascended Dragon of Time Morph",
    });

    expect(matchesEquipEnhancementFilter(zilla, resolution.filter)).toBe(true);
    expect(matchesEquipEnhancementFilter(dragon, resolution.filter)).toBe(true);
  });

  test("resolves Forge helm specials", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "forge",
      special: "vim",
      slot: "helm",
    });

    expect(resolution).toMatchObject({
      filter: {
        kind: "forge-helm",
        patternId: HelmSpecial.Vim,
        slot: "helm",
      },
      ok: true,
    });
  });

  test("resolves base Forge weapon selectors without a proc", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "forge",
      slot: "weapon",
    });

    expect(resolution).toMatchObject({
      filter: {
        kind: "forge-weapon",
        patternId: 10,
        procId: 0,
        slot: "weapon",
      },
      ok: true,
    });

    if (!resolution.ok) {
      throw new Error(resolution.reason);
    }

    expect(
      matchesEquipEnhancementFilter(
        makeItem({
          category: "Sword",
          enhancementPatternId: 10,
          id: 1,
          itemGroup: "Weapon",
        }),
        resolution.filter,
      ),
    ).toBe(true);
    expect(
      matchesEquipEnhancementFilter(
        makeItem({
          category: "Sword",
          enhancementPatternId: 10,
          id: 2,
          itemGroup: "Weapon",
          procId: 9,
        }),
        resolution.filter,
      ),
    ).toBe(false);
  });

  test("rejects armor selectors because armors cannot be enhanced", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "forge",
      slot: "armor",
    });

    expect(resolution).toMatchObject({
      ok: false,
      reason: expect.stringContaining("Armor items cannot be enhanced"),
    });
  });

  test("requires a Forge slot or unambiguous proc", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "forge",
    });

    expect(resolution).toMatchObject({
      ok: false,
      reason: expect.stringContaining("requires a slot"),
    });
  });

  test("resolves basic enhancement selectors by slot", () => {
    const resolution = resolveEquipEnhancementFilter({
      enhancement: "lucky",
      slot: "helm",
    });

    expect(resolution).toMatchObject({
      filter: {
        enhancementType: 9,
        kind: "basic",
        slot: "helm",
      },
      ok: true,
    });

    if (!resolution.ok) {
      throw new Error(resolution.reason);
    }

    expect(
      matchesEquipEnhancementFilter(
        makeItem({
          category: "Helm",
          enhancementPatternId: 9,
          id: 1,
          itemGroup: "he",
        }),
        resolution.filter,
      ),
    ).toBe(true);
    expect(
      matchesEquipEnhancementFilter(
        makeItem({
          category: "Cape",
          enhancementPatternId: 9,
          id: 2,
          itemGroup: "ba",
        }),
        resolution.filter,
      ),
    ).toBe(false);
  });
});

describe("rankEnhancementCandidates", () => {
  test("ranks by enhancement level, then item level, then preserves input order", () => {
    const firstTie = makeItem({
      category: "Helm",
      enhancementLevel: 100,
      enhancementPatternId: 10,
      id: 30,
      itemGroup: "he",
      level: 10,
      name: "first tie",
    });
    const secondTie = makeItem({
      category: "Helm",
      enhancementLevel: 100,
      enhancementPatternId: 10,
      id: 10,
      itemGroup: "he",
      level: 10,
      name: "second tie",
    });
    const best = makeItem({
      category: "Helm",
      enhancementLevel: 100,
      enhancementPatternId: 10,
      id: 20,
      itemGroup: "he",
      level: 20,
      name: "best",
    });
    const lowEnhancement = makeItem({
      category: "Helm",
      enhancementLevel: 90,
      enhancementPatternId: 10,
      id: 1,
      itemGroup: "he",
      level: 100,
      name: "low enhancement",
    });

    expect(
      rankEnhancementCandidates([
        firstTie,
        lowEnhancement,
        secondTie,
        best,
      ]).map((item) => item.name),
    ).toEqual(["best", "first tie", "second tie", "low enhancement"]);
  });
});
