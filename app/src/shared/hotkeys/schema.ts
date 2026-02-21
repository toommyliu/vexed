import type { HotkeyConfig, Platform } from "../types";

export type HotkeySectionName = keyof HotkeyConfig;

export type HotkeyId =
  | "load-script"
  | "open-environment"
  | "open-fast-travels"
  | "open-follower"
  | "open-loader-grabber"
  | "open-packet-logger"
  | "open-packet-spammer"
  | "toggle-anti-counter"
  | "toggle-autoattack"
  | "toggle-bank"
  | "toggle-command-overlay"
  | "toggle-dev-tools"
  | "toggle-disable-collisions"
  | "toggle-disable-death-ads"
  | "toggle-disable-fx"
  | "toggle-enemy-magnet"
  | "toggle-hide-players"
  | "toggle-infinite-range"
  | "toggle-lag-killer"
  | "toggle-options-panel"
  | "toggle-provoke-cell"
  | "toggle-script"
  | "toggle-skip-cutscenes"
  | "toggle-top-bar";

export type HotkeySectionId =
  | "application"
  | "general"
  | "options"
  | "packets"
  | "scripts"
  | "tools";

export type HotkeyItem = {
  configKey: string;
  defaultValue: string;
  id: HotkeyId;
  label: string;
  value?: string;
};

export type HotkeySection = {
  icon: string;
  id: HotkeySectionId;
  items: HotkeyItem[];
  name: HotkeySectionName;
};

type SectionData = {
  icon: string;
  id: HotkeySectionId;
  items: {
    defaultValue?: DefaultValue;
    id: HotkeyId;
    label: string;
  }[];
  name: HotkeySectionName;
};

type PlatformDefaultValue = {
  mac: string;
  other: string;
};

type DefaultValue = PlatformDefaultValue | string;

const SECTION_DATA: SectionData[] = [
  {
    id: "general",
    name: "General",
    icon: "general",
    items: [
      { id: "toggle-autoattack", label: "Toggle Autoattack" },
      {
        id: "toggle-bank",
        label: "Toggle Bank",
        defaultValue: { mac: "command+b", other: "ctrl+b" },
      },
      {
        id: "toggle-options-panel",
        label: "Toggle Options Panel",
        defaultValue: { mac: "command+,", other: "ctrl+," },
      },
      {
        id: "toggle-top-bar",
        label: "Toggle Top Bar",
        defaultValue: { mac: "command+shift+t", other: "ctrl+shift+t" },
      },
    ],
  },
  {
    id: "application",
    name: "Application",
    icon: "application",
    items: [
      {
        id: "open-environment",
        label: "Open Environment",
        defaultValue: { mac: "command+e", other: "ctrl+e" },
      },
    ],
  },
  {
    id: "scripts",
    name: "Scripts",
    icon: "scripts",
    items: [
      { id: "load-script", label: "Load Script" },
      { id: "toggle-script", label: "Toggle Script" },
      {
        id: "toggle-command-overlay",
        label: "Toggle Command Overlay",
        defaultValue: "`",
      },
      {
        id: "toggle-dev-tools",
        label: "Toggle Dev Tools",
        defaultValue: { mac: "command+shift+i", other: "ctrl+shift+i" },
      },
    ],
  },
  {
    id: "options",
    name: "Options",
    icon: "options",
    items: [
      {
        id: "toggle-infinite-range",
        label: "Toggle Infinite Range",
        defaultValue: "alt+i",
      },
      { id: "toggle-provoke-cell", label: "Toggle Provoke Cell" },
      { id: "toggle-enemy-magnet", label: "Toggle Enemy Magnet" },
      {
        id: "toggle-lag-killer",
        label: "Toggle Lag Killer",
        defaultValue: "alt+l",
      },
      { id: "toggle-hide-players", label: "Toggle Hide Players" },
      { id: "toggle-skip-cutscenes", label: "Toggle Skip Cutscenes" },
      { id: "toggle-disable-fx", label: "Toggle Disable FX" },
      { id: "toggle-disable-collisions", label: "Toggle Disable Collisions" },
      { id: "toggle-anti-counter", label: "Toggle Anti-Counter" },
      { id: "toggle-disable-death-ads", label: "Toggle Disable Death Ads" },
    ],
  },
  {
    id: "tools",
    name: "Tools",
    icon: "tools",
    items: [
      { id: "open-fast-travels", label: "Open Fast Travels" },
      { id: "open-loader-grabber", label: "Open Loader/Grabber" },
      { id: "open-follower", label: "Open Follower" },
    ],
  },
  {
    id: "packets",
    name: "Packets",
    icon: "packets",
    items: [
      { id: "open-packet-logger", label: "Open Packet Logger" },
      { id: "open-packet-spammer", label: "Open Packet Spammer" },
    ],
  },
];

function resolveDefaultValue(
  defaultValue: DefaultValue | undefined,
  platform: Platform,
): string {
  if (!defaultValue) return "";
  if (typeof defaultValue === "string") return defaultValue;
  return platform.isMac ? defaultValue.mac : defaultValue.other;
}

export function getHotkeySections(platform: Platform): HotkeySection[] {
  return SECTION_DATA.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      defaultValue: resolveDefaultValue(item.defaultValue, platform),
      configKey: `${section.name}.${item.label}`,
    })),
  }));
}

export function getHotkeyItems(platform: Platform): HotkeyItem[] {
  return getHotkeySections(platform).flatMap((section) => section.items);
}

export function getActionForHotkey(
  hotkey: string,
  sections: HotkeySection[],
): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.value === hotkey) return item.label;
    }
  }

  return null;
}

export type HotkeyConflict = {
  hotkey: string;
  labels: string[];
};

export function findConflicts(sections: HotkeySection[]): HotkeyConflict[] {
  const hotkeyToLabels: Record<string, string[]> = {};
  for (const section of sections) {
    for (const item of section.items) {
      if (!item.value) continue;
      hotkeyToLabels[item.value] ??= [];
      hotkeyToLabels[item.value]!.push(item.label);
    }
  }

  return Object.entries(hotkeyToLabels)
    .filter(([_, labels]) => labels.length > 1)
    .map(([hotkey, labels]) => ({ hotkey, labels }));
}

export function createDefaultHotkeyConfig(platform: Platform): HotkeyConfig {
  const sections = getHotkeySections(platform);
  const config: HotkeyConfigPrimitive = {};
  for (const section of sections) {
    const sectionKey = section.name;
    const sectionConfig: Record<string, string> = {};
    for (const item of section.items)
      sectionConfig[item.label] = item.defaultValue;
    config[sectionKey] = sectionConfig;
  }

  return config;
}

type HotkeyConfigPrimitive = Record<string, Record<string, string>>;
