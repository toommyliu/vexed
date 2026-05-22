import {
  createEffect,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  splitProps,
  Switch,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js";
import { ChevronDown, CircleAlert, Clock, LoaderCircle } from "lucide-solid";
import { formatOptionalHotkeyDisplay } from "@vexed/shared/hotkeyDisplay";
import type {
  CombatProfile,
  CombatProfileAutoAttackMode,
} from "../../../shared/combat-profiles";
import {
  Button,
  type ButtonProps,
  Input,
  Kbd,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  cn,
} from "@vexed/ui";
import type { GameCommandId } from "../../../shared/commands";
import {
  readHotkeyBinding,
  type HotkeyBindings,
} from "../../../shared/hotkeys";
import type { AppPlatform } from "../../../shared/ipc";
import {
  WindowIds,
  gameWindowGroups,
  type WindowId,
} from "../../../shared/windows";
import {
  AUTO_ZONE_MAP_OPTIONS,
  type AutoZoneSupportedMap,
} from "./features/Services/AutoZone";
import {
  getTopNavOptionCommandId,
  type GameTopNavMenu,
  type TopNavOptionItem,
} from "./topNavOptions";

export interface TopNavOptionsMenuContentProps {
  readonly hotkeyBindings: Accessor<HotkeyBindings>;
  readonly hotkeyPlatform: AppPlatform;
  readonly gameLoaded: Accessor<boolean>;
  readonly playerReady: Accessor<boolean>;
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
}

export interface TopNavProps extends TopNavOptionsMenuContentProps {
  readonly openMenu: Accessor<GameTopNavMenu | null>;
  readonly setOpenMenu: Setter<GameTopNavMenu | null>;
  readonly autoAttackEnabled: Accessor<boolean>;
  readonly autoAttackProfileLabel: Accessor<string>;
  readonly autoAttackConfiguredProfileLabel: Accessor<string>;
  readonly autoAttackLastError: Accessor<string>;
  readonly combatProfiles: Accessor<readonly CombatProfile[]>;
  readonly autoAttackMode: Accessor<CombatProfileAutoAttackMode>;
  readonly selectedAutoAttackProfileId: Accessor<string | undefined>;
  readonly handleToggleAutoAttack: () => void;
  readonly handleSelectAutoAttackProfile: (
    mode: CombatProfileAutoAttackMode,
    selectedProfileId?: string,
  ) => void;
  readonly scriptLoaded: Accessor<boolean>;
  readonly scriptRunning: Accessor<boolean>;
  readonly scriptStatus: Accessor<string>;
  readonly scriptDiagnosticsCount: Accessor<number>;
  readonly loadScript: () => void | Promise<void>;
  readonly startScript: () => void;
  readonly stopScript: () => void;
  readonly autoZoneEnabled: Accessor<boolean>;
  readonly autoZoneMap: Accessor<AutoZoneSupportedMap | undefined>;
  readonly handleToggleAutoZone: () => void;
  readonly handleSelectAutoZoneMap: (
    map: AutoZoneSupportedMap | undefined,
  ) => void;
  readonly autoReloginEnabled: Accessor<boolean>;
  readonly autoReloginCaptured: Accessor<boolean>;
  readonly autoReloginAttempting: Accessor<boolean>;
  readonly autoReloginWaitingDelay: Accessor<boolean>;
  readonly autoReloginToggling: Accessor<boolean>;
  readonly autoReloginDelaySeconds: Accessor<string>;
  readonly setAutoReloginDelaySeconds: Setter<string>;
  readonly autoReloginServer: Accessor<string>;
  readonly autoReloginServers: Accessor<readonly string[]>;
  readonly autoReloginLastError: Accessor<string>;
  readonly autoReloginAttemptsRemaining: Accessor<number | null>;
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
  readHotkeyBinding(bindings, id);

const optionHotkey = (bindings: HotkeyBindings, optionId: string): string => {
  const commandId = getTopNavOptionCommandId(optionId);
  return commandId ? commandHotkey(bindings, commandId) : "";
};

const windowCommandIds: Partial<Record<WindowId, GameCommandId>> = {
  [WindowIds.Environment]: "openEnvironment",
  [WindowIds.FastTravels]: "openFastTravels",
  [WindowIds.LoaderGrabber]: "openLoaderGrabber",
  [WindowIds.Follower]: "openFollower",
  [WindowIds.PacketLogger]: "openPacketLogger",
  [WindowIds.PacketSpammer]: "openPacketSpammer",
};

const windowHotkey = (bindings: HotkeyBindings, id: WindowId): string => {
  const commandId = windowCommandIds[id];
  return commandId ? commandHotkey(bindings, commandId) : "";
};

const getAutoZoneMapLabel = (map: AutoZoneSupportedMap | undefined): string =>
  map === undefined
    ? ""
    : (AUTO_ZONE_MAP_OPTIONS.find((option) => option.value === map)?.label ??
      map);

const MenuAutofocusAnchor = (): JSX.Element => (
  <span
    aria-hidden="true"
    class="game-menu__autofocus-anchor"
    data-autofocus=""
    tabIndex={-1}
  />
);

type TopNavMenuTriggerProps = Omit<ButtonProps, "as" | "size" | "type"> & {
  readonly expanded?: boolean;
};

function TopNavMenuTrigger(props: TopNavMenuTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "expanded",
    "variant",
  ]);

  return (
    <MenuTrigger
      asChild={(triggerProps) => (
        <Button
          {...(triggerProps({
            ...rest,
            children: local.children,
            class: cn("game-topnav__trigger", local.class),
            "data-expanded": local.expanded ? "" : undefined,
            size: "sm",
            type: "button",
            variant: local.variant ?? "ghost",
          } as ButtonProps) as ButtonProps)}
        />
      )}
    />
  );
}

export function TopNavOptionsMenuContent(
  props: TopNavOptionsMenuContentProps,
): JSX.Element {
  const gameInteractionDisabled = () =>
    !props.gameLoaded() || !props.playerReady();

  const clickOption =
    (option: TopNavOptionItem): JSX.EventHandler<HTMLDivElement, MouseEvent> =>
    () => {
      if (option.disabled) {
        return;
      }
      option.onSelect();
    };

  const stopMenuInputKeyPropagation: JSX.EventHandler<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    if (event.key !== "Escape" && event.key !== "Tab") {
      event.stopPropagation();
    }
  };

  return (
    <>
      <MenuAutofocusAnchor />
      <div class="game-options-grid">
        <For each={props.optionItems()}>
          {(option) => (
            <MenuCheckboxItem
              checked={option.checked}
              class="game-menu__item"
              closeOnSelect={false}
              disabled={option.disabled}
              onClick={clickOption(option)}
              value={option.id}
            >
              <span class="game-menu__option-content">
                <span class="game-menu__item-label">{option.label}</span>
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
            disabled={gameInteractionDisabled()}
            size="sm"
            value={props.walkSpeed()}
            onBlur={props.handleSetWalkSpeed}
            onKeyDown={stopMenuInputKeyPropagation}
            onInput={(event) => props.setWalkSpeed(event.currentTarget.value)}
          />
        </label>
        <label class="game-menu__field">
          <span>FPS</span>
          <Input
            disabled={gameInteractionDisabled()}
            size="sm"
            value={props.frameRate()}
            onBlur={props.handleSetFrameRate}
            onKeyDown={stopMenuInputKeyPropagation}
            onInput={(event) => props.setFrameRate(event.currentTarget.value)}
          />
        </label>
        <label class="game-menu__field game-menu__field--wide">
          <span>Custom Name</span>
          <Input
            disabled={gameInteractionDisabled()}
            placeholder="Keep current name"
            size="sm"
            value={props.customName()}
            onBlur={props.handleSetCustomName}
            onKeyDown={stopMenuInputKeyPropagation}
            onInput={(event) => props.setCustomName(event.currentTarget.value)}
          />
        </label>
        <label class="game-menu__field game-menu__field--wide">
          <span>Custom Guild</span>
          <Input
            disabled={gameInteractionDisabled()}
            placeholder="Keep current guild"
            size="sm"
            value={props.customGuild()}
            onBlur={props.handleSetCustomGuild}
            onKeyDown={stopMenuInputKeyPropagation}
            onInput={(event) => props.setCustomGuild(event.currentTarget.value)}
          />
        </label>
      </div>
    </>
  );
}

export interface TopNavHiddenOptionsMenuProps extends TopNavOptionsMenuContentProps {
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
}

export function TopNavHiddenOptionsMenu(
  props: TopNavHiddenOptionsMenuProps,
): JSX.Element {
  return (
    <div class="game-hidden-options-menu">
      <Menu
        open={props.open()}
        positioning={{
          gutter: 8,
          placement: "bottom",
          strategy: "fixed",
        }}
        onOpenChange={(details) => props.setOpen(details.open)}
      >
        <MenuTrigger
          aria-hidden="true"
          class="game-hidden-options-menu__anchor"
          tabIndex={-1}
        >
          Options
        </MenuTrigger>
        <MenuContent
          class="game-menu game-menu--options game-hidden-options-menu__content"
          portal={false}
        >
          <TopNavOptionsMenuContent {...props} />
        </MenuContent>
      </Menu>
    </div>
  );
}

export function TopNav(props: TopNavProps): JSX.Element {
  let topNavContainer: HTMLDivElement | undefined;
  let autoReloginMenuContent: HTMLDivElement | undefined;
  const [autoReloginServerMenuOpen, setAutoReloginServerMenuOpen] =
    createSignal(false);
  const [acknowledgedAutoReloginError, setAcknowledgedAutoReloginError] =
    createSignal("");

  const autoReloginNeedsAttention = (): boolean => {
    const error = props.autoReloginLastError();
    return error !== "" && acknowledgedAutoReloginError() !== error;
  };

  const autoReloginAttemptsRemainingLabel = (): string => {
    const remaining = props.autoReloginAttemptsRemaining();
    if (remaining === null) return "";
    if (remaining <= 0) return "No retry attempts left";
    return `${remaining} retry ${remaining === 1 ? "attempt" : "attempts"} left`;
  };

  const autoReloginTriggerLabel = (): string => {
    if (props.autoReloginAttempting()) {
      const remaining = autoReloginAttemptsRemainingLabel();
      return remaining === ""
        ? "Auto Relogin reconnecting"
        : `Auto Relogin reconnecting (${remaining})`;
    }

    if (props.autoReloginWaitingDelay()) {
      return "Auto Relogin waiting before reconnect";
    }

    const error = props.autoReloginLastError();
    return error === "" ? "Auto Relogin" : `Auto Relogin failed: ${error}`;
  };

  const autoReloginTriggerHasStatus = (): boolean =>
    props.autoReloginAttempting() ||
    props.autoReloginWaitingDelay() ||
    autoReloginNeedsAttention();

  const autoReloginTriggerStatusKind = ():
    | "waiting"
    | "retrying"
    | "alert"
    | undefined =>
    props.autoReloginAttempting()
      ? "retrying"
      : props.autoReloginWaitingDelay()
        ? "waiting"
        : autoReloginNeedsAttention()
          ? "alert"
          : undefined;

  const autoAttackTriggerLabel = (): string => {
    const runtimeLabel = props.autoAttackProfileLabel();
    const configuredLabel = props.autoAttackConfiguredProfileLabel();
    const error = props.autoAttackLastError();

    if (error !== "") {
      return `Auto Attack failed: ${error}`;
    }

    if (!props.autoAttackEnabled()) {
      return configuredLabel === ""
        ? "Auto Attack disabled"
        : `Auto Attack disabled: ${configuredLabel}`;
    }

    if (
      props.autoAttackMode() === "equipped-class" &&
      runtimeLabel !== "" &&
      runtimeLabel !== configuredLabel
    ) {
      return `Auto Attack enabled: ${configuredLabel}, using ${runtimeLabel}`;
    }

    return configuredLabel === ""
      ? "Auto Attack enabled"
      : `Auto Attack enabled: ${configuredLabel}`;
  };

  const autoAttackSelectionValue = (): string =>
    props.autoAttackMode() === "selected"
      ? `profile:${props.selectedAutoAttackProfileId() ?? ""}`
      : props.autoAttackMode();

  const handleAutoAttackSelectionChange = (details: { value: string }) => {
    const value = details.value;
    if (value === "generic" || value === "equipped-class") {
      props.handleSelectAutoAttackProfile(value);
      return;
    }

    if (value.startsWith("profile:")) {
      props.handleSelectAutoAttackProfile(
        "selected",
        value.slice("profile:".length),
      );
    }
  };

  onMount(() => {
    let lastTopNavHeight = 0;

    const setTopNavOffset = (height: number): void => {
      if (!Number.isFinite(height)) return;

      const roundedHeight = Math.ceil(height);
      if (roundedHeight <= 0 || roundedHeight === lastTopNavHeight) return;

      lastTopNavHeight = roundedHeight;
      document.documentElement.style.setProperty(
        "--topnav-offset",
        `${roundedHeight}px`,
      );
    };

    const observer = new ResizeObserver(([entry]) => {
      const height =
        entry?.borderBoxSize[0]?.blockSize ?? entry?.contentRect.height;
      if (height !== undefined) setTopNavOffset(height);
    });

    if (topNavContainer) observer.observe(topNavContainer);

    onCleanup(() => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--topnav-offset");
    });
  });

  createEffect(() => {
    if (props.autoReloginLastError() === "") {
      setAcknowledgedAutoReloginError("");
    }
  });

  createEffect(() => {
    if (props.autoReloginAttempting()) {
      setAutoReloginServerMenuOpen(false);
    }
  });

  const setMenuOpen =
    (menu: GameTopNavMenu) =>
    (details: { readonly open: boolean }): void => {
      props.setOpenMenu(details.open ? menu : null);
    };

  const setAutoReloginMenuOpen = (details: {
    readonly open: boolean;
  }): void => {
    if (details.open) {
      props.handleRefreshAutoReloginServers();
      const error = props.autoReloginLastError();
      if (error !== "") setAcknowledgedAutoReloginError(error);
    } else {
      setAutoReloginServerMenuOpen(false);
    }
    props.setOpenMenu(details.open ? "relogin" : null);
  };

  const setAutoReloginServerMenuOpenFromMenu = (details: {
    readonly open: boolean;
  }): void => {
    setAutoReloginServerMenuOpen(details.open);
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
      if (travelDisabled()) {
        event.preventDefault();
        return;
      }

      props.handleRefreshTravelOptions();
      toggleMenu(menu)(event);
    };

  const gameInteractionDisabled = () =>
    !props.gameLoaded() || !props.playerReady();

  const travelDisabled = () => gameInteractionDisabled() || props.travelBusy();

  const isValidPad = (pad: string) =>
    props
      .validPads()
      .some((validPad) => validPad.toLowerCase() === pad.toLowerCase());

  const stopMenuInputKeyPropagation: JSX.EventHandler<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    if (event.key !== "Escape" && event.key !== "Tab") {
      event.stopPropagation();
    }
  };

  const commitAutoReloginDelayOnEnter: JSX.EventHandler<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    stopMenuInputKeyPropagation(event);
    if (event.key !== "Enter") return;
    event.preventDefault();
    props.handleSetAutoReloginDelay();
  };

  const closeAutoReloginServerMenuToParent: JSX.EventHandler<
    HTMLDivElement,
    KeyboardEvent
  > = (event) => {
    if (event.key !== "ArrowLeft") return;
    event.preventDefault();
    event.stopPropagation();
    setAutoReloginServerMenuOpen(false);
    autoReloginMenuContent?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={(element) => {
        topNavContainer = element;
      }}
      id="topnav-container"
      class="game-topnav-container"
    >
      <nav id="topnav" class="game-topnav" aria-label="Game controls">
        <div
          class="game-topnav__left"
          data-menu-open={
            props.openMenu() !== null &&
            props.openMenu() !== "pads" &&
            props.openMenu() !== "cells"
              ? ""
              : undefined
          }
        >
          <Menu
            open={props.openMenu() === "windows"}
            onOpenChange={setMenuOpen("windows")}
          >
            <TopNavMenuTrigger
              expanded={props.openMenu() === "windows"}
              onClick={toggleMenu("windows")}
            >
              Windows
            </TopNavMenuTrigger>
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
            <TopNavMenuTrigger
              expanded={props.openMenu() === "scripts"}
              onClick={toggleMenu("scripts")}
            >
              Scripts
            </TopNavMenuTrigger>
            <MenuContent class="game-menu game-menu--scripts" portal={false}>
              <MenuGroup>
                <MenuItem
                  class="game-menu__item"
                  onSelect={() => void props.loadScript()}
                  value="loadScript"
                >
                  <span class="game-menu__item-label">Load Script</span>
                  <Show
                    when={formatOptionalHotkeyDisplay(
                      commandHotkey(props.hotkeyBindings(), "loadScript"),
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
                  value="stopScript"
                  variant="destructive"
                >
                  <span class="game-menu__item-label">Stop</span>
                  <Show
                    when={formatOptionalHotkeyDisplay(
                      commandHotkey(props.hotkeyBindings(), "stopScript"),
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
            <TopNavMenuTrigger
              expanded={props.openMenu() === "options"}
              onClick={toggleMenu("options")}
            >
              Options
            </TopNavMenuTrigger>
            <MenuContent class="game-menu game-menu--options" portal={false}>
              <TopNavOptionsMenuContent {...props} />
            </MenuContent>
          </Menu>

          <Menu
            open={props.openMenu() === "autozone"}
            onOpenChange={setMenuOpen("autozone")}
          >
            <TopNavMenuTrigger
              class="game-topnav__trigger--autozone"
              expanded={props.openMenu() === "autozone"}
              onClick={toggleMenu("autozone")}
              title={
                props.autoZoneEnabled() && props.autoZoneMap()
                  ? `Auto Zone: ${getAutoZoneMapLabel(props.autoZoneMap())}`
                  : undefined
              }
            >
              <span>Auto Zone</span>
              <Show when={props.autoZoneEnabled() && props.autoZoneMap()}>
                <span class="game-topnav__trigger-detail">
                  {props.autoZoneMap()}
                </span>
              </Show>
            </TopNavMenuTrigger>
            <MenuContent class="game-menu game-menu--autozone" portal={false}>
              <MenuAutofocusAnchor />
              <MenuCheckboxItem
                checked={props.autoZoneEnabled()}
                class="game-menu__item"
                closeOnSelect={false}
                onClick={props.handleToggleAutoZone}
                value="toggle-autozone"
              >
                {props.autoZoneEnabled() ? "Disable" : "Enable"}
              </MenuCheckboxItem>
              <MenuSeparator />
              <MenuRadioGroup
                value={props.autoZoneMap() ?? ""}
                onValueChange={(details) =>
                  props.handleSelectAutoZoneMap(
                    details.value as AutoZoneSupportedMap,
                  )
                }
              >
                <For each={AUTO_ZONE_MAP_OPTIONS}>
                  {(option) => (
                    <MenuRadioItem
                      class="game-menu__item"
                      closeOnSelect={false}
                      value={option.value}
                    >
                      <span class="game-menu__item-label">{option.label}</span>
                    </MenuRadioItem>
                  )}
                </For>
              </MenuRadioGroup>
            </MenuContent>
          </Menu>

          <Menu
            open={props.openMenu() === "relogin"}
            onOpenChange={setAutoReloginMenuOpen}
          >
            <TopNavMenuTrigger
              aria-label={autoReloginTriggerLabel()}
              class={cn(
                "game-topnav__trigger--relogin",
                autoReloginNeedsAttention() &&
                  !props.autoReloginAttempting() &&
                  !props.autoReloginWaitingDelay() &&
                  "game-topnav__trigger--alert",
              )}
              expanded={props.openMenu() === "relogin"}
              title={
                autoReloginTriggerLabel() === "Auto Relogin"
                  ? props.autoReloginEnabled() && props.autoReloginServer()
                    ? `Auto Relogin: ${props.autoReloginServer()}`
                    : undefined
                  : autoReloginTriggerLabel()
              }
            >
              <span>Auto Relogin</span>
              <Show
                when={props.autoReloginEnabled() && props.autoReloginServer()}
              >
                <span class="game-topnav__trigger-detail">
                  {props.autoReloginServer()}
                </span>
              </Show>
              <span
                aria-hidden="true"
                class="game-topnav__status-slot"
                data-kind={autoReloginTriggerStatusKind()}
                data-visible={autoReloginTriggerHasStatus() ? "" : undefined}
              >
                <Switch>
                  <Match when={autoReloginTriggerStatusKind() === "waiting"}>
                    <Clock class="game-topnav__status-icon game-topnav__delay-icon" />
                  </Match>
                  <Match when={autoReloginTriggerStatusKind() === "retrying"}>
                    <LoaderCircle class="game-topnav__status-icon game-topnav__retry-spinner" />
                  </Match>
                  <Match when={autoReloginTriggerStatusKind() === "alert"}>
                    <CircleAlert class="game-topnav__status-icon game-topnav__alert-icon" />
                  </Match>
                </Switch>
              </span>
            </TopNavMenuTrigger>
            <MenuContent
              ref={(element) => {
                autoReloginMenuContent = element;
              }}
              class="game-menu game-menu--relogin"
              portal={false}
            >
              <MenuAutofocusAnchor />
              <Show
                when={
                  props.autoReloginToggling() ||
                  props.autoReloginAttempting() ||
                  props.autoReloginLastError()
                }
              >
                <div class="game-menu__status game-menu__status--relogin">
                  <Show when={props.autoReloginToggling()}>
                    <span class="game-menu__status-row">
                      <LoaderCircle
                        aria-hidden="true"
                        class="game-menu__status-icon game-menu__status-icon--spin"
                      />
                      <span>
                        {props.autoReloginEnabled() ? "Enabling" : "Disabling"}
                      </span>
                    </span>
                  </Show>
                  <Show when={props.autoReloginAttempting()}>
                    <span class="game-menu__status-row">
                      <LoaderCircle
                        aria-hidden="true"
                        class="game-menu__status-icon game-menu__status-icon--spin"
                      />
                      <span>Attempting reconnect</span>
                    </span>
                  </Show>
                  <Show when={props.autoReloginLastError()}>
                    {(error) => (
                      <span class="game-menu__status-row game-menu__error">
                        <CircleAlert
                          aria-hidden="true"
                          class="game-menu__status-icon"
                        />
                        <span>{error()}</span>
                      </span>
                    )}
                  </Show>
                  <Show when={autoReloginAttemptsRemainingLabel()}>
                    {(label) => (
                      <span class="game-menu__status-row">
                        <span
                          aria-hidden="true"
                          class="game-menu__status-icon"
                        />
                        <span>{label()}</span>
                      </span>
                    )}
                  </Show>
                </div>
                <MenuSeparator />
              </Show>
              <MenuCheckboxItem
                checked={props.autoReloginEnabled()}
                class="game-menu__item"
                closeOnSelect={false}
                disabled={
                  props.autoReloginToggling() ||
                  (!props.autoReloginCaptured() && !props.autoReloginEnabled())
                }
                onClick={props.handleToggleAutoRelogin}
                value="toggle-autorelogin"
              >
                {props.autoReloginToggling()
                  ? props.autoReloginEnabled()
                    ? "Enabling…"
                    : "Disabling…"
                  : props.autoReloginEnabled()
                    ? "Disable"
                    : "Enable"}
              </MenuCheckboxItem>
              <MenuSub
                id="autorelogin-server-menu"
                open={autoReloginServerMenuOpen()}
                onOpenChange={setAutoReloginServerMenuOpenFromMenu}
                closeOnSelect={false}
              >
                <MenuSubTrigger
                  aria-disabled={
                    props.autoReloginAttempting() ? "true" : undefined
                  }
                  class="game-menu__item game-menu__server-trigger"
                  inset
                >
                  <span class="game-menu__item-label">Server</span>
                  <span class="game-menu__item-value">
                    {props.autoReloginServer() || "None"}
                  </span>
                </MenuSubTrigger>
                <MenuSubContent
                  class="game-menu game-menu--compact game-menu--relogin-servers"
                  onKeyDownCapture={closeAutoReloginServerMenuToParent}
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
                    <MenuRadioGroup
                      value={props.autoReloginServer()}
                      onValueChange={(details) =>
                        props.handleSelectAutoReloginServer(details.value)
                      }
                    >
                      <For each={props.autoReloginServers()}>
                        {(serverName) => (
                          <MenuRadioItem
                            class="game-menu__item"
                            disabled={
                              !props.autoReloginCaptured() ||
                              props.autoReloginAttempting()
                            }
                            value={serverName}
                          >
                            <span class="game-menu__item-label">
                              {serverName}
                            </span>
                          </MenuRadioItem>
                        )}
                      </For>
                    </MenuRadioGroup>
                  </Show>
                </MenuSubContent>
              </MenuSub>
              <MenuSeparator />
              <div class="game-menu__fields game-menu__fields--single-row">
                <div class="game-menu__field game-menu__field--inline game-menu__field--wide game-menu__field--menu-inset">
                  <span>Delay</span>
                  <div class="game-menu__delay-control">
                    <Input
                      class="game-menu__delay-input"
                      inputMode="decimal"
                      max="300"
                      min="0"
                      size="sm"
                      step="0.1"
                      type="number"
                      value={props.autoReloginDelaySeconds()}
                      onBlur={props.handleSetAutoReloginDelay}
                      onKeyDown={commitAutoReloginDelayOnEnter}
                      onInput={(event) =>
                        props.setAutoReloginDelaySeconds(
                          event.currentTarget.value,
                        )
                      }
                    />
                    <span class="game-menu__delay-unit">sec</span>
                  </div>
                </div>
              </div>
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
            size="sm"
            variant="ghost"
          >
            {props.scriptRunning() ? "Stop" : "Start"}
          </Button>
        </div>

        <div
          class="game-topnav__right"
          data-menu-open={
            props.openMenu() === "combat" ||
            props.openMenu() === "pads" ||
            props.openMenu() === "cells"
              ? ""
              : undefined
          }
        >
          <Menu
            open={props.openMenu() === "combat"}
            onOpenChange={setMenuOpen("combat")}
          >
            <TopNavMenuTrigger
              aria-label={autoAttackTriggerLabel()}
              aria-pressed={props.autoAttackEnabled()}
              class={cn(
                "game-topnav__combat-trigger",
                props.autoAttackLastError() !== "" &&
                  "game-topnav__trigger--alert",
              )}
              data-enabled={props.autoAttackEnabled() ? "" : undefined}
              disabled={gameInteractionDisabled()}
              expanded={props.openMenu() === "combat"}
              onClick={toggleMenu("combat")}
              title={autoAttackTriggerLabel()}
            >
              <span
                aria-hidden="true"
                class={cn(
                  "game-topnav__combat-check",
                  props.autoAttackEnabled() &&
                    "game-topnav__combat-check--active",
                )}
              />
              <span class="game-topnav__combat-label">
                {props.autoAttackConfiguredProfileLabel()}
              </span>
              <ChevronDown
                aria-hidden="true"
                class="game-topnav__select-chevron"
              />
            </TopNavMenuTrigger>
            <MenuContent class="game-menu game-menu--combat" portal={false}>
              <MenuAutofocusAnchor />
              <MenuGroup>
                <MenuLabel>State</MenuLabel>
                <MenuCheckboxItem
                  checked={props.autoAttackEnabled()}
                  class="game-menu__item"
                  closeOnSelect={false}
                  disabled={gameInteractionDisabled()}
                  onClick={props.handleToggleAutoAttack}
                  value="toggle-auto-attack"
                >
                  {props.autoAttackEnabled() ? "Enabled" : "Disabled"}
                </MenuCheckboxItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuLabel>Mode</MenuLabel>
              </MenuGroup>
              <MenuRadioGroup
                value={autoAttackSelectionValue()}
                onValueChange={handleAutoAttackSelectionChange}
              >
                <MenuRadioItem
                  class="game-menu__item"
                  closeOnSelect={false}
                  value="equipped-class"
                >
                  <span class="game-menu__item-label">
                    Match equipped class
                  </span>
                </MenuRadioItem>
                <MenuRadioItem
                  class="game-menu__item"
                  closeOnSelect={false}
                  value="generic"
                >
                  <span class="game-menu__item-label">Use generic</span>
                </MenuRadioItem>
              </MenuRadioGroup>
              <Show when={props.combatProfiles().length > 0}>
                <MenuSeparator />
                <MenuGroup>
                  <MenuLabel>Profiles</MenuLabel>
                </MenuGroup>
                <MenuRadioGroup
                  value={autoAttackSelectionValue()}
                  onValueChange={handleAutoAttackSelectionChange}
                >
                  <For each={props.combatProfiles()}>
                    {(profile) => (
                      <MenuRadioItem
                        class="game-menu__item"
                        closeOnSelect={false}
                        value={`profile:${profile.id}`}
                      >
                        <span class="game-menu__item-label">
                          {profile.label}
                        </span>
                      </MenuRadioItem>
                    )}
                  </For>
                </MenuRadioGroup>
              </Show>
            </MenuContent>
          </Menu>

          <div class="game-topnav__divider" />

          <Menu
            open={props.openMenu() === "pads"}
            onOpenChange={setMenuOpen("pads")}
          >
            <TopNavMenuTrigger
              class="game-topnav__select-trigger"
              disabled={travelDisabled()}
              expanded={props.openMenu() === "pads"}
              onClick={toggleTravelMenu("pads")}
              variant="secondary"
            >
              <span class="game-topnav__select-label">
                {props.selectedPad() || "Pad"}
              </span>
              <ChevronDown
                aria-hidden="true"
                class="game-topnav__select-chevron"
              />
            </TopNavMenuTrigger>
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
            <TopNavMenuTrigger
              class="game-topnav__select-trigger game-topnav__select-trigger--cell"
              disabled={travelDisabled()}
              expanded={props.openMenu() === "cells"}
              onClick={toggleTravelMenu("cells")}
              variant="secondary"
            >
              <span class="game-topnav__select-label">
                {props.selectedCell() || "Cell"}
              </span>
              <ChevronDown
                aria-hidden="true"
                class="game-topnav__select-chevron"
              />
            </TopNavMenuTrigger>
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
            disabled={gameInteractionDisabled()}
            onClick={props.handleOpenBank}
            size="sm"
            variant="ghost"
          >
            Bank
          </Button>
        </div>
      </nav>
    </div>
  );
}
