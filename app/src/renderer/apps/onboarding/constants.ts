import type { ThemeColorToken } from "~/shared/settings/types";

export const COLOR_TOKENS: { key: ThemeColorToken; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "card", label: "Card" },
  { key: "card-foreground", label: "Card Text" },
  { key: "popover", label: "Popover" },
  { key: "popover-foreground", label: "Popover Text" },
  { key: "primary", label: "Primary" },
  { key: "primary-foreground", label: "Primary Text" },
  { key: "secondary", label: "Secondary" },
  { key: "secondary-foreground", label: "Secondary Text" },
  { key: "muted", label: "Muted" },
  { key: "muted-foreground", label: "Muted Text" },
  { key: "accent", label: "Accent" },
  { key: "accent-foreground", label: "Accent Text" },
  { key: "border", label: "Border" },
  { key: "ring", label: "Ring" },
];
