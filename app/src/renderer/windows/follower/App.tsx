/* @refresh reload */
import "../../polyfills";
import "./style.css";
import {
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
  Button,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  Checkbox,
  IconButton,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type IconButtonProps,
} from "@vexed/ui";
import {
  HelpCircle,
  Play,
  SlidersHorizontal,
  Square,
  UserRound,
  X,
} from "lucide-solid";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import {
  DEFAULT_COMBAT_PROFILE_ID,
  DEFAULT_COMBAT_PROFILE_LIBRARY,
  type CombatProfile,
  type CombatProfileLibrary,
} from "../../../shared/combat-profiles";
import {
  DEFAULT_FOLLOWER_ATTEMPTS,
  DEFAULT_FOLLOWER_COMBAT_ENABLED,
  DEFAULT_FOLLOWER_COPY_WALK,
  DEFAULT_FOLLOWER_RETRY_ENABLED,
  createIdleFollowerState,
  type FollowerState,
} from "../../../shared/follower";
import { WindowIds } from "../../../shared/windows";
import { mountWindow } from "../mount";

const selectedProfileStorageKey = "vexed.follower.selectedProfileId";

const readLastSelectedProfileId = (): string | undefined => {
  try {
    return window.localStorage.getItem(selectedProfileStorageKey) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeLastSelectedProfileId = (profileId: string): void => {
  try {
    window.localStorage.setItem(selectedProfileStorageKey, profileId);
  } catch {
    // Best-effort convenience only.
  }
};

const getPreferredProfileId = (
  profiles: readonly CombatProfile[],
  preferredId: string | undefined,
): string =>
  profiles.find((profile) => profile.id === preferredId)?.id ??
  profiles.find((profile) => profile.id !== DEFAULT_COMBAT_PROFILE_ID)?.id ??
  profiles[0]?.id ??
  DEFAULT_COMBAT_PROFILE_ID;

function Field(props: {
  readonly label: JSX.Element;
  readonly for?: string;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <div class="follower-field">
      <Label for={props.for}>{props.label}</Label>
      {props.children}
    </div>
  );
}

function LabelHelp(props: {
  readonly label: string;
  readonly tooltip: string;
}): JSX.Element {
  return (
    <span class="follower-label-help">
      <span>{props.label}</span>
      <Tooltip
        closeDelay={0}
        openDelay={200}
        positioning={{ placement: "top" }}
      >
        <TooltipTrigger
          asChild={(triggerProps) => (
            <IconButton
              {...(triggerProps({
                "aria-label": `${props.label} help`,
                children: <HelpCircle class="button__icon" />,
                class: "follower-help-button",
                size: "icon-xs",
                type: "button",
                variant: "ghost",
              } as IconButtonProps) as IconButtonProps)}
            />
          )}
        />
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function TooltipIconButton(props: {
  readonly "aria-label": string;
  readonly children: JSX.Element;
  readonly tooltip: string;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <TooltipTrigger
        asChild={(triggerProps) => (
          <IconButton
            {...(triggerProps({
              "aria-label": props["aria-label"],
              children: props.children,
              size: "icon-sm",
              type: "button",
              variant: "ghost",
              onClick: props.onClick,
            } as IconButtonProps) as IconButtonProps)}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function App(): JSX.Element {
  const [state, setState] = createSignal<FollowerState>(
    createIdleFollowerState(),
  );
  const [library, setLibrary] = createSignal<CombatProfileLibrary>(
    DEFAULT_COMBAT_PROFILE_LIBRARY,
  );
  const [targetName, setTargetName] = createSignal("");
  const [combatEnabled, setCombatEnabled] = createSignal(
    DEFAULT_FOLLOWER_COMBAT_ENABLED,
  );
  const [copyWalk, setCopyWalk] = createSignal(DEFAULT_FOLLOWER_COPY_WALK);
  const [retryEnabled, setRetryEnabled] = createSignal(
    DEFAULT_FOLLOWER_RETRY_ENABLED,
  );
  const [maxAttempts, setMaxAttempts] = createSignal(DEFAULT_FOLLOWER_ATTEMPTS);
  const [selectedProfileId, setSelectedProfileId] = createSignal(
    readLastSelectedProfileId() ?? DEFAULT_COMBAT_PROFILE_ID,
  );
  const [attackPriority, setAttackPriority] = createSignal("");
  const [lockedZoneFallbacks, setLockedZoneFallbacks] = createSignal("");
  const [lockedZoneRoomOverride, setLockedZoneRoomOverride] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  const [dismissedIssue, setDismissedIssue] = createSignal(false);
  let previousIssueKey = "";

  const running = createMemo(() => state().enabled || state().running);
  const profileOptions = createMemo(() => {
    const profiles = library().profiles;
    const generic = profiles.find(
      (profile) => profile.id === DEFAULT_COMBAT_PROFILE_ID,
    );
    const rest = profiles.filter(
      (profile) => profile.id !== DEFAULT_COMBAT_PROFILE_ID,
    );
    return generic ? [generic, ...rest] : rest;
  });
  const profileSelectItems = createMemo(() =>
    profileOptions().map((profile) => ({
      label: profile.label,
      value: profile.id,
    })),
  );
  const selectedProfileLabel = createMemo(
    () =>
      profileOptions().find((profile) => profile.id === selectedProfileId())
        ?.label ??
      selectedProfileId() ??
      "",
  );
  const exhaustedFollowerAttempts = createMemo(() => {
    const current = state();
    return (
      !current.enabled &&
      !current.running &&
      current.attemptsRemaining <= 0 &&
      current.stoppedReason !== "Stopped by user"
    );
  });
  const issueMessage = createMemo(() => {
    const current = state();
    const followerMessages = exhaustedFollowerAttempts()
      ? [current.stoppedReason ?? "", current.lastError ?? ""]
      : [];
    const messages = [error(), ...followerMessages].filter(Boolean);
    return [...new Set(messages)].join(" - ");
  });
  const showIssue = createMemo(
    () => issueMessage() !== "" && !dismissedIssue(),
  );

  createEffect(() => {
    const key = issueMessage();
    if (key !== previousIssueKey) {
      previousIssueKey = key;
      setDismissedIssue(false);
    }
  });

  const selectProfile = (profileId: string): void => {
    setSelectedProfileId(profileId);
    writeLastSelectedProfileId(profileId);
  };

  const applyLibrary = (nextLibrary: CombatProfileLibrary): void => {
    setLibrary(nextLibrary);
    if (
      !nextLibrary.profiles.some(
        (profile) => profile.id === selectedProfileId(),
      )
    ) {
      selectProfile(
        getPreferredProfileId(
          nextLibrary.profiles,
          readLastSelectedProfileId(),
        ),
      );
    }
  };

  const applyFollowerState = (nextState: FollowerState): void => {
    setState(nextState);
    if (nextState.enabled || nextState.running) {
      setDismissedIssue(false);
      setError("");
    }
  };

  const fillMe = async (): Promise<void> => {
    setError("");
    try {
      const me = await window.ipc.follower.me();
      if (me.trim()) {
        setTargetName(me);
      }
    } catch (cause) {
      console.error("Failed to resolve current player:", cause);
      setError(cause instanceof Error ? cause.message : "Failed to get player");
    }
  };

  const openSkills = async (): Promise<void> => {
    setError("");
    try {
      await window.ipc.windows.open(WindowIds.Skills);
    } catch (cause) {
      console.error("Failed to open skills window:", cause);
      setError(
        cause instanceof Error ? cause.message : "Failed to open skills",
      );
    }
  };

  const start = async (): Promise<void> => {
    const trimmedTarget = targetName().trim();
    if (!trimmedTarget || busy()) {
      return;
    }

    setBusy(true);
    setError("");
    setDismissedIssue(false);
    try {
      const nextState = await window.ipc.follower.start({
        targetName: trimmedTarget,
        combatEnabled: combatEnabled(),
        copyWalk: copyWalk(),
        retryEnabled: retryEnabled(),
        maxAttempts: maxAttempts(),
        selectedProfileId: selectedProfileId(),
        attackPriority: attackPriority(),
        lockedZoneFallbacks: lockedZoneFallbacks(),
        lockedZoneRoomOverride: lockedZoneRoomOverride(),
      });
      applyFollowerState(nextState);
    } catch (cause) {
      console.error("Failed to start follower:", cause);
      setError(
        cause instanceof Error ? cause.message : "Failed to start follower",
      );
    } finally {
      setBusy(false);
    }
  };

  const stop = async (): Promise<void> => {
    if (busy()) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const nextState = await window.ipc.follower.stop();
      applyFollowerState(nextState);
    } catch (cause) {
      console.error("Failed to stop follower:", cause);
      setError(
        cause instanceof Error ? cause.message : "Failed to stop follower",
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = (): void => {
    if (running()) {
      void stop();
    } else {
      void start();
    }
  };

  onMount(() => {
    const unsubscribeFollower =
      window.ipc.follower.onChanged(applyFollowerState);
    const unsubscribeProfiles =
      window.ipc.combatProfiles.onChanged(applyLibrary);

    void window.ipc.follower
      .getState()
      .then(applyFollowerState)
      .catch((cause: unknown) => {
        console.error("Failed to load follower state:", cause);
        setError("Failed to load follower state");
      });

    void window.ipc.combatProfiles
      .getState()
      .then(applyLibrary)
      .catch((cause: unknown) => {
        console.error("Failed to load combat profiles:", cause);
        setError("Failed to load combat profiles");
      });

    onCleanup(() => {
      unsubscribeFollower();
      unsubscribeProfiles();
    });
  });

  return (
    <AppShell class="follower-window">
      <AppShellHeader class="follower-header" maxWidth={false}>
        <AppShellHeaderLeft>
          <AppShellTitle>Follower</AppShellTitle>
        </AppShellHeaderLeft>
        <AppShellHeaderRight class="follower-header__actions">
          <Button
            disabled={busy() || (!running() && !targetName().trim())}
            size="sm"
            variant={running() ? "destructive" : "default"}
            onClick={toggle}
          >
            {running() ? (
              <Square class="button__icon" />
            ) : (
              <Play class="button__icon" />
            )}
            {running() ? "Stop" : "Start"}
          </Button>
        </AppShellHeaderRight>
      </AppShellHeader>

      <AppShellBody class="follower-body" maxWidth={false}>
        <section class="follower-shell" aria-label="Follower controls">
          <Show when={showIssue()}>
            <div class="follower-issue">
              <span>{issueMessage()}</span>
              <IconButton
                aria-label="Dismiss follower status"
                size="icon-sm"
                variant="ghost"
                onClick={() => setDismissedIssue(true)}
              >
                <X class="button__icon" />
              </IconButton>
            </div>
          </Show>

          <div class="follower-grid">
            <CardFrame class="follower-panel follower-panel--target">
              <CardFrameHeader class="follower-panel__header">
                <CardFrameTitle>Target</CardFrameTitle>
              </CardFrameHeader>
              <Card class="follower-panel__body">
                <CardContent class="follower-panel__content">
                  <Field label="Player name" for="follower-target-name">
                    <div class="follower-target-row">
                      <Input
                        id="follower-target-name"
                        value={targetName()}
                        placeholder="Player name"
                        autocomplete="off"
                        disabled={running()}
                        onInput={(event) =>
                          setTargetName(event.currentTarget.value)
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={running()}
                        onClick={() => void fillMe()}
                      >
                        <UserRound class="button__icon" />
                        Me
                      </Button>
                    </div>
                  </Field>
                  <Checkbox
                    checked={copyWalk()}
                    disabled={running()}
                    onChange={(event) =>
                      setCopyWalk(event.currentTarget.checked)
                    }
                  >
                    Copy walk
                  </Checkbox>
                  <div class="follower-subsection">
                    <div class="follower-subsection__title">Retries</div>
                    <div class="follower-retry-row">
                      <Checkbox
                        checked={retryEnabled()}
                        disabled={running()}
                        onChange={(event) =>
                          setRetryEnabled(event.currentTarget.checked)
                        }
                      >
                        Retry failures
                      </Checkbox>
                      <label
                        class="follower-inline-number"
                        for="follower-retry-attempts"
                      >
                        <span>Attempts</span>
                        <Input
                          id="follower-retry-attempts"
                          class="follower-retry-attempts-input"
                          type="number"
                          min="1"
                          step="1"
                          value={String(maxAttempts())}
                          disabled={running() || !retryEnabled()}
                          onInput={(event) => {
                            const parsed = Number.parseInt(
                              event.currentTarget.value,
                              10,
                            );
                            if (Number.isFinite(parsed)) {
                              setMaxAttempts(Math.max(1, parsed));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <Field
                    label="Locked-zone locations"
                    for="follower-locked-zone-fallbacks"
                  >
                    <Textarea
                      id="follower-locked-zone-fallbacks"
                      class="follower-fallbacks-input"
                      value={lockedZoneFallbacks()}
                      placeholder={"ultradage-12345\nultranulgath-98765"}
                      autocomplete="off"
                      spellcheck={false}
                      disabled={running() || !retryEnabled()}
                      onInput={(event) =>
                        setLockedZoneFallbacks(event.currentTarget.value)
                      }
                    />
                  </Field>
                  <Field
                    label={
                      <LabelHelp
                        label="Room override"
                        tooltip="Used only for locked-zone maps without a room suffix."
                      />
                    }
                    for="follower-locked-zone-room"
                  >
                    <Input
                      id="follower-locked-zone-room"
                      class="follower-room-input"
                      value={lockedZoneRoomOverride()}
                      placeholder="12345"
                      inputMode="numeric"
                      autocomplete="off"
                      disabled={running() || !retryEnabled()}
                      onInput={(event) =>
                        setLockedZoneRoomOverride(event.currentTarget.value)
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </CardFrame>

            <CardFrame class="follower-panel follower-panel--combat">
              <CardFrameHeader class="follower-panel__header">
                <CardFrameTitle>Combat</CardFrameTitle>
              </CardFrameHeader>
              <Card class="follower-panel__body">
                <CardContent class="follower-panel__content">
                  <Checkbox
                    checked={combatEnabled()}
                    disabled={running()}
                    onChange={(event) =>
                      setCombatEnabled(event.currentTarget.checked)
                    }
                  >
                    Enable combat
                  </Checkbox>
                  <div class="follower-profile-field">
                    <div class="follower-field__header">
                      <Label>Skill profile</Label>
                      <TooltipIconButton
                        aria-label="Open skills window"
                        tooltip="Configure skill profiles"
                        onClick={() => void openSkills()}
                      >
                        <SlidersHorizontal class="button__icon" />
                      </TooltipIconButton>
                    </div>
                    <Select
                      items={profileSelectItems()}
                      value={[selectedProfileId()]}
                      disabled={running() || !combatEnabled()}
                      onValueChange={(details) => {
                        const id = details.value[0];
                        if (id) {
                          selectProfile(id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <span
                          class="select__value"
                          data-placeholder={
                            selectedProfileLabel() === "" ? "" : undefined
                          }
                        >
                          {selectedProfileLabel() || "Profile"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <For each={profileOptions()}>
                          {(profile) => (
                            <SelectItem value={profile.id}>
                              {profile.label}
                            </SelectItem>
                          )}
                        </For>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Attack priority" for="follower-attack-priority">
                    <Input
                      id="follower-attack-priority"
                      value={attackPriority()}
                      placeholder="Defense Drone, Attack Drone"
                      autocomplete="off"
                      disabled={running() || !combatEnabled()}
                      onInput={(event) =>
                        setAttackPriority(event.currentTarget.value)
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </CardFrame>
          </div>
        </section>
      </AppShellBody>
    </AppShell>
  );
}

mountWindow(() => <App />);
