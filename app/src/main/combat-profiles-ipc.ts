import { BrowserWindow, ipcMain } from "electron";
import {
  DEFAULT_COMBAT_PROFILE_ID,
  DEFAULT_COMBAT_PROFILE_LIBRARY,
  normalizeCombatProfileLibrary,
  type CombatProfile,
  type CombatProfileAutoAttackState,
  type CombatProfileLibrary,
} from "../shared/combat-profiles";
import { CombatProfilesIpcChannels } from "../shared/ipc";
import * as Files from "./settings/Files";

let combatProfilesIpcRegistered = false;

const path = (): string => Files.appDataJoin("combat-profiles.json");

const readState = (): CombatProfileLibrary =>
  Files.ensureJson(
    path(),
    DEFAULT_COMBAT_PROFILE_LIBRARY,
    normalizeCombatProfileLibrary,
  );

const writeState = (state: CombatProfileLibrary): CombatProfileLibrary => {
  const normalized = normalizeCombatProfileLibrary(state);
  Files.writeJson(path(), normalized);
  return normalized;
};

const broadcastChanged = (state: CombatProfileLibrary): void => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) {
      continue;
    }

    win.webContents.send(CombatProfilesIpcChannels.changed, state);
  }
};

const publishState = (state: CombatProfileLibrary): CombatProfileLibrary => {
  const normalized = writeState(state);
  broadcastChanged(normalized);
  return normalized;
};

const normalizeProfilePayload = (profile: unknown): CombatProfile => {
  const normalized = normalizeCombatProfileLibrary({ profiles: [profile] });
  const explicitId =
    typeof profile === "object" && profile !== null && "id" in profile
      ? (profile as { readonly id?: unknown }).id
      : undefined;

  if (explicitId === DEFAULT_COMBAT_PROFILE_ID) {
    return (
      normalized.profiles.find(
        (candidate) => candidate.id === DEFAULT_COMBAT_PROFILE_ID,
      ) ?? DEFAULT_COMBAT_PROFILE_LIBRARY.profiles[0]!
    );
  }

  return (
    normalized.profiles.find(
      (candidate) => candidate.id !== DEFAULT_COMBAT_PROFILE_ID,
    ) ??
    normalized.profiles[0] ??
    DEFAULT_COMBAT_PROFILE_LIBRARY.profiles[0]!
  );
};

const saveProfile = (profile: unknown): CombatProfileLibrary => {
  const current = readState();
  const normalizedProfile = normalizeProfilePayload(profile);
  return publishState({
    ...current,
    profiles: [
      ...current.profiles.filter(
        (candidate) => candidate.id !== normalizedProfile.id,
      ),
      normalizedProfile,
    ],
  });
};

const deleteProfile = (profileId: unknown): CombatProfileLibrary => {
  if (typeof profileId !== "string" || profileId === DEFAULT_COMBAT_PROFILE_ID) {
    return readState();
  }

  const current = readState();
  return publishState({
    ...current,
    profiles: current.profiles.filter((profile) => profile.id !== profileId),
  });
};

const setAutoAttack = (state: unknown): CombatProfileLibrary => {
  const current = readState();
  return publishState({
    ...current,
    autoAttack: state as CombatProfileAutoAttackState,
  });
};

export const registerCombatProfilesIpcHandlers = (): void => {
  if (combatProfilesIpcRegistered) {
    return;
  }

  ipcMain.handle(CombatProfilesIpcChannels.getState, () => readState());

  ipcMain.handle(CombatProfilesIpcChannels.saveProfile, (_event, profile) =>
    saveProfile(profile),
  );

  ipcMain.handle(CombatProfilesIpcChannels.deleteProfile, (_event, profileId) =>
    deleteProfile(profileId),
  );

  ipcMain.handle(CombatProfilesIpcChannels.setAutoAttack, (_event, state) =>
    setAutoAttack(state),
  );

  combatProfilesIpcRegistered = true;
};
