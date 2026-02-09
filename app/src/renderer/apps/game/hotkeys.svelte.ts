import Mousetrap from "mousetrap";
import { handlers } from "~/shared/tipc";
import { appState, hotkeyState } from "./state/index.svelte";
import {
  createHotkeyConfig,
  isValidHotkey,
} from "~/renderer/views/hotkeys/utils";
import { Bot } from "./lib/Bot";
import { executeAction } from "./actions";

const bot = Bot.getInstance();

function setupHotkeyBindings() {
  Mousetrap.reset();

  for (const section of createHotkeyConfig()) {
    for (const item of section.items) {
      const hotkey = hotkeyState.getDisplayValue(item.id);
      if (!hotkey || !isValidHotkey(hotkey)) continue;

      console.log(`setting up hotkey for ${item.id}: ${hotkey}`);

      Mousetrap.bind(hotkey, (ev) => {
        // Prevent hotkeys from triggering if any text field is focused
        if (bot.flash.call(() => swf.isTextFieldFocused())) return;
        ev.preventDefault();
        executeAction(item.id);
      });
    }
  }
}

async function initHotkeys() {
  await hotkeyState.load();
  setupHotkeyBindings();
}

handlers.hotkeys.update.handle(async () => {
  await initHotkeys();
});

handlers.hotkeys.reload.handle(async () => {
  await initHotkeys();
});

$effect.root(() => {
  $effect(() => {
    if (appState.gameLoaded) {
      console.log("gameLoaded reactive trigger");
      void initHotkeys();
    }
  });
});
