export type EnvironmentState = {
  autoRegisterRequirements: boolean;
  autoRegisterRewards: boolean;
  boosts: string[];
  itemNames: string[];
  questIds: number[];
  questItemIds: Record<number, number>; // questId:itemId
  rejectElse: boolean;
};
export type EnvironmentUpdatePayload = Omit<EnvironmentState, "questIds"> & {
  questIds: (number | string)[];
};

