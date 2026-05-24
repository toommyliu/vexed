/* @refresh reload */
import "../../polyfills";
import "./style.css";
import {
  Icon,
  AppShell,
  Badge,
  Button,
  Card,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardContent,
  Checkbox,
  IconButton,
  Input,
  Spinner,
} from "@vexed/ui";
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
  EnvironmentItemBuckets,
  createEmptyEnvironmentState,
  type EnvironmentItemBucket,
  type EnvironmentItemRules,
  type EnvironmentQuestAutoRegisterOptions,
  type EnvironmentState,
} from "../../../shared/environment";
import { mountWindow } from "../mount";

const bucketLabels: Record<EnvironmentItemBucket, string> = {
  "ac-member": "AC member-only",
  "ac-non-member": "AC non-member",
  "non-ac-member": "Non-AC member-only",
  "non-ac-non-member": "Non-AC non-member",
};

const splitQuestTokens = (value: string): string[] =>
  value
    .split(/[\s,\n]+/u)
    .map((token) => token.trim())
    .filter(Boolean);

const parseQuestToken = (
  token: string,
): { readonly questId: string; readonly rewardItemId?: string } | null => {
  const [questId, rewardItemId] = token.split(":");
  if (!questId?.trim()) {
    return null;
  }

  return {
    questId: questId.trim(),
    ...(rewardItemId?.trim() ? { rewardItemId: rewardItemId.trim() } : {}),
  };
};

const isQuestToken = (
  token: ReturnType<typeof parseQuestToken>,
): token is NonNullable<ReturnType<typeof parseQuestToken>> => token !== null;

function Panel(props: {
  readonly action?: JSX.Element;
  readonly count: number;
  readonly tone: "quest" | "item" | "boost";
  readonly title: string;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <CardFrame class={`environment-panel environment-panel--${props.tone}`}>
      <CardFrameHeader class="environment-panel__header">
        <div class="environment-panel__title-group">
          <CardFrameTitle class="environment-panel__title">
            {props.title}
          </CardFrameTitle>
          <Badge class="environment-panel__count" variant="default">
            {props.count}
          </Badge>
        </div>
        <Show when={props.action}>
          {(action) => <div class="environment-panel__actions">{action()}</div>}
        </Show>
      </CardFrameHeader>
      <Card class="environment-panel__body">
        <CardContent class="environment-panel__content">
          {props.children}
        </CardContent>
      </Card>
    </CardFrame>
  );
}

function EmptyList(props: { readonly label: string }): JSX.Element {
  return <div class="environment-empty">{props.label}</div>;
}

function App(): JSX.Element {
  const [state, setState] = createSignal<EnvironmentState>(
    createEmptyEnvironmentState(),
  );
  const [questInput, setQuestInput] = createSignal("");
  const [itemInput, setItemInput] = createSignal("");
  const [boostInput, setBoostInput] = createSignal("");
  const [clearingAll, setClearingAll] = createSignal(false);
  const [fetchingBoosts, setFetchingBoosts] = createSignal(false);
  const [syncing, setSyncing] = createSignal(false);
  const [error, setError] = createSignal("");
  const [editingQuestRewardId, setEditingQuestRewardId] = createSignal<
    number | null
  >(null);
  const questRewardInputs = new Map<number, HTMLInputElement>();
  let canceledQuestRewardEdit = false;

  const totalCount = createMemo(
    () =>
      state().questIds.length +
      state().itemNames.length +
      state().boosts.length,
  );

  createEffect(() => {
    const questId = editingQuestRewardId();
    if (questId === null) {
      return;
    }

    window.requestAnimationFrame(() => {
      const input = questRewardInputs.get(questId);
      input?.focus();
      input?.select();
    });
  });

  const runStateUpdate = async (
    update: Promise<EnvironmentState>,
  ): Promise<EnvironmentState | null> => {
    setError("");
    try {
      const nextState = await update;
      setState(nextState);
      return nextState;
    } catch (cause) {
      console.error("Environment update failed:", cause);
      setError(
        cause instanceof Error ? cause.message : "Environment update failed",
      );
      return null;
    }
  };

  const clearAll = async (): Promise<void> => {
    setClearingAll(true);
    try {
      await runStateUpdate(window.ipc.environment.clear());
    } finally {
      setClearingAll(false);
    }
  };

  const addQuests = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const tokens = splitQuestTokens(questInput())
      .map(parseQuestToken)
      .filter(isQuestToken);
    if (tokens.length === 0) {
      setQuestInput("");
      return;
    }

    setQuestInput("");
    for (const token of tokens) {
      await runStateUpdate(
        window.ipc.environment.addQuest(token.questId, token.rewardItemId),
      );
    }
  };

  const updateQuestReward = async (
    questId: number,
    value: string,
  ): Promise<void> => {
    const trimmed = value.trim();
    await runStateUpdate(
      trimmed
        ? window.ipc.environment.setQuestReward(questId, trimmed)
        : window.ipc.environment.clearQuestReward(questId),
    );
  };

  const updateQuestAutoRegister = async (
    options: EnvironmentQuestAutoRegisterOptions,
  ): Promise<void> => {
    await runStateUpdate(window.ipc.environment.setQuestAutoRegister(options));
  };

  const setQuestAutoRegisterOption = async (
    option: keyof EnvironmentQuestAutoRegisterOptions,
    enabled: boolean,
  ): Promise<void> => {
    await updateQuestAutoRegister({
      ...state().questAutoRegister,
      [option]: enabled,
    });
  };

  const showQuestRewardInput = (questId: number): boolean =>
    state().questRewards[questId] !== undefined ||
    editingQuestRewardId() === questId;

  const editQuestReward = (questId: number): void => {
    setEditingQuestRewardId(questId);
  };

  const commitQuestReward = async (
    questId: number,
    value: string,
  ): Promise<void> => {
    setEditingQuestRewardId(null);
    await updateQuestReward(questId, value);
  };

  const cancelQuestRewardEdit: JSX.EventHandler<
    HTMLInputElement,
    KeyboardEvent
  > = (event) => {
    if (event.key === "Escape") {
      canceledQuestRewardEdit = true;
      setEditingQuestRewardId(null);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const updateItemRules = async (
    itemRules: EnvironmentItemRules,
  ): Promise<void> => {
    await runStateUpdate(window.ipc.environment.setItemRules(itemRules));
  };

  const toggleItemBucket = async (
    bucket: EnvironmentItemBucket,
    checked: boolean,
  ): Promise<void> => {
    const buckets = new Set(state().itemRules.buckets);
    if (checked) {
      buckets.add(bucket);
    } else {
      buckets.delete(bucket);
    }

    await updateItemRules({
      ...state().itemRules,
      buckets: EnvironmentItemBuckets.filter((value) => buckets.has(value)),
    });
  };

  const setRejectElse = async (rejectElse: boolean): Promise<void> => {
    await updateItemRules({
      ...state().itemRules,
      rejectElse,
    });
  };

  const addItems = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const item = itemInput().trim();
    setItemInput("");
    if (item) {
      await runStateUpdate(window.ipc.environment.addItem(item));
    }
  };

  const addBoosts = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    const boost = boostInput().trim();
    setBoostInput("");
    if (boost) {
      await runStateUpdate(window.ipc.environment.addBoost(boost));
    }
  };

  const fetchBoosts = async (): Promise<void> => {
    setFetchingBoosts(true);
    setError("");
    try {
      const boosts = await window.ipc.environment.fetchBoosts();
      for (const boost of boosts) {
        await runStateUpdate(window.ipc.environment.addBoost(boost));
      }
    } catch (cause) {
      console.error("Failed to fetch boosts:", cause);
      setError(
        cause instanceof Error ? cause.message : "Failed to fetch boosts",
      );
    } finally {
      setFetchingBoosts(false);
    }
  };

  const syncToAll = async (): Promise<void> => {
    setSyncing(true);
    try {
      await runStateUpdate(window.ipc.environment.syncToAll());
    } finally {
      setSyncing(false);
    }
  };

  onMount(() => {
    const unsubscribe = window.ipc.environment.onChanged(setState);
    onCleanup(unsubscribe);

    void window.ipc.environment
      .getState()
      .then(setState)
      .catch((cause: unknown) => {
        console.error("Failed to load environment state:", cause);
        setError("Failed to load environment state");
      });
  });

  return (
    <AppShell class="environment-app">
      <AppShell.Header class="environment-header">
        <AppShell.HeaderLeft>
          <AppShell.Title>Environment</AppShell.Title>
        </AppShell.HeaderLeft>
        <AppShell.HeaderRight class="environment-header__actions">
          <Button
            variant="outline"
            size="sm"
            disabled={clearingAll() || totalCount() === 0}
            onClick={() => void clearAll()}
          >
            <Icon icon="trash_2" class="button__icon" />
            Clear all
          </Button>
          <Button
            variant="default"
            size="sm"
            aria-busy={syncing()}
            aria-label={syncing() ? "Syncing to all" : "Sync to all"}
            disabled={syncing()}
            onClick={() => void syncToAll()}
          >
            <Show
              when={syncing()}
              fallback={<Icon icon="share_2" class="button__icon" />}
            >
              <Spinner class="environment-sync-spinner" size="sm" />
            </Show>
            Sync to all
          </Button>
        </AppShell.HeaderRight>
      </AppShell.Header>

      <AppShell.Body class="environment-body">
        <section class="environment-shell" aria-label="Environment controls">
          <Show when={error()}>
            {(message) => <div class="environment-error">{message()}</div>}
          </Show>

          <div class="environment-grid">
            <Panel
              title="Drops"
              tone="item"
              count={state().itemNames.length}
              action={
                <Button
                  size="sm"
                  variant="destructive-outline"
                  class="environment-clear-action"
                  aria-label="Clear drops"
                  disabled={state().itemNames.length === 0}
                  onClick={() =>
                    void runStateUpdate(window.ipc.environment.clearItems())
                  }
                >
                  <Icon icon="trash_2" class="button__icon" />
                  Clear
                </Button>
              }
            >
              <div class="environment-drop-rules">
                <div class="environment-bucket-grid">
                  <For each={EnvironmentItemBuckets}>
                    {(bucket) => (
                      <Checkbox
                        class="environment-rule-checkbox"
                        checked={state().itemRules.buckets.includes(bucket)}
                        onChange={(event) =>
                          void toggleItemBucket(
                            bucket,
                            event.currentTarget.checked,
                          )
                        }
                      >
                        {bucketLabels[bucket]}
                      </Checkbox>
                    )}
                  </For>
                </div>
                <Checkbox
                  class="environment-rule-checkbox environment-rule-checkbox--reject"
                  checked={state().itemRules.rejectElse}
                  onChange={(event) =>
                    void setRejectElse(event.currentTarget.checked)
                  }
                >
                  Reject else
                </Checkbox>
              </div>

              <form
                class="environment-entry"
                onSubmit={(event) => void addItems(event)}
              >
                <Input
                  value={itemInput()}
                  placeholder="Item name"
                  autocomplete="off"
                  spellcheck={false}
                  onInput={(event) => setItemInput(event.currentTarget.value)}
                />
                <IconButton
                  type="submit"
                  size="icon"
                  class="environment-icon-action"
                  aria-label="Add drop"
                  disabled={!itemInput().trim()}
                >
                  <Icon icon="plus" class="button__icon" />
                </IconButton>
              </form>

              <div class="environment-list environment-list--drops">
                <Show
                  when={state().itemNames.length > 0}
                  fallback={<EmptyList label="No drops" />}
                >
                  <For each={state().itemNames}>
                    {(item) => (
                      <div class="environment-pill">
                        <span>{item}</span>
                        <IconButton
                          type="button"
                          class="environment-icon-action environment-remove-button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${item}`}
                          onClick={() =>
                            void runStateUpdate(
                              window.ipc.environment.removeItem(item),
                            )
                          }
                        >
                          <Icon icon="x" class="button__icon" />
                        </IconButton>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </Panel>

            <Panel
              title="Quests"
              tone="quest"
              count={state().questIds.length}
              action={
                <Button
                  size="sm"
                  variant="destructive-outline"
                  class="environment-clear-action"
                  aria-label="Clear quests"
                  disabled={state().questIds.length === 0}
                  onClick={() =>
                    void runStateUpdate(window.ipc.environment.clearQuests())
                  }
                >
                  <Icon icon="trash_2" class="button__icon" />
                  Clear
                </Button>
              }
            >
              <div class="environment-quest-rules">
                <Checkbox
                  class="environment-rule-checkbox"
                  checked={state().questAutoRegister.rewards}
                  onChange={(event) =>
                    void setQuestAutoRegisterOption(
                      "rewards",
                      event.currentTarget.checked,
                    )
                  }
                >
                  Auto register rewards
                </Checkbox>
                <Checkbox
                  class="environment-rule-checkbox"
                  checked={state().questAutoRegister.requirements}
                  onChange={(event) =>
                    void setQuestAutoRegisterOption(
                      "requirements",
                      event.currentTarget.checked,
                    )
                  }
                >
                  Auto register requirements
                </Checkbox>
              </div>

              <form
                class="environment-entry"
                onSubmit={(event) => void addQuests(event)}
              >
                <Input
                  value={questInput()}
                  placeholder="Quest ID or quest:itemID"
                  autocomplete="off"
                  onInput={(event) => setQuestInput(event.currentTarget.value)}
                />
                <IconButton
                  type="submit"
                  size="icon"
                  class="environment-icon-action"
                  aria-label="Add quest"
                  disabled={!questInput().trim()}
                >
                  <Icon icon="plus" class="button__icon" />
                </IconButton>
              </form>

              <div class="environment-list environment-list--quests">
                <Show
                  when={state().questIds.length > 0}
                  fallback={<EmptyList label="No quests" />}
                >
                  <For each={state().questIds}>
                    {(questId) => (
                      <div class="environment-pill environment-pill--quest">
                        <button
                          type="button"
                          class="environment-token environment-token--id environment-quest-id-button"
                          aria-label={`Edit reward item ID for quest ${questId}`}
                          title="Double-click to set reward item ID"
                          onDblClick={() => editQuestReward(questId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              editQuestReward(questId);
                            }
                          }}
                        >
                          {questId}
                        </button>
                        <Show when={showQuestRewardInput(questId)}>
                          <span class="environment-quest-separator">:</span>
                          <Input
                            ref={(element) =>
                              questRewardInputs.set(questId, element)
                            }
                            class="environment-reward-input"
                            unstyled
                            value={state().questRewards[questId] ?? ""}
                            placeholder="itemID"
                            inputmode="numeric"
                            onKeyDown={(event) => cancelQuestRewardEdit(event)}
                            onBlur={(event) => {
                              if (canceledQuestRewardEdit) {
                                canceledQuestRewardEdit = false;
                                return;
                              }

                              void commitQuestReward(
                                questId,
                                event.currentTarget.value,
                              );
                            }}
                          />
                        </Show>
                        <IconButton
                          type="button"
                          class="environment-icon-action environment-remove-button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove quest ${questId}`}
                          onClick={() =>
                            void runStateUpdate(
                              window.ipc.environment.removeQuest(questId),
                            )
                          }
                        >
                          <Icon icon="x" class="button__icon" />
                        </IconButton>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </Panel>

            <Panel
              title="Boosts"
              tone="boost"
              count={state().boosts.length}
              action={
                <div class="environment-panel__actions">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Fetch boosts"
                    disabled={fetchingBoosts()}
                    onClick={() => void fetchBoosts()}
                  >
                    <Icon icon="download" class="button__icon" />
                    Fetch
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive-outline"
                    class="environment-clear-action"
                    aria-label="Clear boosts"
                    disabled={state().boosts.length === 0}
                    onClick={() =>
                      void runStateUpdate(window.ipc.environment.clearBoosts())
                    }
                  >
                    <Icon icon="trash_2" class="button__icon" />
                    Clear
                  </Button>
                </div>
              }
            >
              <form
                class="environment-entry"
                onSubmit={(event) => void addBoosts(event)}
              >
                <Input
                  value={boostInput()}
                  placeholder="Boost item name"
                  autocomplete="off"
                  spellcheck={false}
                  onInput={(event) => setBoostInput(event.currentTarget.value)}
                />
                <IconButton
                  type="submit"
                  size="icon"
                  class="environment-icon-action"
                  aria-label="Add boost"
                  disabled={!boostInput().trim()}
                >
                  <Icon icon="plus" class="button__icon" />
                </IconButton>
              </form>

              <div class="environment-list">
                <Show
                  when={state().boosts.length > 0}
                  fallback={<EmptyList label="No boosts" />}
                >
                  <For each={state().boosts}>
                    {(boost) => (
                      <div class="environment-pill">
                        <span>{boost}</span>
                        <IconButton
                          type="button"
                          class="environment-icon-action environment-remove-button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${boost}`}
                          onClick={() =>
                            void runStateUpdate(
                              window.ipc.environment.removeBoost(boost),
                            )
                          }
                        >
                          <Icon icon="x" class="button__icon" />
                        </IconButton>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </Panel>
          </div>
        </section>
      </AppShell.Body>
    </AppShell>
  );
}

mountWindow(() => <App />);
