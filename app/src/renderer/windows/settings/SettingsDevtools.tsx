import { TanStackDevtools } from "@tanstack/solid-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/solid-hotkeys-devtools";

export default function SettingsDevtools() {
  return <TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />;
}
