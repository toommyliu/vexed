import { expect, test } from "vitest";
import {
  addEnvironmentBoost,
  addEnvironmentBoosts,
  addEnvironmentItem,
  addEnvironmentQuest,
  areEnvironmentStatesEqual,
  classifyEnvironmentDropItem,
  clearEnvironmentItems,
  clearEnvironmentQuestReward,
  createEmptyEnvironmentState,
  environmentItemRulesToDropPolicy,
  normalizeEnvironmentState,
  patchEnvironmentDropPolicy,
  removeEnvironmentItem,
  removeEnvironmentQuest,
  resolveEnvironmentDropAction,
  setEnvironmentDropPolicy,
  setEnvironmentItemRules,
  setEnvironmentQuestAutoRegisterOptions,
  setEnvironmentQuestReward,
  type EnvironmentDropItemData,
  type EnvironmentItemRules,
} from "./environment";

const dropItem = (
  name: string,
  flags: { readonly ac?: boolean; readonly member?: boolean } = {},
): EnvironmentDropItemData => ({
  bCoins: flags.ac === true ? 1 : 0,
  bUpg: flags.member === true ? 1 : 0,
  sName: name,
});

test("normalizes quests, rewards, items, boosts, and item rules", () => {
  expect(
    normalizeEnvironmentState({
      questIds: [7, 5, 7, -1],
      questAutoRegister: {
        requirements: false,
        rewards: true,
      },
      questRewards: {
        5: 99,
        7: -1,
        8: 12,
      },
      itemNames: ["  Bone Dust ", "bone dust", "", "Uni 13"],
      itemRules: {
        buckets: [
          "non-ac-member",
          "not-a-bucket",
          "ac-non-member",
          "ac-non-member",
        ],
        rejectElse: true,
      } as EnvironmentItemRules,
      boosts: ["XP Boost! (1 hr)", " xp boost! (1 hr) ", "Daily Gold"],
    }),
  ).toEqual({
    questIds: [5, 7],
    questAutoRegister: {
      requirements: false,
      rewards: true,
    },
    questRewards: {
      5: 99,
    },
    itemNames: ["Bone Dust", "Uni 13"],
    itemRules: {
      buckets: ["ac-non-member", "non-ac-member"],
      rejectElse: true,
    },
    boosts: ["Daily Gold", "XP Boost! (1 hr)"],
  });
});

test("quest auto register options default off and can be updated", () => {
  const empty = createEmptyEnvironmentState();

  expect(empty.questAutoRegister).toEqual({
    requirements: false,
    rewards: false,
  });

  expect(
    setEnvironmentQuestAutoRegisterOptions(empty, {
      requirements: false,
      rewards: true,
    }).questAutoRegister,
  ).toEqual({
    requirements: false,
    rewards: true,
  });
});

test("granular quest mutations keep rewards attached to existing quests only", () => {
  const state = addEnvironmentQuest(createEmptyEnvironmentState(), "10", "42");
  const withReward = setEnvironmentQuestReward(state, 12, 44);

  expect(withReward.questIds).toEqual([10, 12]);
  expect(withReward.questRewards).toEqual({ 10: 42, 12: 44 });

  const withoutReward = clearEnvironmentQuestReward(withReward, "10");
  expect(withoutReward.questRewards).toEqual({ 12: 44 });

  const withoutQuest = removeEnvironmentQuest(withoutReward, 12);
  expect(withoutQuest.questIds).toEqual([10]);
  expect(withoutQuest.questRewards).toEqual({});
});

test("item mutations are case-insensitive and rules reset on clear", () => {
  const state = setEnvironmentItemRules(
    addEnvironmentItem(
      addEnvironmentItem(createEmptyEnvironmentState(), "Gem"),
      "gem",
    ),
    { buckets: ["ac-non-member"], rejectElse: true },
  );

  expect(state.itemNames).toEqual(["Gem"]);
  expect(removeEnvironmentItem(state, "GEM").itemNames).toEqual([]);
  expect(clearEnvironmentItems(state).itemRules).toEqual({
    buckets: [],
    rejectElse: false,
  });
});

test("classifies drops by AC and member flags", () => {
  expect(classifyEnvironmentDropItem(dropItem("A", { ac: true }))).toBe(
    "ac-non-member",
  );
  expect(
    classifyEnvironmentDropItem(dropItem("B", { ac: true, member: true })),
  ).toBe("ac-member");
  expect(classifyEnvironmentDropItem(dropItem("C", { member: true }))).toBe(
    "non-ac-member",
  );
  expect(classifyEnvironmentDropItem(dropItem("D"))).toBe("non-ac-non-member");
});

test("drop rules accept explicit names and selected buckets", () => {
  const state = setEnvironmentItemRules(
    addEnvironmentItem(createEmptyEnvironmentState(), "Gem"),
    { buckets: ["ac-non-member"], rejectElse: false },
  );

  expect(resolveEnvironmentDropAction(state, dropItem("gem"))).toBe("accept");
  expect(
    resolveEnvironmentDropAction(state, dropItem("Coin", { ac: true })),
  ).toBe("accept");
  expect(
    resolveEnvironmentDropAction(state, dropItem("Member", { member: true })),
  ).toBe("ignore");
});

test("drop policy maps explicit options to internal item rules", () => {
  const rules = patchEnvironmentDropPolicy(
    {
      buckets: ["ac-non-member"],
      rejectElse: false,
    },
    {
      acceptAcMemberOnlyDrops: true,
      acceptAcNonMemberDrops: false,
      rejectUnregisteredDrops: true,
    },
  );

  expect(rules).toEqual({
    buckets: ["ac-member"],
    rejectElse: true,
  });
  expect(environmentItemRulesToDropPolicy(rules)).toEqual({
    acceptAcMemberOnlyDrops: true,
    acceptAcNonMemberDrops: false,
    acceptNonAcMemberOnlyDrops: false,
    acceptNonAcNonMemberDrops: false,
    rejectUnregisteredDrops: true,
  });
});

test("drop policy patches only provided options", () => {
  const state = setEnvironmentDropPolicy(
    setEnvironmentItemRules(createEmptyEnvironmentState(), {
      buckets: ["non-ac-member"],
      rejectElse: false,
    }),
    {
      acceptNonAcNonMemberDrops: true,
    },
  );

  expect(state.itemRules).toEqual({
    buckets: ["non-ac-member", "non-ac-non-member"],
    rejectElse: false,
  });
});

test("drop rules reject non-matches only when reject else is enabled", () => {
  const watchOnly = setEnvironmentItemRules(
    addEnvironmentItem(createEmptyEnvironmentState(), "Gem"),
    { buckets: [], rejectElse: true },
  );
  const bucketRules = setEnvironmentItemRules(createEmptyEnvironmentState(), {
    buckets: ["ac-non-member"],
    rejectElse: true,
  });

  expect(resolveEnvironmentDropAction(watchOnly, dropItem("Stone"))).toBe(
    "reject",
  );
  expect(resolveEnvironmentDropAction(watchOnly, dropItem("Gem"))).toBe(
    "accept",
  );
  expect(
    resolveEnvironmentDropAction(bucketRules, dropItem("Coin", { ac: true })),
  ).toBe("accept");
  expect(
    resolveEnvironmentDropAction(
      bucketRules,
      dropItem("Member", {
        member: true,
      }),
    ),
  ).toBe("reject");
});

test("boost mutations dedupe names case-insensitively", () => {
  const state = addEnvironmentBoosts(
    addEnvironmentBoost(
      createEmptyEnvironmentState(),
      "Daily XP Boost! (1 hr)",
    ),
    ["daily xp boost! (1 hr)", "Daily Login Gold Boost! (20 min)"],
  );

  expect(state.boosts).toEqual([
    "Daily Login Gold Boost! (20 min)",
    "Daily XP Boost! (1 hr)",
  ]);
});

test("state equality compares normalized values", () => {
  expect(
    areEnvironmentStatesEqual(
      addEnvironmentQuest(createEmptyEnvironmentState(), "2", "9"),
      {
        questIds: [2],
        questAutoRegister: {
          requirements: false,
          rewards: false,
        },
        questRewards: { 2: 9 },
        itemNames: [],
        itemRules: { buckets: [], rejectElse: false },
        boosts: [],
      },
    ),
  ).toBe(true);
});
