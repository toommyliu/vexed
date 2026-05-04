import { createHotkey } from "@tanstack/solid-hotkeys";
import type { RegisterableHotkey } from "@tanstack/solid-hotkeys";
import { For, Show, type Accessor, type JSX } from "solid-js";
import type { HotkeyBindings } from "../../../shared/hotkeys";
import type { GameCommand } from "./commands";

function GameHotkeyRegistration(props: {
  readonly command: GameCommand;
}): JSX.Element {
  createHotkey(
    () => props.command.hotkey() as RegisterableHotkey,
    (event) => {
      if (event.repeat) {
        return;
      }

      props.command.run();
    },
    () => ({
      enabled: props.command.enabled() && props.command.hotkey() !== "",
      preventDefault: true,
      stopPropagation: true,
      eventType: "keydown",
      conflictBehavior: "replace",
    }),
  );

  return null;
}

export function GameHotkeys(props: {
  readonly commands: Accessor<readonly GameCommand[]>;
  readonly bindings: Accessor<HotkeyBindings>;
}): JSX.Element {
  return (
    <For each={props.commands()}>
      {(command) => (
        <Show when={props.bindings()[command.id] ?? command.hotkey()}>
          <GameHotkeyRegistration command={command} />
        </Show>
      )}
    </For>
  );
}
