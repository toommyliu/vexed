import { writable } from "svelte/store";
import type {
  CustomTheme,
  ThemeScheme,
  ThemeToken,
} from "~/shared/settings/types";
import { getColorScheme } from "../../../shared/theme";

const queuedTokenUpdates: Record<
  ThemeScheme,
  Partial<Record<ThemeToken, string | null>>
> = {
  dark: {},
  light: {},
};

let pendingTokenFrameId: number | null = null;

export const customTheme = writable<CustomTheme>({});
export const activeEditScheme = writable<ThemeScheme>(getColorScheme());
export const liveScheme = writable<ThemeScheme>(getColorScheme());

export function setToken(token: ThemeToken, hex: string): void {
  customTheme.update((theme) => {
    let currentScheme: ThemeScheme = "dark";
    activeEditScheme.subscribe((scheme) => (currentScheme = scheme))();
    return {
      ...theme,
      [currentScheme]: {
        ...theme[currentScheme],
        [token]: hex,
      },
    };
  });
}

export function clearToken(token: ThemeToken): void {
  customTheme.update((theme) => {
    let currentScheme: ThemeScheme = "dark";
    activeEditScheme.subscribe((scheme) => (currentScheme = scheme))();
    const scheme = theme[currentScheme] ?? {};
    const { [token]: _, ...rest } = scheme;
    return { ...theme, [currentScheme]: rest };
  });
}

export function setRadius(value: string): void {
  customTheme.update((theme) => ({ ...theme, radius: value }));
}

export function clearRadius(): void {
  customTheme.update((theme) => {
    const { radius: _, ...rest } = theme;
    return rest;
  });
}

export function reset(): void {
  customTheme.set({});
}

export function queueTokenUpdate(
  scheme: "dark" | "light",
  token: ThemeToken,
  value: string | null,
): void {
  queuedTokenUpdates[scheme][token] = value;
  if (pendingTokenFrameId !== null) return;
  pendingTokenFrameId = requestAnimationFrame(() => {
    pendingTokenFrameId = null;
    applyQueuedTokenUpdates();
  });
}

export function flushQueuedTokenUpdates(): void {
  if (pendingTokenFrameId !== null) {
    cancelAnimationFrame(pendingTokenFrameId);
    pendingTokenFrameId = null;
  }

  applyQueuedTokenUpdates();
}

export function applyQueuedTokenUpdates(): void {
  let nextTheme: CustomTheme = {};
  customTheme.subscribe((theme) => (nextTheme = theme))();
  let changed = false;
  for (const scheme of ["dark", "light"] as const) {
    const updates = queuedTokenUpdates[scheme];
    const tokens = Object.keys(updates) as ThemeToken[];
    if (tokens.length === 0) continue;
    let nextScheme = { ...nextTheme[scheme] };
    let schemeChanged = false;
    for (const token of tokens) {
      const nextValue = updates[token];
      if (typeof nextValue === "string") {
        if (nextScheme[token] !== nextValue) {
          nextScheme[token] = nextValue;
          schemeChanged = true;
        }
      } else if (token in nextScheme) {
        const { [token]: _, ...rest } = nextScheme;
        nextScheme = rest;
        schemeChanged = true;
      }
    }

    queuedTokenUpdates[scheme] = {};
    if (!schemeChanged) continue;
    nextTheme = { ...nextTheme, [scheme]: nextScheme };
    changed = true;
  }

  if (changed) customTheme.set(nextTheme);
}
