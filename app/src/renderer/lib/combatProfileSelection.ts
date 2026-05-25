import {
  DEFAULT_COMBAT_PROFILE_ID,
  type CombatProfile,
} from "../../shared/combat-profiles";

export function readStoredId(storageKey: string): string | undefined {
  try {
    return window.localStorage.getItem(storageKey) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredId(storageKey: string, value: string): void {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {}
}

export function getPreferredCombatProfileId(
  profiles: readonly CombatProfile[],
  preferredId: string | undefined,
  defaultId = DEFAULT_COMBAT_PROFILE_ID,
): string {
  return (
    profiles.find((profile) => profile.id === preferredId)?.id ??
    profiles.find((profile) => profile.id !== defaultId)?.id ??
    profiles[0]?.id ??
    defaultId
  );
}
