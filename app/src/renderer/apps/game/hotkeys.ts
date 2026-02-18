import Mousetrap from "mousetrap";
import { isValidHotkey } from "~/shared/hotkeys/input";
import { HOTKEY_SECTIONS } from "~/shared/hotkeys/schema";
import { handlers } from "~/shared/tipc";
import { executeAction } from "./actions";
import { Bot } from "./lib/Bot";
import { gameLoaded } from "./state/app.svelte";
import { hotkeyState } from "./state/index.svelte";

const bot = Bot.getInstance();

function setupHotkeyBindings() {
  Mousetrap.reset();

  for (const section of HOTKEY_SECTIONS) {
    for (const item of section.items) {
      const hotkey = hotkeyState.getDisplayValue(item.id);
      if (!hotkey || !isValidHotkey(hotkey)) continue;
      Mousetrap.bind(hotkey, (ev) => {
        // Prevent hotkeys from triggering if any text field is focused
        if (bot.flash.call(() => swf.isTextFieldFocused())) return;
        // TODO: prevent hotkeys in <input>, etc...
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

gameLoaded.subscribe(async () => {
  await initHotkeys();
});
