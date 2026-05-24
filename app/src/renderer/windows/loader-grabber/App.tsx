/* @refresh reload */
import "../../polyfills";
import "./style.css";
import { createHotkey } from "@tanstack/solid-hotkeys";
import { createVirtualizer } from "@tanstack/solid-virtual";
import {
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellTitle,
  Button,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type IconButtonProps,
} from "@vexed/ui";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type JSX,
} from "solid-js";
import {
  LoaderGrabberGrabTypes,
  LoaderGrabberLoadTypes,
  isLoaderGrabberGrabType,
  isLoaderGrabberLoadType,
  loaderGrabberLoadRequiresId,
  normalizeLoaderGrabberGrabRequest,
  normalizeLoaderGrabberLoadRequest,
  type GrabbedData,
  type LoaderGrabberGrabType,
  type LoaderGrabberLoadType,
} from "../../../shared/loader-grabber";
import { mountWindow } from "../mount";
import {
  buildGrabbedDataTree,
  buildVisibleTreeItems,
  toTreeJson,
  type FlattenedTreeItem,
} from "./tree";

interface SourceOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

interface TextSegment {
  readonly match: boolean;
  readonly text: string;
}

const TREE_ROW_HEIGHT = 30;
const SOURCE_SELECT_GUTTER = 4;

const loaderLabels: Record<LoaderGrabberLoadType, string> = {
  "armor-customizer": "Armor customizer",
  "hair-shop": "Hair shop",
  quest: "Quest",
  shop: "Shop",
};

const grabberLabels: Record<LoaderGrabberGrabType, string> = {
  bank: "Bank",
  "cell-monsters": "Cell monsters",
  inventory: "Inventory",
  "map-monsters": "Map monsters",
  quest: "Quests",
  shop: "Shop items",
  "temp-inventory": "Temp inventory",
};

const loaderOptions: readonly SourceOption<LoaderGrabberLoadType>[] =
  LoaderGrabberLoadTypes.map((value) => ({
    label: loaderLabels[value],
    value,
  }));

const grabberOptions: readonly SourceOption<LoaderGrabberGrabType>[] =
  LoaderGrabberGrabTypes.map((value) => ({
    label: grabberLabels[value],
    value,
  }));

const escapeRegExp = (value: string): string =>
  value.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");

const splitMatches = (value: string, query: string): readonly TextSegment[] => {
  if (query === "") {
    return [{ match: false, text: value }];
  }

  const matcher = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return value
    .split(matcher)
    .filter((part) => part !== "")
    .map((part) => ({
      match: part.toLocaleLowerCase() === query.toLocaleLowerCase(),
      text: part,
    }));
};

const downloadJson = (filename: string, data: unknown): void => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const operationErrorMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error && cause.message !== "" ? cause.message : fallback;

const preventPointerFocus: JSX.EventHandler<HTMLElement, PointerEvent> = (
  event,
) => {
  if (event.pointerType !== "keyboard") {
    event.preventDefault();
  }
};

const updateSourceSelectPosition =
  (triggerId: string) =>
  ({
    floatingElement,
  }: {
    readonly floatingElement: HTMLElement | null;
  }): void => {
    const trigger = document.getElementById(triggerId);
    if (!trigger || !floatingElement) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const content = floatingElement.firstElementChild;
    const contentHeight =
      content instanceof HTMLElement
        ? content.getBoundingClientRect().height || content.scrollHeight
        : floatingElement.getBoundingClientRect().height;
    const bottomY = triggerRect.bottom + SOURCE_SELECT_GUTTER;
    const topY = Math.max(
      SOURCE_SELECT_GUTTER,
      triggerRect.top - contentHeight - SOURCE_SELECT_GUTTER,
    );
    const hasMoreSpaceAbove =
      triggerRect.top > viewportHeight - triggerRect.bottom;
    const shouldOpenAbove =
      bottomY + contentHeight > viewportHeight && hasMoreSpaceAbove;
    const y = shouldOpenAbove ? topY : bottomY;
    const x = Math.min(
      Math.max(SOURCE_SELECT_GUTTER, triggerRect.left),
      Math.max(SOURCE_SELECT_GUTTER, viewportWidth - triggerRect.width),
    );
    const availableHeight = shouldOpenAbove
      ? Math.max(0, triggerRect.top - SOURCE_SELECT_GUTTER)
      : Math.max(0, viewportHeight - y - SOURCE_SELECT_GUTTER);

    floatingElement.style.setProperty("--x", `${Math.round(x)}px`);
    floatingElement.style.setProperty("--y", `${Math.round(y)}px`);
    floatingElement.style.setProperty(
      "--reference-width",
      `${Math.round(triggerRect.width)}px`,
    );
    floatingElement.style.setProperty(
      "--available-width",
      `${Math.max(0, viewportWidth - SOURCE_SELECT_GUTTER * 2)}px`,
    );
    floatingElement.style.setProperty(
      "--available-height",
      `${Math.round(availableHeight)}px`,
    );
    floatingElement.style.setProperty("--z-index", "60");
  };

function Panel(props: {
  readonly action?: JSX.Element;
  readonly children: JSX.Element;
  readonly title: string;
  readonly titleAccessory?: JSX.Element;
}): JSX.Element {
  return (
    <CardFrame class="loader-grabber-panel">
      <CardFrameHeader class="loader-grabber-panel__header">
        <div class="loader-grabber-panel__heading">
          <CardFrameTitle class="loader-grabber-panel__title">
            {props.title}
          </CardFrameTitle>
          <Show when={props.titleAccessory}>
            {(accessory) => (
              <div class="loader-grabber-panel__title-accessory">
                {accessory()}
              </div>
            )}
          </Show>
        </div>
        <Show when={props.action}>
          {(action) => (
            <div class="loader-grabber-panel__actions">{action()}</div>
          )}
        </Show>
      </CardFrameHeader>
      <Card class="loader-grabber-panel__body">
        <CardContent class="loader-grabber-panel__content">
          {props.children}
        </CardContent>
      </Card>
    </CardFrame>
  );
}

function TooltipIconButton(props: {
  readonly "aria-label": string;
  readonly children: JSX.Element;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly onClick: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
  readonly tooltip: string;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <TooltipTrigger
        asChild={(triggerProps) => (
          <IconButton
            {...(triggerProps({
              "aria-label": props["aria-label"],
              children: props.children,
              class: props.class,
              disabled: props.disabled,
              onClick: props.onClick,
              size: "icon-sm",
              type: "button",
              variant: "ghost",
            } as IconButtonProps) as IconButtonProps)}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function SourceSelect<T extends string>(props: {
  readonly id: string;
  readonly label: string;
  readonly options: readonly SourceOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}): JSX.Element {
  return (
    <div class="loader-grabber-source">
      <Label for={props.id}>{props.label}</Label>
      <Select
        class="loader-grabber-select"
        items={props.options}
        positioning={{
          fitViewport: true,
          sameWidth: true,
          strategy: "fixed",
          updatePosition: updateSourceSelectPosition(props.id),
        }}
        value={[props.value]}
        onValueChange={(details) => {
          const value = details.value[0];
          if (typeof value === "string") {
            props.onChange(value as T);
          }
        }}
      >
        <SelectTrigger id={props.id}>
          <span class="select__value">
            {props.options.find((option) => option.value === props.value)
              ?.label ?? props.value}
          </span>
        </SelectTrigger>
        <SelectContent>
          <For each={props.options}>
            {(option) => (
              <SelectItem value={option.value}>{option.label}</SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </div>
  );
}

function App(): JSX.Element {
  let searchInput: HTMLInputElement | undefined;
  let treeViewport: HTMLDivElement | undefined;
  let copiedTimer: number | undefined;

  const [loaderType, setLoaderType] =
    createSignal<LoaderGrabberLoadType>("shop");
  const [loaderId, setLoaderId] = createSignal("");
  const [grabberType, setGrabberType] =
    createSignal<LoaderGrabberGrabType>("shop");
  const [grabbedType, setGrabbedType] =
    createSignal<LoaderGrabberGrabType | null>(null);
  const [grabbedData, setGrabbedData] = createSignal<GrabbedData | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = createSignal<
    ReadonlySet<string>
  >(new Set());
  const [loading, setLoading] = createSignal(false);
  const [grabbing, setGrabbing] = createSignal(false);
  const [error, setError] = createSignal("");
  const [notice, setNotice] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [copiedNodeId, setCopiedNodeId] = createSignal<string | null>(null);

  createHotkey(
    "/",
    (event) => {
      if (event.repeat) {
        return;
      }

      searchInput?.focus();
      searchInput?.select();
    },
    {
      conflictBehavior: "replace",
      eventType: "keydown",
      ignoreInputs: true,
    },
  );

  const requiresLoaderId = createMemo(() =>
    loaderGrabberLoadRequiresId(loaderType()),
  );

  const canLoad = createMemo(
    () => !loading() && (!requiresLoaderId() || loaderId().trim() !== ""),
  );

  const treeData = createMemo(() => {
    const type = grabbedType();
    const data = grabbedData();
    return type && data ? buildGrabbedDataTree(type, data) : [];
  });

  const visibleTree = createMemo(() =>
    buildVisibleTreeItems(treeData(), expandedNodeIds(), search()),
  );

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    estimateSize: () => TREE_ROW_HEIGHT,
    get count() {
      return visibleTree().items.length;
    },
    getItemKey: (index) => visibleTree().items[index]?.nodeId ?? index,
    getScrollElement: () => treeViewport ?? null,
    overscan: 12,
  });

  const resultCountLabel = createMemo(() => {
    const roots = treeData().length;
    if (search().trim() !== "") {
      return `${visibleTree().matchedRootCount}/${roots}`;
    }

    return `${roots}`;
  });

  const showVisibleTree = createMemo(() => visibleTree().items.length > 0);
  const canExport = createMemo(
    () => grabbedData() !== null && treeData().length > 0,
  );

  createEffect(() => {
    if (!grabbedData()) {
      setExpandedNodeIds(new Set<string>());
    }
  });

  const setOperationError = (message: string, cause: unknown): void => {
    console.error(message, cause);
    setNotice("");
    setError(operationErrorMessage(cause, message));
  };

  const markCopied = (nodeId: string): void => {
    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
    }

    setCopiedNodeId(nodeId);
    copiedTimer = window.setTimeout(() => {
      setCopiedNodeId((current) => (current === nodeId ? null : current));
      copiedTimer = undefined;
    }, 900);
  };

  const copyText = async (nodeId: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setError("");
      markCopied(nodeId);
    } catch (cause) {
      setOperationError("Copy failed", cause);
    }
  };

  const handleLoad = async (): Promise<void> => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const request = normalizeLoaderGrabberLoadRequest({
        id: loaderId(),
        type: loaderType(),
      });
      await window.ipc.loaderGrabber.load(request);
    } catch (cause) {
      setOperationError("Load failed", cause);
    } finally {
      setLoading(false);
    }
  };

  const handleGrab = async (): Promise<void> => {
    setGrabbing(true);
    setError("");
    setNotice("");

    try {
      const request = normalizeLoaderGrabberGrabRequest({
        type: grabberType(),
      });
      const data = await window.ipc.loaderGrabber.grab(request);
      setGrabbedType(request.type);
      setGrabbedData(data);
      setExpandedNodeIds(new Set<string>());
      setSearch("");
      if (treeViewport) {
        treeViewport.scrollTop = 0;
      }
      if (!data) {
        setNotice("No data");
      }
    } catch (cause) {
      setOperationError("Grab failed", cause);
    } finally {
      setGrabbing(false);
    }
  };

  const clearResults = (): void => {
    setGrabbedData(null);
    setGrabbedType(null);
    setExpandedNodeIds(new Set<string>());
    setSearch("");
    setCopiedNodeId(null);
    setNotice("");
  };

  const exportResults = (): void => {
    const data = grabbedData();
    const type = grabbedType();
    if (!data || !type || !canExport()) {
      return;
    }

    downloadJson(`${type}.json`, data);
  };

  const toggleNode = (nodeId: string): void => {
    if (search().trim() !== "") {
      return;
    }

    setExpandedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderHighlightedText = (value: string): JSX.Element => {
    const query = search().trim();
    if (query === "") {
      return value;
    }

    return (
      <For each={splitMatches(value, query)}>
        {(segment) =>
          segment.match ? (
            <mark class="loader-grabber-tree-row__match">{segment.text}</mark>
          ) : (
            segment.text
          )
        }
      </For>
    );
  };

  const TreeRow = (props: {
    readonly item: FlattenedTreeItem;
  }): JSX.Element => {
    const isSearchActive = () => search().trim() !== "";
    const expanded = () =>
      isSearchActive()
        ? visibleTree().autoExpandedNodeIds.has(props.item.nodeId)
        : expandedNodeIds().has(props.item.nodeId);
    const canToggle = () => props.item.hasChildren && !isSearchActive();
    const copyableValue = () =>
      props.item.value === undefined || props.item.value === ""
        ? undefined
        : props.item.value;
    const copied = () => copiedNodeId() === props.item.nodeId;
    const rowActionLabel = () => {
      const value = copyableValue();
      if (value !== undefined) {
        return copied()
          ? `Copied ${props.item.name} value`
          : `Copy ${props.item.name} value`;
      }

      return canToggle()
        ? `${expanded() ? "Collapse" : "Expand"} ${props.item.name}`
        : undefined;
    };
    const activateRow = (): void => {
      const value = copyableValue();
      if (value !== undefined) {
        void copyText(props.item.nodeId, value);
        return;
      }

      if (canToggle()) {
        toggleNode(props.item.nodeId);
      }
    };

    return (
      <div class="loader-grabber-tree-row">
        <div
          class="loader-grabber-tree-row__main"
          classList={{
            "loader-grabber-tree-row__main--expanded":
              props.item.hasChildren && expanded(),
            "loader-grabber-tree-row__main--toggle": canToggle(),
            "loader-grabber-tree-row__main--copy":
              copyableValue() !== undefined,
          }}
          onKeyDown={(event) => {
            if (!canToggle() && copyableValue() === undefined) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              activateRow();
            }
          }}
          onPointerDown={preventPointerFocus}
          onClick={activateRow}
          role={
            canToggle() || copyableValue() !== undefined ? "button" : undefined
          }
          aria-expanded={canToggle() ? expanded() : undefined}
          aria-label={rowActionLabel()}
          style={{
            "padding-left": `${props.item.level * 16 + 8}px`,
          }}
          tabIndex={
            canToggle() || copyableValue() !== undefined ? 0 : undefined
          }
        >
          <span class="loader-grabber-tree-row__chevron">
            <Show when={props.item.hasChildren}>
              <Icon icon="chevron_right" aria-hidden="true" />
            </Show>
          </span>
          <span class="loader-grabber-tree-row__name">
            {renderHighlightedText(props.item.name)}
            <Show when={props.item.value}>
              <span class="loader-grabber-tree-row__delimiter">:</span>
            </Show>
          </span>
          <Show when={props.item.hasChildren}>
            <TooltipIconButton
              aria-label={copied() ? "Copied JSON" : "Copy JSON"}
              class="loader-grabber-tree-row__copy"
              onClick={(event) => {
                event.stopPropagation();
                void copyText(
                  props.item.nodeId,
                  JSON.stringify(toTreeJson(props.item), null, 2),
                );
              }}
              tooltip={copied() ? "Copied" : "Copy JSON"}
            >
              <Icon
                icon={copied() ? "check" : "file_json"}
                class="button__icon"
                aria-hidden="true"
              />
            </TooltipIconButton>
          </Show>
          <Show when={props.item.value}>
            {(value) => (
              <button
                class="loader-grabber-tree-row__value"
                classList={{
                  "loader-grabber-tree-row__value--copied": copied(),
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  void copyText(props.item.nodeId, value());
                }}
                onPointerDown={preventPointerFocus}
                aria-label={`Copy ${props.item.name} value`}
                title="Copy value"
                type="button"
              >
                <span class="loader-grabber-tree-row__value-text">
                  {renderHighlightedText(value())}
                </span>
                <span
                  class="loader-grabber-tree-row__value-icon-stack"
                  aria-hidden="true"
                >
                  <Icon
                    icon="copy"
                    class="loader-grabber-tree-row__value-icon loader-grabber-tree-row__value-icon--copy"
                  />
                  <Icon
                    icon="check"
                    class="loader-grabber-tree-row__value-icon loader-grabber-tree-row__value-icon--check"
                  />
                </span>
              </button>
            )}
          </Show>
        </div>
      </div>
    );
  };

  onCleanup(() => {
    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
    }
  });

  return (
    <AppShell class="loader-grabber-window">
      <AppShellHeader class="loader-grabber-header" maxWidth={false}>
        <AppShellHeaderLeft>
          <AppShellTitle>Loader Grabber</AppShellTitle>
        </AppShellHeaderLeft>
      </AppShellHeader>
      <AppShellBody class="loader-grabber-body" maxWidth={false}>
        <div class="loader-grabber-shell">
          <Show when={error() || notice()}>
            <div
              class="loader-grabber-message"
              classList={{ "loader-grabber-message--error": error() !== "" }}
            >
              <span>{error() || notice()}</span>
              <IconButton
                aria-label="Dismiss message"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <Icon icon="x" class="button__icon" />
              </IconButton>
            </div>
          </Show>

          <div class="loader-grabber-workspace">
            <div class="loader-grabber-command">
              <Panel title="Load">
                <form
                  class="loader-grabber-command-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleLoad();
                  }}
                >
                  <SourceSelect
                    id="loader-source"
                    label="Source"
                    options={loaderOptions}
                    value={loaderType()}
                    onChange={(value) => {
                      if (isLoaderGrabberLoadType(value)) {
                        setLoaderType(value);
                      }
                    }}
                  />
                  <Show when={requiresLoaderId()}>
                    <div class="loader-grabber-id-field">
                      <Label for="loader-id">ID</Label>
                      <Input
                        autocomplete="off"
                        id="loader-id"
                        inputmode="numeric"
                        min={1}
                        onInput={(event) =>
                          setLoaderId(event.currentTarget.value)
                        }
                        placeholder="ID"
                        type="number"
                        value={loaderId()}
                      />
                    </div>
                  </Show>
                  <Button
                    disabled={!canLoad()}
                    loading={loading()}
                    size="sm"
                    type="submit"
                  >
                    Load
                  </Button>
                </form>
              </Panel>

              <Panel title="Grab">
                <div class="loader-grabber-command-form">
                  <SourceSelect
                    id="grabber-source"
                    label="Source"
                    options={grabberOptions}
                    value={grabberType()}
                    onChange={(value) => {
                      if (isLoaderGrabberGrabType(value)) {
                        setGrabberType(value);
                      }
                    }}
                  />
                  <Button
                    disabled={grabbing()}
                    loading={grabbing()}
                    onClick={() => void handleGrab()}
                    size="sm"
                    type="button"
                  >
                    Grab
                  </Button>
                  <div class="loader-grabber-command-actions">
                    <Button
                      disabled={!canExport()}
                      onClick={exportResults}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Icon icon="download" class="button__icon" />
                      Export
                    </Button>
                    <Button
                      disabled={!grabbedData()}
                      onClick={clearResults}
                      size="sm"
                      type="button"
                      variant="destructive-outline"
                    >
                      <Icon icon="trash_2" class="button__icon" />
                      Clear
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel
              title="Grabbed Data"
              titleAccessory={
                <Show when={grabbedData()}>
                  <span class="loader-grabber-result-count">
                    {resultCountLabel()}
                  </span>
                </Show>
              }
              action={
                <InputGroup class="loader-grabber-search">
                  <InputGroupAddon>
                    <Icon icon="search" aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={(element) => {
                      searchInput = element;
                    }}
                    aria-label="Search results"
                    disabled={!grabbedData()}
                    onInput={(event) => setSearch(event.currentTarget.value)}
                    placeholder="Search results..."
                    type="search"
                    value={search()}
                  />
                  <InputGroupAddon
                    align="inline-end"
                    class="loader-grabber-search__shortcut"
                  >
                    <Kbd>/</Kbd>
                  </InputGroupAddon>
                </InputGroup>
              }
            >
              <div class="loader-grabber-tree" ref={treeViewport}>
                <Show
                  when={showVisibleTree()}
                  fallback={
                    <div
                      class="loader-grabber-empty"
                      classList={{
                        "loader-grabber-empty--busy": grabbing(),
                      }}
                    >
                      <Show
                        when={grabbing()}
                        fallback={
                          grabbedData()
                            ? "No results match this search"
                            : "Grab data to inspect it here"
                        }
                      >
                        Loading data
                      </Show>
                    </div>
                  }
                >
                  <div
                    class="loader-grabber-tree-virtual"
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                    }}
                  >
                    <For each={rowVirtualizer.getVirtualItems()}>
                      {(virtualRow) => {
                        const item = () =>
                          visibleTree().items[virtualRow.index];

                        return (
                          <Show when={item()}>
                            {(treeItem) => (
                              <div
                                class="loader-grabber-tree-virtual__item"
                                style={{
                                  height: `${virtualRow.size}px`,
                                  transform: `translateY(${virtualRow.start}px)`,
                                }}
                              >
                                <TreeRow item={treeItem()} />
                              </div>
                            )}
                          </Show>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            </Panel>
          </div>
        </div>
      </AppShellBody>
    </AppShell>
  );
}

mountWindow(() => <App />);
