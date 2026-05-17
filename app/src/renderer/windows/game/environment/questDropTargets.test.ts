import { Quest, type ItemData, type QuestInfo } from "@vexed/game";
import { expect, test } from "vitest";
import { getQuestDropTargetNames } from "./questDropTargets";

const AUTO_REGISTER_ALL = {
  requirements: true,
  rewards: true,
};

const itemData = (itemId: number, bTemp: number): ItemData =>
  ({
    ItemID: itemId,
    bTemp,
    sName: `Item ${itemId}`,
  }) as ItemData;

const quest = (
  overrides: Partial<
    Pick<
      QuestInfo,
      "RequiredItems" | "Rewards" | "oItems" | "oRewards" | "reward"
    >
  >,
): Quest =>
  new Quest({
    RequiredItems: overrides.RequiredItems ?? [],
    Rewards: overrides.Rewards ?? [],
    oRewards: overrides.oRewards ?? {},
    oItems: overrides.oItems ?? {},
    reward: overrides.reward ?? [],
  } as QuestInfo);

const partialQuest = (data: Partial<QuestInfo>): Quest =>
  new Quest(data as QuestInfo);

test("extracts quest rewards by name", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        Rewards: [
          {
            DropChance: "100%",
            ItemID: "1",
            iQty: 1,
            sName: "  Reward Blade  ",
          },
        ],
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual(["Reward Blade"]);
});

test("extracts turn-in rewards by item metadata", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        reward: [
          {
            ItemID: "7",
            iQty: 1,
            iRate: "100",
            iType: "Item",
          },
        ],
        oItems: {
          "7": {
            ...itemData(7, 0),
            sName: "Turn In Blade",
          },
        },
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual(["Turn In Blade"]);
});

test("extracts object rewards by name", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        oRewards: {
          "8": {
            DropChance: "100%",
            ItemID: "8",
            iQty: 1,
            sName: "Object Reward",
          },
        },
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual(["Object Reward"]);
});

test("extracts non-temp quest requirements with matching item metadata", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        RequiredItems: [
          {
            ItemID: "10",
            iQty: 3,
            sName: "Bone Dust",
          },
        ],
        oItems: {
          "10": itemData(10, 0),
        },
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual(["Bone Dust"]);
});

test("skips temp quest requirements", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        RequiredItems: [
          {
            ItemID: "20",
            iQty: 5,
            sName: "Temporary Token",
          },
        ],
        oItems: {
          "20": itemData(20, 1),
        },
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual([]);
});

test("skips requirements without item metadata", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        RequiredItems: [
          {
            ItemID: "30",
            iQty: 1,
            sName: "Unknown Requirement",
          },
        ],
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual([]);
});

test("handles partial quest payloads", () => {
  expect(getQuestDropTargetNames(partialQuest({}), AUTO_REGISTER_ALL)).toEqual(
    [],
  );
});

test("respects quest auto register options", () => {
  const source = quest({
    Rewards: [
      {
        DropChance: "100%",
        ItemID: "1",
        iQty: 1,
        sName: "Reward",
      },
    ],
    RequiredItems: [
      {
        ItemID: "2",
        iQty: 1,
        sName: "Requirement",
      },
    ],
    oItems: {
      "2": itemData(2, 0),
    },
  });

  expect(
    getQuestDropTargetNames(source, {
      requirements: false,
      rewards: true,
    }),
  ).toEqual(["Reward"]);
  expect(
    getQuestDropTargetNames(source, {
      requirements: true,
      rewards: false,
    }),
  ).toEqual(["Requirement"]);
});

test("normalizes empty and duplicate quest drop target names", () => {
  expect(
    getQuestDropTargetNames(
      quest({
        Rewards: [
          {
            DropChance: "100%",
            ItemID: "1",
            iQty: 1,
            sName: "Gem",
          },
          {
            DropChance: "100%",
            ItemID: "2",
            iQty: 1,
            sName: " gem ",
          },
          {
            DropChance: "100%",
            ItemID: "3",
            iQty: 1,
            sName: " ",
          },
        ],
        RequiredItems: [
          {
            ItemID: "4",
            iQty: 1,
            sName: "GEM",
          },
          {
            ItemID: "5",
            iQty: 1,
            sName: "  Uni 13 ",
          },
        ],
        oItems: {
          "4": itemData(4, 0),
          "5": itemData(5, 0),
        },
      }),
      AUTO_REGISTER_ALL,
    ),
  ).toEqual(["Gem", "Uni 13"]);
});
