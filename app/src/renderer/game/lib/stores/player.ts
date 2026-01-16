import { Collection } from "@vexed/collection";
import { Avatar, type AvatarData } from "@vexed/game";
import type { PlayersStore } from "./store";

const store = new Collection<string, Avatar>();
const entIds = new Map<string, number>(); // lowercase username -> entity id

const register = (username: string, entId: number) => {
  const lower = username.toLowerCase();
  if (entIds.has(lower)) {
    console.warn(
      `Player ${username} is already registered. have: ${entIds.get(lower)}, want: ${entId}`,
    );
    return;
  }

  entIds.set(lower, entId);
  console.log(`register player: ${lower} :: ${entId}`);
};

export const players: PlayersStore<string, Avatar, AvatarData> = {
  all: () => store,
  has: (key: string) => store.has(key),
  get: (key: string) => store.get(key),
  register,
  add: (player: AvatarData) => {
    const lower = player.uoName; // already lowercased
    store.set(lower, new Avatar(player));
    register(lower, player.entID);
  },
  remove: (key: string) => {
    entIds.delete(key.toLowerCase());
    store.delete(key);
  },

  getByName: (name: string) =>
    store.find(
      (avatar) => avatar.username?.toLowerCase() === name.toLowerCase(),
    ),
  getById: (id: number) => store.find((avatar) => avatar.data.entID === id),
  findBy: (predicate: (value: Avatar) => boolean) => store.find(predicate),
};
