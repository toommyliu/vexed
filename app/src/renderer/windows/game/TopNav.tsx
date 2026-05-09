import { For, Show, type Accessor, type JSX, type Setter } from "solid-js";
import { formatOptionalHotkeyDisplay } from "@vexed/shared/hotkeyDisplay";
import {
  Button,
  Checkbox,
  Input,
  Kbd,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  cn,
} from "@vexed/ui";
import {
  getCommandDefinition,
  type GameCommandId,
} from "../../../shared/commands";
import type { HotkeyBindings } from "../../../shared/hotkeys";
import type { AppPlatform } from "../../../shared/ipc";
import {
  WindowIds,
  gameWindowGroups,
  type WindowId,
} from "../../../shared/windows";
import {
  getTopNavOptionCommandId,
  type GameTopNavMenu,
  type TopNavOptionItem,
} from "./topNavOptions";

export interface TopNavProps {
  readonly openMenu: Accessor<GameTopNavMenu | null>;
  readonly setOpenMenu: Setter<GameTopNavMenu | null>;
  readonly hotkeyBindings: Accessor<HotkeyBindings>;
  readonly hotkeyPlatform: AppPlatform;
  readonly autoAttackEnabled: Accessor<boolean>;
  readonly setAutoAttackEnabled: Setter<boolean>;
  readonly gameLoaded: Accessor<boolean>;
  readonly playerLoggedIn: Accessor<boolean>;
  readonly scriptLoaded: Accessor<boolean>;
  readonly scriptRunning: Accessor<boolean>;
  readonly scriptStatus: Accessor<string>;
  readonly scriptCommandCount: Accessor<number>;
  readonly scriptDiagnosticsCount: Accessor<number>;
  readonly loadScript: () => void | Promise<void>;
  readonly startScript: () => void;
  readonly stopScript: () => void;
  readonly optionItems: Accessor<readonly TopNavOptionItem[]>;
  readonly walkSpeed: Accessor<string>;
  readonly setWalkSpeed: Setter<string>;
  readonly handleSetWalkSpeed: () => void;
  readonly frameRate: Accessor<string>;
  readonly setFrameRate: Setter<string>;
  readonly handleSetFrameRate: () => void;
  readonly customName: Accessor<string>;
  readonly setCustomName: Setter<string>;
  readonly handleSetCustomName: () => void;
  readonly customGuild: Accessor<string>;
  readonly setCustomGuild: Setter<string>;
  readonly handleSetCustomGuild: () => void;
  readonly autoReloginEnabled: Accessor<boolean>;
  readonly autoReloginCaptured: Accessor<boolean>;
  readonly autoReloginAttempting: Accessor<boolean>;
  readonly autoReloginToggling: Accessor<boolean>;
  readonly autoReloginDelayMs: Accessor<string>;
  readonly setAutoReloginDelayMs: Setter<string>;
  readonly autoReloginUsername: Accessor<string>;
  readonly autoReloginServer: Accessor<string>;
  readonly autoReloginServers: Accessor<readonly string[]>;
  readonly autoReloginLastError: Accessor<string>;
  readonly handleCaptureAutoReloginSession: () => void;
  readonly handleToggleAutoRelogin: () => void;
  readonly handleRefreshAutoReloginServers: () => void;
  readonly handleSelectAutoReloginServer: (serverName: string) => void;
  readonly handleSetAutoReloginDelay: () => void;
  readonly cells: Accessor<readonly string[]>;
  readonly pads: Accessor<readonly string[]>;
  readonly validPads: Accessor<readonly string[]>;
  readonly selectedCell: Accessor<string>;
  readonly selectedPad: Accessor<string>;
  readonly travelBusy: Accessor<boolean>;
  readonly handleRefreshTravelOptions: () => void;
  readonly handleSelectCell: (cell: string) => void;
  readonly handleSelectPad: (pad: string) => void;
  readonly handleOpenBank: () => void;
}

const commandHotkey = (bindings: HotkeyBindings, id: GameCommandId): string =>
  bindings[id] ?? getCommandDefinition(id).defaultHotkey;

const optionHotkey = (bindings: HotkeyBindings, optionId: string): string => {
  const commandId = getTopNavOptionCommandId(optionId);
  return commandId ? commandHotkey(bindings, commandId) : "";
};

const windowCommandIds: Partial<Record<WindowId, GameCommandId>> = {
  [WindowIds.Environment]: "open-environment",
  [WindowIds.FastTravels]: "open-fast-travels",
  [WindowIds.LoaderGrabber]: "open-loader-grabber",
  [WindowIds.Follower]: "open-follower",
  [WindowIds.PacketLogger]: "open-packet-logger",
  [WindowIds.PacketSpammer]: "open-packet-spammer",
};

const windowHotkey = (bindings: HotkeyBindings, id: WindowId): string => {
  const commandId = windowCommandIds[id];
  return commandId ? commandHotkey(bindings, commandId) : "";
};

export function TopNav(props: TopNavProps): JSX.Element {
  const setMenuOpen =
    (menu: GameTopNavMenu) =>
    (details: { readonly open: boolean }): void => {
      props.setOpenMenu(details.open ? menu : null);
    };

  const toggleMenu =
    (menu: GameTopNavMenu): JSX.EventHandler<HTMLButtonElement, MouseEvent> =>
    (event) => {
      event.preventDefault();
      props.setOpenMenu((current) => (current === menu ? null : menu));
    };

  const openWindow = (id: WindowId) => {
    void window.ipc.windows.open(id).catch((error: unknown) => {
      console.error(`Failed to open window ${id}:`, error);
    });
    props.setOpenMenu(null);
  };

  const toggleTravelMenu =
    (menu: "pads" | "cells"): JSX.EventHandler<HTMLButtonElement, MouseEvent> =>
    (event) => {
      props.handleRefreshTravelOptions();
      toggleMenu(menu)(event);
    };

  const travelDisabled = () =>
    !props.gameLoaded() || !props.playerLoggedIn() || props.travelBusy();

  const isValidPad = (pad: string) =>
    props
      .validPads()
      .some((validPad) => validPad.toLowerCase() === pad.toLowerCase());

  const clickOption =
    (option: TopNavOptionItem): JSX.EventHandler<HTMLDivElement, MouseEvent> =>
    () => {
      option.onSelect();
    };

  return (
    <div id="topnav-container" class="game-topnav-container">
      <nav id="topnav" class="game-topnav" aria-label="Game controls">
        <div class="game-topnav__left">
          <Menu
            open={props.openMenu() === "windows"}
            onOpenChange={setMenuOpen("windows")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={props.openMenu() === "windows" ? "" : undefined}
              onClick={toggleMenu("windows")}
            >
              Windows
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--mega" portal={false}>
              <div class="game-menu__mega-grid">
                <For each={gameWindowGroups}>
                  {(group) => (
                    <MenuGroup class="game-menu__group">
                      <MenuLabel>{group.name}</MenuLabel>
                      <For each={group.items}>
                        {(item) => (
                          <MenuItem
                            class="game-menu__item"
                            onSelect={() => openWindow(item.id)}
                            value={item.id}
                          >
                            <span class="game-menu__item-label">
                              {item.label}
                            </span>
                            <Show
                              when={formatOptionalHotkeyDisplay(
                                windowHotkey(props.hotkeyBindings(), item.id),
                                props.hotkeyPlatform,
                              )}
                            >
                              {(shortcut) => <Kbd>{shortcut()}</Kbd>}
                            </Show>
                          </MenuItem>
                        )}
                      </For>
                    </MenuGroup>
                  )}
                </For>
              </div>
            </MenuContent>
          </Menu>

          <div class="game-topnav__divider" />

          <Menu
            open={props.openMenu() === "scripts"}
            onOpenChange={setMenuOpen("scripts")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={props.openMenu() === "scripts" ? "" : undefined}
              onClick={toggleMenu("scripts")}
            >
              Scripts
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--scripts" portal={false}>
              <MenuGroup>
                <MenuItem
                  class="game-menu__item"
                  onSelect={() => void props.loadScript()}
                  value="load-script"
                >
                  <span class="game-menu__item-label">Load Script</span>
                  <Show
                    when={formatOptionalHotkeyDisplay(
                      commandHotkey(props.hotkeyBindings(), "load-script"),
                      props.hotkeyPlatform,
                    )}
                  >
                    {(shortcut) => <Kbd>{shortcut()}</Kbd>}
                  </Show>
                </MenuItem>
                <MenuItem
                  class="game-menu__item"
                  disabled={!props.scriptLoaded() || props.scriptRunning()}
                  onSelect={props.startScript}
                  value="start-script"
                >
                  <span class="game-menu__item-label">Start</span>
                </MenuItem>
                <MenuItem
                  class="game-menu__item"
                  disabled={!props.scriptRunning()}
                  onSelect={props.stopScript}
                  value="stop-script"
                  variant="destructive"
                >
                  <span class="game-menu__item-label">Stop</span>
                  <Show
                    when={formatOptionalHotkeyDisplay(
                      commandHotkey(props.hotkeyBindings(), "stop-script"),
                      props.hotkeyPlatform,
                    )}
                  >
                    {(shortcut) => <Kbd>{shortcut()}</Kbd>}
                  </Show>
                </MenuItem>
              </MenuGroup>
              <MenuSeparator />
              <div class="game-menu__status">
                <span>{props.scriptStatus()}</span>
                <span>{props.scriptCommandCount()} commands</span>
                <Show when={props.scriptDiagnosticsCount() > 0}>
                  <span>{props.scriptDiagnosticsCount()} diagnostics</span>
                </Show>
              </div>
            </MenuContent>
          </Menu>

          <Menu
            open={props.openMenu() === "options"}
            onOpenChange={setMenuOpen("options")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={props.openMenu() === "options" ? "" : undefined}
              onClick={toggleMenu("options")}
            >
              Options
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--options" portal={false}>
              <div class="game-options-grid">
                <For each={props.optionItems()}>
                  {(option) => (
                    <MenuCheckboxItem
                      checked={option.checked}
                      class="game-menu__item"
                      closeOnSelect={false}
                      onClick={clickOption(option)}
                      value={option.id}
                    >
                      <span class="game-menu__option-content">
                        <span class="game-menu__item-label">
                          {option.label}
                        </span>
                        <Show
                          when={formatOptionalHotkeyDisplay(
                            optionHotkey(props.hotkeyBindings(), option.id),
                            props.hotkeyPlatform,
                          )}
                        >
                          {(shortcut) => <Kbd>{shortcut()}</Kbd>}
                        </Show>
                      </span>
                    </MenuCheckboxItem>
                  )}
                </For>
              </div>
              <MenuSeparator />
              <div class="game-menu__fields">
                <label class="game-menu__field">
                  <span>Walk Speed</span>
                  <Input
                    size="sm"
                    value={props.walkSpeed()}
                    onBlur={props.handleSetWalkSpeed}
                    onInput={(event) =>
                      props.setWalkSpeed(event.currentTarget.value)
                    }
                  />
                </label>
                <label class="game-menu__field">
                  <span>FPS</span>
                  <Input
                    size="sm"
                    value={props.frameRate()}
                    onBlur={props.handleSetFrameRate}
                    onInput={(event) =>
                      props.setFrameRate(event.currentTarget.value)
                    }
                  />
                </label>
                <label class="game-menu__field game-menu__field--wide">
                  <span>Custom Name</span>
                  <Input
                    size="sm"
                    value={props.customName()}
                    onBlur={props.handleSetCustomName}
                    onInput={(event) =>
                      props.setCustomName(event.currentTarget.value)
                    }
                  />
                </label>
                <label class="game-menu__field game-menu__field--wide">
                  <span>Custom Guild</span>
                  <Input
                    size="sm"
                    value={props.customGuild()}
                    onBlur={props.handleSetCustomGuild}
                    onInput={(event) =>
                      props.setCustomGuild(event.currentTarget.value)
                    }
                  />
                </label>
              </div>
            </MenuContent>
          </Menu>

          <Menu
            open={props.openMenu() === "relogin"}
            onOpenChange={setMenuOpen("relogin")}
          >
            <MenuTrigger
              class={cn(
                "game-topnav__trigger",
                props.autoReloginEnabled() && "game-topnav__trigger--success",
              )}
              data-expanded={props.openMenu() === "relogin" ? "" : undefined}
              onClick={(event) => {
                props.handleRefreshAutoReloginServers();
                toggleMenu("relogin")(event);
              }}
            >
              Auto Relogin
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--relogin" portal={false}>
              <div class="game-menu__status">
                <span>
                  {props.autoReloginCaptured()
                    ? `${props.autoReloginUsername() || "Captured user"}${
                        props.autoReloginServer()
                          ? ` @ ${props.autoReloginServer()}`
                          : ""
                      }`
                    : "No captured session"}
                </span>
                <Show when={props.autoReloginToggling()}>
                  <span>
                    {props.autoReloginEnabled() ? "Enabling" : "Disabling"}
                  </span>
                </Show>
                <Show when={props.autoReloginAttempting()}>
                  <span>Attempting reconnect</span>
                </Show>
                <Show when={props.autoReloginLastError()}>
                  {(error) => <span class="game-menu__error">{error()}</span>}
                </Show>
              </div>
              <MenuSeparator />
              <MenuItem
                class="game-menu__item"
                onSelect={props.handleCaptureAutoReloginSession}
                value="capture-session"
              >
                Capture Current Session
              </MenuItem>
              <MenuItem
                class="game-menu__item"
                disabled={
                  props.autoReloginToggling() ||
                  (!props.autoReloginCaptured() && !props.autoReloginEnabled())
                }
                onSelect={props.handleToggleAutoRelogin}
                value="toggle-autorelogin"
                variant={props.autoReloginEnabled() ? "destructive" : "default"}
              >
                {props.autoReloginToggling()
                  ? props.autoReloginEnabled()
                    ? "Enabling…"
                    : "Disabling…"
                  : props.autoReloginEnabled()
                    ? "Disable"
                    : "Enable"}
              </MenuItem>
              <MenuSeparator />
              <MenuSub positioning={{ gutter: 4, placement: "right-start" }}>
                <MenuSubTrigger
                  class="game-menu__item"
                  value="autorelogin-server-menu"
                >
                  <span class="game-menu__item-label">Target Server</span>
                  <span>{props.autoReloginServer() || "None"}</span>
                </MenuSubTrigger>
                <MenuSubContent
                  class="game-menu game-menu--compact"
                  portal={false}
                >
                  <Show
                    when={props.autoReloginServers().length > 0}
                    fallback={
                      <MenuItem
                        class="game-menu__item"
                        disabled
                        value="no-servers"
                      >
                        No servers found
                      </MenuItem>
                    }
                  >
                    <For each={props.autoReloginServers()}>
                      {(serverName) => (
                        <MenuItem
                          class="game-menu__item"
                          disabled={!props.autoReloginCaptured()}
                          onSelect={() =>
                            props.handleSelectAutoReloginServer(serverName)
                          }
                          value={`autorelogin-server-${serverName}`}
                        >
                          <span class="game-menu__item-label">
                            {serverName}
                          </span>
                          <Show when={props.autoReloginServer() === serverName}>
                            <span>Current</span>
                          </Show>
                        </MenuItem>
                      )}
                    </For>
                  </Show>
                </MenuSubContent>
              </MenuSub>
              <MenuSeparator />
              <label class="game-menu__field">
                <span>Delay ms</span>
                <Input
                  size="sm"
                  value={props.autoReloginDelayMs()}
                  onBlur={props.handleSetAutoReloginDelay}
                  onInput={(event) =>
                    props.setAutoReloginDelayMs(event.currentTarget.value)
                  }
                />
              </label>
            </MenuContent>
          </Menu>

          <Button
            class={cn(
              "game-topnav__button",
              props.scriptRunning() && "game-topnav__button--danger",
              props.scriptLoaded() &&
                !props.scriptRunning() &&
                "game-topnav__button--success",
            )}
            disabled={!props.scriptLoaded()}
            onClick={
              props.scriptRunning() ? props.stopScript : props.startScript
            }
            size="xs"
            variant="ghost"
          >
            {props.scriptRunning() ? "Stop" : "Start"}
          </Button>
        </div>

        <div class="game-topnav__right">
          <Checkbox
            checked={props.autoAttackEnabled()}
            disabled={!props.gameLoaded() || !props.playerLoggedIn()}
            onChange={(event) =>
              props.setAutoAttackEnabled(event.currentTarget.checked)
            }
          >
            Auto
          </Checkbox>

          <div class="game-topnav__divider" />

          <Menu
            open={props.openMenu() === "pads"}
            onOpenChange={setMenuOpen("pads")}
          >
            <MenuTrigger
              class="game-topnav__select-trigger"
              data-expanded={props.openMenu() === "pads" ? "" : undefined}
              disabled={travelDisabled()}
              onClick={toggleTravelMenu("pads")}
              title="Jump to the selected pad"
            >
              {props.selectedPad() || "Pad"}
            </MenuTrigger>
            <MenuContent
              class="game-menu game-menu--compact game-menu--pads"
              portal={false}
            >
              <Show
                when={props.pads().length > 0}
                fallback={
                  <MenuItem class="game-menu__item" disabled value="no-pads">
                    No pads found
                  </MenuItem>
                }
              >
                <For each={props.pads()}>
                  {(pad) => (
                    <MenuItem
                      class={cn(
                        "game-menu__item game-menu__pad-option",
                        isValidPad(pad) && "game-menu__pad-option--valid",
                      )}
                      onSelect={() => props.handleSelectPad(pad)}
                      value={pad}
                    >
                      <span class="game-menu__pad-name">{pad}</span>
                    </MenuItem>
                  )}
                </For>
              </Show>
            </MenuContent>
          </Menu>

          <Menu
            open={props.openMenu() === "cells"}
            onOpenChange={setMenuOpen("cells")}
          >
            <MenuTrigger
              class="game-topnav__select-trigger game-topnav__select-trigger--cell"
              data-expanded={props.openMenu() === "cells" ? "" : undefined}
              disabled={travelDisabled()}
              onClick={toggleTravelMenu("cells")}
              title="Jump to the selected cell"
            >
              {props.selectedCell() || "Cell"}
            </MenuTrigger>
            <MenuContent
              class="game-menu game-menu--compact game-menu--cells"
              portal={false}
            >
              <Show
                when={props.cells().length > 0}
                fallback={
                  <MenuItem class="game-menu__item" disabled value="no-cells">
                    No cells found
                  </MenuItem>
                }
              >
                <For each={props.cells()}>
                  {(cell) => (
                    <MenuItem
                      class="game-menu__item"
                      onSelect={() => props.handleSelectCell(cell)}
                      value={cell}
                    >
                      {cell}
                    </MenuItem>
                  )}
                </For>
              </Show>
            </MenuContent>
          </Menu>

          <div class="game-topnav__divider" />

          <Button
            class="game-topnav__button"
            disabled={!props.gameLoaded() || !props.playerLoggedIn()}
            onClick={props.handleOpenBank}
            size="xs"
            title="Open bank"
            variant="ghost"
          >
            Bank
          </Button>
        </div>
      </nav>
    </div>
  );
}
