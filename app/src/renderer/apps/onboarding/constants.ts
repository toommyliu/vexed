// import { COLOR_THEME_TOKENS } from "~/shared/settings/normalize";
import type { ThemeToken } from "~/shared/settings/types";

const TOKEN_LABELS: Record<ThemeToken, string> = {
  accent: "Accent",
  "accent-foreground": "Accent Text",
  background: "Background",
  border: "Border",
  card: "Card",
  "card-foreground": "Card Text",
  foreground: "Foreground",
  muted: "Muted",
  "muted-foreground": "Muted Text",
  popover: "Popover",
  "popover-foreground": "Popover Text",
  primary: "Primary",
  "primary-foreground": "Primary Text",
  ring: "Ring",
  secondary: "Secondary",
  "secondary-foreground": "Secondary Text",
};

// Display order for the tokens in the editor
export const COLOR_TOKENS: { key: ThemeToken; label: string }[] = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "ring",
].map((key) => ({
  key: key as ThemeToken,
  label: TOKEN_LABELS[key as ThemeToken],
}));

// if (process.env["NODE_ENV"] !== "production") {
//   const covered = new Set(COLOR_TOKENS.map((token) => token.key));
//   for (const token of COLOR_THEME_TOKENS) {
//     if (!covered.has(token))
//       console.warn(
//         `TOKEN_LABELS covers '${token}' but it is missing from the COLOR_TOKENS display order.`,
//       );
//   }
// }
