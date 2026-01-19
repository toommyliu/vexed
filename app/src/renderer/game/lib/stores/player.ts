import { Collection } from "@vexed/collection";
import { Avatar, type AvatarData } from "@vexed/game";
import { equalsIgnoreCase } from "@vexed/utils/string";
import type { PlayersStore } from "./store";

const store = new Collection<string, Avatar>();
const entIds = new Map<string, number>(); // lowercase username -> entity id
let myUsername: string | undefined;

const register = (username: string, entId: number) => {
  const lower = username.toLowerCase();
  if (entIds.has(lower)) {
    // console.warn(
    //   `Player ${username} is already registered. have: ${entIds.get(lower)}, want: ${entId}`,
    // );
    return;
  }

  entIds.set(lower, entId);
  // console.log(`register player: ${lower} :: ${entId}`);
};

export const players: PlayersStore<string, Avatar, AvatarData> = {
  all: () => store,
  clear: () => {
    store.clear();
    entIds.clear();
  },
  has: (key: string) => store.has(key.toLowerCase()),
  get: (key: string) => store.get(key.toLowerCase()),
  register,
  add: (player: AvatarData) => {
    const lower = player.uoName; // already lowercased
    store.set(lower, new Avatar(player));
    register(lower, player.entID);
  },
  set: (key: string, player: AvatarData) => {
    store.set(key.toLowerCase(), new Avatar(player));
    register(key.toLowerCase(), player.entID);
  },
  remove: (key: string) => {
    entIds.delete(key.toLowerCase());
    store.delete(key.toLowerCase());
  },

  getByName: (name: string) =>
    store.find((avatar) => equalsIgnoreCase(avatar.username ?? "", name)),
  getById: (id: number) => store.find((avatar) => avatar.data.entID === id),
  findBy: (predicate: (value: Avatar) => boolean) => store.find(predicate),

  get me() {
    return myUsername ? store.get(myUsername) : undefined;
  },
  setMe(username: string) {
    myUsername = username.toLowerCase();
  },
};
