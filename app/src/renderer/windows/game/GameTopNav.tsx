import {
  For,
  Show,
  createSignal,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js";
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
  MenuTrigger,
  cn,
} from "@vexed/ui";
import { gameWindowGroups, type WindowId } from "../../../shared/windows";

type OpenMenu =
  | "windows"
  | "scripts"
  | "options"
  | "relogin"
  | "pads"
  | "cells";

const defaultPads = [
  "Center",
  "Spawn",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Up",
  "Down",
] as const;

const placeholderCells = ["Enter"] as const;

export interface TopNavOptionItem {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onSelect: () => void;
}

export interface GameTopNavProps {
  readonly autoAttackEnabled: Accessor<boolean>;
  readonly setAutoAttackEnabled: Setter<boolean>;
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
  readonly autoReloginDelayMs: Accessor<string>;
  readonly setAutoReloginDelayMs: Setter<string>;
  readonly autoReloginUsername: Accessor<string>;
  readonly autoReloginServer: Accessor<string>;
  readonly autoReloginLastError: Accessor<string>;
  readonly handleCaptureAutoReloginSession: () => void;
  readonly handleToggleAutoRelogin: () => void;
  readonly handleSetAutoReloginDelay: () => void;
}

export function GameTopNav(props: GameTopNavProps): JSX.Element {
  const [openMenu, setOpenMenu] = createSignal<OpenMenu | null>(null);

  const setMenuOpen =
    (menu: OpenMenu) =>
    (details: { readonly open: boolean }): void => {
      setOpenMenu(details.open ? menu : null);
    };

  const toggleMenu =
    (menu: OpenMenu): JSX.EventHandler<HTMLButtonElement, MouseEvent> =>
    (event) => {
      event.preventDefault();
      setOpenMenu((current) => (current === menu ? null : menu));
    };

  const openWindow = (id: WindowId) => {
    void window.ipc.windows.open(id).catch((error: unknown) => {
      console.error(`Failed to open window ${id}:`, error);
    });
    setOpenMenu(null);
  };

  return (
    <div id="topnav-container" class="game-topnav-container">
      <nav id="topnav" class="game-topnav" aria-label="Game controls">
        <div class="game-topnav__left">
          <Menu
            open={openMenu() === "windows"}
            onOpenChange={setMenuOpen("windows")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={openMenu() === "windows" ? "" : undefined}
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
            open={openMenu() === "scripts"}
            onOpenChange={setMenuOpen("scripts")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={openMenu() === "scripts" ? "" : undefined}
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
                  <Kbd>Cmd/Ctrl+O</Kbd>
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
                  <Kbd>Cmd/Ctrl+Shift+X</Kbd>
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
            open={openMenu() === "options"}
            onOpenChange={setMenuOpen("options")}
          >
            <MenuTrigger
              class="game-topnav__trigger"
              data-expanded={openMenu() === "options" ? "" : undefined}
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
                      onClick={option.onSelect}
                      value={option.id}
                    >
                      {option.label}
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
            open={openMenu() === "relogin"}
            onOpenChange={setMenuOpen("relogin")}
          >
            <MenuTrigger
              class={cn(
                "game-topnav__trigger",
                props.autoReloginEnabled() && "game-topnav__trigger--success",
              )}
              data-expanded={openMenu() === "relogin" ? "" : undefined}
              onClick={toggleMenu("relogin")}
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
                  !props.autoReloginCaptured() && !props.autoReloginEnabled()
                }
                onSelect={props.handleToggleAutoRelogin}
                value="toggle-autorelogin"
                variant={props.autoReloginEnabled() ? "destructive" : "default"}
              >
                {props.autoReloginEnabled() ? "Disable" : "Enable"}
              </MenuItem>
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
            onChange={(event) =>
              props.setAutoAttackEnabled(event.currentTarget.checked)
            }
          >
            Auto
          </Checkbox>

          <div class="game-topnav__divider" />

          <Menu open={openMenu() === "pads"} onOpenChange={setMenuOpen("pads")}>
            <MenuTrigger class="game-topnav__select-trigger" disabled>
              Spawn
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--compact" portal={false}>
              <For each={defaultPads}>
                {(pad) => (
                  <MenuItem class="game-menu__item" disabled value={pad}>
                    {pad}
                  </MenuItem>
                )}
              </For>
            </MenuContent>
          </Menu>

          <Menu
            open={openMenu() === "cells"}
            onOpenChange={setMenuOpen("cells")}
          >
            <MenuTrigger
              class="game-topnav__select-trigger game-topnav__select-trigger--cell"
              disabled
            >
              Enter
            </MenuTrigger>
            <MenuContent class="game-menu game-menu--compact" portal={false}>
              <For each={placeholderCells}>
                {(cell) => (
                  <MenuItem class="game-menu__item" disabled value={cell}>
                    {cell}
                  </MenuItem>
                )}
              </For>
            </MenuContent>
          </Menu>

          <div class="game-topnav__divider" />

          <Button
            class="game-topnav__button"
            disabled
            size="xs"
            variant="ghost"
          >
            Bank
          </Button>
        </div>
      </nav>
    </div>
  );
}
