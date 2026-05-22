import { createHotkey } from "@tanstack/solid-hotkeys";
import type { RegisterableHotkey } from "@tanstack/solid-hotkeys";
import { For, Show, type Accessor, type JSX } from "solid-js";
import type { GameCommand } from "./commands";

function GameHotkeyRegistration(props: {
  readonly command: GameCommand;
  readonly onCommandRun?: ((command: GameCommand) => void) | undefined;
}): JSX.Element {
  createHotkey(
    () => props.command.hotkey() as RegisterableHotkey,
    (event) => {
      if (event.repeat) {
        return;
      }

      props.command.run();
      props.onCommandRun?.(props.command);
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
  readonly onCommandRun?: ((command: GameCommand) => void) | undefined;
}): JSX.Element {
  return (
    <For each={props.commands()}>
      {(command) => (
        <Show when={command.hotkey()}>
          <GameHotkeyRegistration
            command={command}
            onCommandRun={props.onCommandRun}
          />
        </Show>
      )}
    </For>
  );
}
