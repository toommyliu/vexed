/* @refresh reload */
import "../../polyfills";
import "./style.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
  Button,
  type ButtonProps,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@vexed/ui";
import { HelpCircle, Save, X } from "lucide-solid";
import {
  For,
  Index,
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
  DEFAULT_COMBAT_PROFILE_DELAY_MS,
  DEFAULT_COMBAT_PROFILE_LIBRARY,
  DEFAULT_COMBAT_PROFILE_ROLE,
  makeCombatProfileId,
  type CombatProfile,
  type CombatProfileAnimationTrigger,
  type CombatProfileCondition,
  type CombatProfileLibrary,
  type CombatProfileStep,
} from "../../../shared/combat-profiles";
import { mountWindow } from "../mount";

type ConditionType = CombatProfileCondition["type"];

const conditionTypes = [
  { value: "self-hp", label: "Self HP" },
  { value: "self-mp", label: "Self MP" },
  { value: "ally-hp", label: "Any player HP" },
  { value: "self-aura", label: "Self aura" },
  { value: "target-aura", label: "Target aura" },
] as const satisfies readonly {
  readonly value: ConditionType;
  readonly label: string;
}[];

const skillIndices = [0, 1, 2, 3, 4, 5] as const;
const selectedProfileStorageKey = "vexed.skills.selectedProfileId";

const isStatCondition = (
  condition: CombatProfileCondition,
): condition is Extract<
  CombatProfileCondition,
  { readonly type: "self-hp" | "self-mp" | "ally-hp" }
> =>
  condition.type === "self-hp" ||
  condition.type === "self-mp" ||
  condition.type === "ally-hp";

const auraNameValue = (condition: CombatProfileCondition): string =>
  isStatCondition(condition) ? "" : condition.auraName;

const conditionUnitValue = (condition: CombatProfileCondition): string =>
  isStatCondition(condition) ? condition.unit : "percent";

const createCondition = (type: ConditionType): CombatProfileCondition => {
  if (type === "self-aura" || type === "target-aura") {
    return {
      type,
      auraName: "",
      op: ">=",
      value: 1,
    };
  }

  return {
    type,
    op: "<=",
    value: type === "self-mp" ? 20 : 50,
    unit: "percent",
  };
};

const clampRuleValue = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const conditionLabel = (condition: CombatProfileCondition): string => {
  switch (condition.type) {
    case "self-hp":
      return `HP ${condition.op} ${condition.value}${condition.unit === "percent" ? "%" : ""}`;
    case "self-mp":
      return `MP ${condition.op} ${condition.value}${condition.unit === "percent" ? "%" : ""}`;
    case "ally-hp":
      return `Any player HP ${condition.op} ${condition.value}${condition.unit === "percent" ? "%" : ""}`;
    case "self-aura":
      return `Self ${condition.auraName} ${condition.op} ${condition.value}`;
    case "target-aura":
      return `Target ${condition.auraName} ${condition.op} ${condition.value}`;
  }
};

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
    // Selection persistence is best-effort; editing still works without storage.
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

function SkillsLabelHelp(props: {
  readonly label: string;
  readonly tooltip: string;
}): JSX.Element {
  return (
    <span class="skills-label-help">
      <span>{props.label}</span>
      <Tooltip
        closeDelay={0}
        openDelay={200}
        positioning={{ placement: "top" }}
      >
        <TooltipTrigger
          asChild={(triggerProps) => (
            <Button
              {...(triggerProps({
                "aria-label": `${props.label} help`,
                children: <HelpCircle class="button__icon" />,
                class: "skills-help-button",
                size: "icon-sm",
                type: "button",
                variant: "ghost",
              } as ButtonProps) as ButtonProps)}
            />
          )}
        />
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function App(): JSX.Element {
  const [library, setLibrary] = createSignal<CombatProfileLibrary>(
    DEFAULT_COMBAT_PROFILE_LIBRARY,
  );
  const [selectedId, setSelectedId] = createSignal(
    readLastSelectedProfileId() ?? DEFAULT_COMBAT_PROFILE_ID,
  );
  const [label, setLabel] = createSignal("Generic");
  const [className, setClassName] = createSignal("");
  const [role, setRole] = createSignal(DEFAULT_COMBAT_PROFILE_ROLE);
  const [delayMs, setDelayMs] = createSignal(
    String(DEFAULT_COMBAT_PROFILE_DELAY_MS),
  );
  const [draftSteps, setDraftSteps] = createSignal<
    readonly CombatProfileStep[]
  >(DEFAULT_COMBAT_PROFILE_LIBRARY.profiles[0]?.steps ?? []);
  const [draftAnimationTriggers, setDraftAnimationTriggers] = createSignal<
    readonly CombatProfileAnimationTrigger[]
  >(DEFAULT_COMBAT_PROFILE_LIBRARY.profiles[0]?.animationTriggers ?? []);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  let hydratedProfileId = "";

  const selectedProfile = createMemo(
    () =>
      library().profiles.find((profile) => profile.id === selectedId()) ??
      library().profiles[0],
  );
  const selectedProfileLabel = createMemo(
    () => selectedProfile()?.label ?? selectedId() ?? "",
  );
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
  const selectProfile = (profileId: string): void => {
    setSelectedId(profileId);
    writeLastSelectedProfileId(profileId);
  };

  createEffect(() => {
    const profile = selectedProfile();
    if (!profile) {
      return;
    }

    if (profile.id === hydratedProfileId) {
      return;
    }

    hydratedProfileId = profile.id;
    setLabel(profile.label);
    setClassName(profile.className ?? "");
    setRole(profile.role);
    setDelayMs(String(profile.delayMs));
    setDraftSteps(profile.steps.map((step) => ({ ...step })));
    setDraftAnimationTriggers(
      (profile.animationTriggers ?? []).map((trigger) => ({ ...trigger })),
    );
  });

  onMount(() => {
    const unsubscribe = window.ipc.combatProfiles.onChanged((nextLibrary) => {
      setLibrary(nextLibrary);
      if (
        !nextLibrary.profiles.some((profile) => profile.id === selectedId())
      ) {
        selectProfile(
          getPreferredProfileId(
            nextLibrary.profiles,
            readLastSelectedProfileId(),
          ),
        );
      }
    });

    void window.ipc.combatProfiles
      .getState()
      .then((nextLibrary) => {
        setLibrary(nextLibrary);
        selectProfile(
          getPreferredProfileId(
            nextLibrary.profiles,
            readLastSelectedProfileId(),
          ),
        );
      })
      .catch((cause: unknown) => {
        console.error("Failed to load combat profiles:", cause);
        setError("Failed to load profiles");
      });

    onCleanup(unsubscribe);
  });

  const runUpdate = async (
    update: Promise<CombatProfileLibrary>,
  ): Promise<boolean> => {
    setSaving(true);
    setError("");
    try {
      const nextLibrary = await update;
      setLibrary(nextLibrary);
      return true;
    } catch (cause) {
      console.error("Combat profile update failed:", cause);
      setError(cause instanceof Error ? cause.message : "Update failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const buildSelectedProfileDraft = (): CombatProfile | null => {
    const profile = selectedProfile();
    if (!profile) {
      return null;
    }

    const parsedDelay = Number.parseInt(delayMs(), 10);
    const trimmedClassName = className().trim();
    const profileWithoutClassName = {
      id: profile.id,
      label: profile.label,
      role: profile.role,
      delayMs: profile.delayMs,
      cooldownMode: profile.cooldownMode,
      timeoutMs: profile.timeoutMs,
      steps: draftSteps(),
      animationTriggers: draftAnimationTriggers(),
    } satisfies CombatProfile;
    return {
      ...profileWithoutClassName,
      label: label().trim() || profile.label,
      ...(trimmedClassName === "" ? {} : { className: trimmedClassName }),
      role: role().trim() || DEFAULT_COMBAT_PROFILE_ROLE,
      delayMs: Number.isFinite(parsedDelay)
        ? Math.max(0, parsedDelay)
        : profile.delayMs,
    };
  };

  const saveSelected = async (): Promise<void> => {
    if (saving()) {
      return;
    }

    const profile = buildSelectedProfileDraft();
    if (!profile) {
      return;
    }

    await runUpdate(window.ipc.combatProfiles.saveProfile(profile));
  };

  const createProfile = async (): Promise<void> => {
    if (saving()) {
      return;
    }

    const baseLabel = "New Profile";
    const id = makeCombatProfileId(`${baseLabel} ${Date.now()}`);
    const profile: CombatProfile = {
      id,
      label: baseLabel,
      role: DEFAULT_COMBAT_PROFILE_ROLE,
      delayMs: DEFAULT_COMBAT_PROFILE_DELAY_MS,
      cooldownMode: "use-if-ready",
      timeoutMs: 10_000,
      steps: [1, 2, 3, 4].map((skill) => ({
        id: `${id}-${skill}`,
        skill,
        conditions: [],
      })),
      animationTriggers: [],
    };

    const saved = await runUpdate(
      window.ipc.combatProfiles.saveProfile(profile),
    );
    if (saved) {
      selectProfile(id);
    }
  };

  const deleteSelected = async (): Promise<void> => {
    if (saving()) {
      return;
    }

    const profile = selectedProfile();
    if (!profile || profile.id === DEFAULT_COMBAT_PROFILE_ID) {
      return;
    }

    const deleted = await runUpdate(
      window.ipc.combatProfiles.deleteProfile(profile.id),
    );
    if (deleted) {
      selectProfile(getPreferredProfileId(library().profiles, undefined));
    }
  };

  const updateStep = (
    stepIndex: number,
    update: (step: CombatProfileStep) => CombatProfileStep,
  ): void => {
    setDraftSteps((steps) =>
      steps.map((step, index) => (index === stepIndex ? update(step) : step)),
    );
  };

  const addStep = (): void => {
    const id = `${selectedId()}-step-${Date.now()}`;
    setDraftSteps((steps) => [
      ...steps,
      {
        id,
        skill: 1,
        conditions: [],
      },
    ]);
  };

  const removeStep = (stepIndex: number): void => {
    setDraftSteps((steps) => steps.filter((_, index) => index !== stepIndex));
  };

  const updateStepSkill = (stepIndex: number, skill: number): void => {
    updateStep(stepIndex, (step) => ({
      ...step,
      skill,
    }));
  };

  const updateCondition = (
    stepIndex: number,
    conditionIndex: number,
    update: (condition: CombatProfileCondition) => CombatProfileCondition,
  ): void => {
    updateStep(stepIndex, (step) => ({
      ...step,
      conditions: step.conditions.map((condition, index) =>
        index === conditionIndex ? update(condition) : condition,
      ),
    }));
  };

  const addCondition = (stepIndex: number): void => {
    updateStep(stepIndex, (step) => ({
      ...step,
      conditions: [...step.conditions, createCondition("self-hp")],
    }));
  };

  const removeCondition = (stepIndex: number, conditionIndex: number): void => {
    updateStep(stepIndex, (step) => ({
      ...step,
      conditions: step.conditions.filter(
        (_, index) => index !== conditionIndex,
      ),
    }));
  };

  const updateConditionType = (
    stepIndex: number,
    conditionIndex: number,
    type: ConditionType,
  ): void => {
    updateCondition(stepIndex, conditionIndex, () => createCondition(type));
  };

  const updateAnimationTrigger = (
    triggerIndex: number,
    update: (
      trigger: CombatProfileAnimationTrigger,
    ) => CombatProfileAnimationTrigger,
  ): void => {
    setDraftAnimationTriggers((triggers) =>
      triggers.map((trigger, index) =>
        index === triggerIndex ? update(trigger) : trigger,
      ),
    );
  };

  const addAnimationTrigger = (): void => {
    setDraftAnimationTriggers((triggers) => [
      ...triggers,
      {
        id: `${selectedId()}-trigger-${Date.now()}`,
        messageIncludes: "",
        skill: 5,
      },
    ]);
  };

  const removeAnimationTrigger = (triggerIndex: number): void => {
    setDraftAnimationTriggers((triggers) =>
      triggers.filter((_, index) => index !== triggerIndex),
    );
  };

  return (
    <AppShell class="skills-window">
      <AppShellHeader class="skills-header" maxWidth={false}>
        <AppShellHeaderLeft>
          <AppShellTitle>Skills</AppShellTitle>
        </AppShellHeaderLeft>
        <AppShellHeaderRight class="skills-header__actions">
          <Show when={saving()}>
            <Spinner class="skills-sync-spinner" size="sm" />
          </Show>
          <Button
            disabled={saving()}
            size="sm"
            variant="secondary"
            onClick={createProfile}
          >
            New
          </Button>
          <Button
            disabled={saving()}
            size="sm"
            onClick={() => void saveSelected()}
          >
            <Save class="button__icon" />
            Save
          </Button>
        </AppShellHeaderRight>
      </AppShellHeader>

      <AppShellBody>
        <div class="skills-body">
          <div class="skills-profile-dropdown">
            <span>Profile</span>
            <Select
              class="skills-profile-dropdown__select"
              value={[selectedId()]}
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
                    <SelectItem value={profile.id}>{profile.label}</SelectItem>
                  )}
                </For>
              </SelectContent>
            </Select>
          </div>

          <section class="skills-editor">
            <Show when={error()}>
              {(message) => <div class="skills-error">{message()}</div>}
            </Show>

            <CardFrame>
              <CardFrameHeader class="skills-frame-header">
                <CardFrameTitle>Details</CardFrameTitle>
                <AlertDialog>
                  <AlertDialogTrigger
                    asChild={(triggerProps) => (
                      <Button
                        {...(triggerProps({
                          class: "skills-profile-delete",
                          disabled:
                            saving() ||
                            selectedId() === DEFAULT_COMBAT_PROFILE_ID,
                          size: "sm",
                          variant: "ghost",
                        } as ButtonProps) as ButtonProps)}
                      >
                        Delete profile
                      </Button>
                    )}
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete profile</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete {selectedProfile()?.label ?? "this profile"}?
                        This skill profile will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={saving()}
                        variant="destructive"
                        onClick={() => void deleteSelected()}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFrameHeader>
              <Card>
                <CardContent class="skills-form">
                  <label>
                    <span>Name</span>
                    <Input
                      value={label()}
                      onInput={(event) => setLabel(event.currentTarget.value)}
                    />
                  </label>
                  <label>
                    <span>Class name</span>
                    <Input
                      placeholder="Any class"
                      value={className()}
                      onInput={(event) =>
                        setClassName(event.currentTarget.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Role</span>
                    <Input
                      value={role()}
                      onInput={(event) => setRole(event.currentTarget.value)}
                    />
                  </label>
                  <label>
                    <span>Delay (ms)</span>
                    <Input
                      inputMode="numeric"
                      value={delayMs()}
                      onInput={(event) => setDelayMs(event.currentTarget.value)}
                    />
                  </label>
                </CardContent>
              </Card>
            </CardFrame>

            <CardFrame>
              <CardFrameHeader class="skills-frame-header">
                <CardFrameTitle>Triggers</CardFrameTitle>
                <Button
                  class="skills-add-skill-button"
                  size="sm"
                  variant="ghost"
                  onClick={addAnimationTrigger}
                >
                  + Trigger
                </Button>
              </CardFrameHeader>
              <Card>
                <CardContent class="skills-triggers">
                  <Show
                    when={draftAnimationTriggers().length > 0}
                    fallback={
                      <div class="skills-empty-rule">
                        No animation triggers.
                      </div>
                    }
                  >
                    <Index each={draftAnimationTriggers()}>
                      {(trigger, triggerIndex) => (
                        <div class="skills-trigger">
                          <label>
                            <span>Message</span>
                            <Input
                              value={trigger().messageIncludes}
                              placeholder="message text"
                              onInput={(event) =>
                                updateAnimationTrigger(
                                  triggerIndex,
                                  (current) => ({
                                    ...current,
                                    messageIncludes: event.currentTarget.value,
                                  }),
                                )
                              }
                            />
                          </label>
                          <label>
                            <span>Skill</span>
                            <Select
                              class="skills-select skills-select--skill"
                              value={[String(trigger().skill)]}
                              onValueChange={(details) =>
                                updateAnimationTrigger(
                                  triggerIndex,
                                  (current) => ({
                                    ...current,
                                    skill: Number.parseInt(
                                      details.value[0] ?? "5",
                                      10,
                                    ),
                                  }),
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Skill" />
                              </SelectTrigger>
                              <SelectContent>
                                <For each={skillIndices}>
                                  {(skill) => (
                                    <SelectItem value={String(skill)}>
                                      {skill}
                                    </SelectItem>
                                  )}
                                </For>
                              </SelectContent>
                            </Select>
                          </label>
                          <label>
                            <SkillsLabelHelp
                              label="Cooldown (ms)"
                              tooltip="Minimum time before this trigger can cast again. Leave empty or 0 to allow every matching message."
                            />
                            <Input
                              inputMode="numeric"
                              value={String(trigger().cooldownMs ?? "")}
                              placeholder="0"
                              onInput={(event) =>
                                updateAnimationTrigger(
                                  triggerIndex,
                                  (current) => {
                                    const parsed = Number.parseInt(
                                      event.currentTarget.value,
                                      10,
                                    );
                                    if (Number.isFinite(parsed) && parsed > 0) {
                                      return { ...current, cooldownMs: parsed };
                                    }

                                    const { cooldownMs: _cooldownMs, ...rest } =
                                      current;
                                    return rest;
                                  },
                                )
                              }
                            />
                          </label>
                          <Button
                            aria-label="Remove trigger"
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeAnimationTrigger(triggerIndex)}
                          >
                            <X class="button__icon" />
                          </Button>
                        </div>
                      )}
                    </Index>
                  </Show>
                </CardContent>
              </Card>
            </CardFrame>

            <CardFrame>
              <CardFrameHeader class="skills-frame-header">
                <CardFrameTitle>Rotation</CardFrameTitle>
                <Button
                  class="skills-add-skill-button"
                  size="sm"
                  variant="ghost"
                  onClick={addStep}
                >
                  + Skill
                </Button>
              </CardFrameHeader>
              <Card>
                <CardContent class="skills-steps">
                  <Index each={draftSteps()}>
                    {(step, stepIndex) => (
                      <div class="skills-step">
                        <div class="skills-step__header">
                          <label class="skills-inline-field">
                            <span>Skill</span>
                            <Select
                              class="skills-select skills-select--skill"
                              value={[String(step().skill)]}
                              onValueChange={(details) =>
                                updateStepSkill(
                                  stepIndex,
                                  Number.parseInt(details.value[0] ?? "1", 10),
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Skill" />
                              </SelectTrigger>
                              <SelectContent>
                                <For each={skillIndices}>
                                  {(skill) => (
                                    <SelectItem value={String(skill)}>
                                      {skill}
                                    </SelectItem>
                                  )}
                                </For>
                              </SelectContent>
                            </Select>
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addCondition(stepIndex)}
                          >
                            + Rule
                          </Button>
                          <Button
                            aria-label={`Remove skill ${step().skill}`}
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeStep(stepIndex)}
                          >
                            <X class="button__icon" />
                          </Button>
                        </div>
                        <div class="skills-rules">
                          <Show
                            when={step().conditions.length > 0}
                            fallback={
                              <div class="skills-empty-rule">
                                This skill has no rules and can run whenever it
                                is ready.
                              </div>
                            }
                          >
                            <Index each={step().conditions}>
                              {(condition, conditionIndex) => (
                                <div class="skills-rule">
                                  <Select
                                    class="skills-select"
                                    value={[condition().type]}
                                    onValueChange={(details) =>
                                      updateConditionType(
                                        stepIndex,
                                        conditionIndex,
                                        (details.value[0] ??
                                          "self-hp") as ConditionType,
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Rule type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <For each={conditionTypes}>
                                        {(option) => (
                                          <SelectItem value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        )}
                                      </For>
                                    </SelectContent>
                                  </Select>
                                  <Show when={!isStatCondition(condition())}>
                                    <Input
                                      placeholder="Aura name"
                                      value={auraNameValue(condition())}
                                      onInput={(event) =>
                                        updateCondition(
                                          stepIndex,
                                          conditionIndex,
                                          (current) =>
                                            isStatCondition(current)
                                              ? current
                                              : {
                                                  ...current,
                                                  auraName:
                                                    event.currentTarget.value,
                                                },
                                        )
                                      }
                                    />
                                  </Show>
                                  <Select
                                    class="skills-select skills-select--op"
                                    value={[condition().op]}
                                    onValueChange={(details) =>
                                      updateCondition(
                                        stepIndex,
                                        conditionIndex,
                                        (current) => ({
                                          ...current,
                                          op: (details.value[0] ?? "<=") as
                                            | "<="
                                            | ">=",
                                        }),
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Op" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="<=">&lt;=</SelectItem>
                                      <SelectItem value=">=">&gt;=</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    inputMode="numeric"
                                    value={String(condition().value)}
                                    onInput={(event) =>
                                      updateCondition(
                                        stepIndex,
                                        conditionIndex,
                                        (current) => ({
                                          ...current,
                                          value: clampRuleValue(
                                            event.currentTarget.value,
                                          ),
                                        }),
                                      )
                                    }
                                  />
                                  <Show when={isStatCondition(condition())}>
                                    <Select
                                      class="skills-select skills-select--unit"
                                      value={[conditionUnitValue(condition())]}
                                      onValueChange={(details) =>
                                        updateCondition(
                                          stepIndex,
                                          conditionIndex,
                                          (current) =>
                                            isStatCondition(current)
                                              ? {
                                                  ...current,
                                                  unit: (details.value[0] ??
                                                    "percent") as
                                                    | "percent"
                                                    | "value",
                                                }
                                              : current,
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percent">
                                          %
                                        </SelectItem>
                                        <SelectItem value="value">
                                          Value
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </Show>
                                  <Button
                                    aria-label={`Remove rule ${conditionLabel(condition())}`}
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() =>
                                      removeCondition(stepIndex, conditionIndex)
                                    }
                                  >
                                    <X class="button__icon" />
                                  </Button>
                                </div>
                              )}
                            </Index>
                          </Show>
                        </div>
                      </div>
                    )}
                  </Index>
                </CardContent>
              </Card>
            </CardFrame>
          </section>
        </div>
      </AppShellBody>
    </AppShell>
  );
}

mountWindow(() => <App />);
