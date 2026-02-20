import { writable } from "svelte/store";
import type { FollowerConfig } from "~/shared/follower/types";

export const followerConfig = writable<FollowerConfig | null>(null);
export const followerEnabled = writable(false);

export function resetFollowerState() {
  followerConfig.set(null);
  followerEnabled.set(false);
}
