<script lang="ts">
  import {
    Alert,
    AppFrame,
    Button,
    Card,
    Icon,
    Input,
    Label,
    NumberField,
    Select,
    Separator,
    VirtualList,
  } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

  import { Result } from "better-result";
  import { SvelteSet } from "svelte/reactivity";

  import {
    type GrabbedData,
    GrabberDataType,
    LoaderDataType,
    type LoaderGrabberLoadRequest,
  } from "~/shared/loader-grabber/types";
  import { client } from "~/shared/tipc";
  import { type TreeItem, grabberBuilders } from "./tree-builders";

  type FlattenedItem = TreeItem & {
    index: number;
    level: number;
    nodeId: string;
  };

  type LoaderOption = {
    label: string;
    requiresId: boolean;
    value: LoaderDataType;
  };
  type GrabberOption = {
    label: string;
    value: GrabberDataType;
  };

  const loaderOptions: LoaderOption[] = [
    { value: LoaderDataType.HairShop, label: "Hair shop", requiresId: true },
    { value: LoaderDataType.Shop, label: "Shop", requiresId: true },
    { value: LoaderDataType.Quest, label: "Quest", requiresId: true },
    {
      value: LoaderDataType.ArmorCustomizer,
      label: "Armor customizer",
      requiresId: false,
    },
  ];
  const grabberOptions: GrabberOption[] = [
    { value: GrabberDataType.Shop, label: "Shop items" },
    { value: GrabberDataType.Quest, label: "Quests" },
    { value: GrabberDataType.Inventory, label: "Inventory" },
    { value: GrabberDataType.TempInventory, label: "Temp inventory" },
    { value: GrabberDataType.Bank, label: "Bank" },
    { value: GrabberDataType.CellMonsters, label: "Cell monsters" },
    { value: GrabberDataType.MapMonsters, label: "Map monsters" },
  ];

  const loaderOptionsByValue = new Map(
    loaderOptions.map((option) => [option.value, option]),
  );
  const grabberOptionsByValue = new Map(
    grabberOptions.map((option) => [option.value, option]),
  );

  function getLoaderOption(value: LoaderDataType | null): LoaderOption | null {
    if (value === null) return null;
    return loaderOptionsByValue.get(value) ?? null;
  }

  function getGrabberOption(
    value: GrabberDataType | null,
  ): GrabberOption | null {
    if (value === null) return null;
    return grabberOptionsByValue.get(value) ?? null;
  }

  function requiresLoaderId(value: LoaderDataType | null): boolean {
    const option = getLoaderOption(value);
    return option?.requiresId ?? false;
  }

  let loaderId = $state(0);
  let loaderType = $state<LoaderDataType | null>(null);
  let grabberType = $state<GrabberDataType | null>(null);
  let grabbedData = $state<GrabbedData | null>(null);
  let treeData = $state<TreeItem[]>([]);
  const expandedNodes = new SvelteSet<string>();
  let nodeIdMap = new WeakMap<TreeItem, string>();
  let nodeIdCounter = 0;
  let isLoading = $state<boolean>(false);
  let searchQuery = $state("");
  let debouncedSearchQuery = $state("");
  let error = $state<string | null>(null);

  $effect(() => {
    const query = searchQuery;
    if (!query) {
      debouncedSearchQuery = "";
      return;
    }

    // For very short queries, we debounce to prevent the search from being too fast
    // which is especially noticeable when the source data is large
    const delay = query.length <= 3 ? 300 : 150;
    const timeout = setTimeout(() => {
      debouncedSearchQuery = query;
    }, delay);
    return () => clearTimeout(timeout);
  });

  const normalizedQuery = $derived(debouncedSearchQuery.trim());
  const queryLower = $derived(normalizedQuery.toLowerCase());
  const searchActive = $derived(normalizedQuery.length > 0);
  const searchRegex = $derived(
    searchActive
      ? new RegExp(`(${escapeRegExp(normalizedQuery)})`, "gi")
      : null,
  );
  const visibleState = $derived(
    buildVisibleItems(treeData, expandedNodes, queryLower),
  );
  const visibleItems = $derived(visibleState.items);
  const matchedRootCount = $derived(visibleState.matchedRootCount);
  const autoExpanded = $derived(visibleState.autoExpanded);
  let copiedNodeId = $state<string | null>(null);

  async function handleLoad() {
    if (loaderType === null) return;
    if (requiresLoaderId(loaderType) && !loaderId) return;
    error = null;
    try {
      const input: LoaderGrabberLoadRequest =
        loaderType === LoaderDataType.ArmorCustomizer
          ? { type: loaderType }
          : { type: loaderType, id: loaderId };
      await client.loaderGrabber.load(input);
    } catch (error_) {
      error = "Failed to load data";
      console.error("Error loading data", error_);
    }
  }

  async function handleGrab() {
    if (grabberType === null) return;
    error = null;
    isLoading = true;
    try {
      const serialized = await client.loaderGrabber.grab({
        type: grabberType,
      });
      const result = Result.deserialize<GrabbedData | null, unknown>(
        serialized,
      );
      if (result.isOk() && result.value) {
        const data = result.value;
        grabbedData = data;
        expandedNodes.clear();
        resetNodeIds();
        const builder = grabberBuilders[grabberType];
        treeData = builder(data);
      }
    } catch (error_) {
      error = "Failed to grab data";
      console.error("Error grabbing data", error_);
    } finally {
      isLoading = false;
    }
  }

  function handleExport() {
    if (!grabbedData) return;
    const dataStr = JSON.stringify(grabbedData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function resetNodeIds() {
    nodeIdMap = new WeakMap();
    nodeIdCounter = 0;
  }

  function getNodeId(item: TreeItem) {
    const existing = nodeIdMap.get(item);
    if (existing) return existing;
    const id = `node-${nodeIdCounter++}`;
    nodeIdMap.set(item, id);
    return id;
  }

  function escapeRegExp(value: string) {
    return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&");
  }

  function nodeMatchesQuery(item: TreeItem, query: string) {
    if (!query) return true;
    const name = item.name?.toLowerCase() ?? "";
    if (name.includes(query)) return true;
    const value = item.value?.toLowerCase() ?? "";
    return value.includes(query);
  }

  function buildVisibleItems(
    data: TreeItem[],
    expandedNodes: Set<string>,
    query: string,
  ): {
    autoExpanded: Set<string>;
    items: FlattenedItem[];
    matchedRootCount: number;
  } {
    const items: FlattenedItem[] = [];
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const autoExpanded = new Set<string>();
    if (!data.length) {
      return { items, matchedRootCount: 0, autoExpanded };
    }

    const hasQuery = query.length > 0;
    if (hasQuery) {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const matchMap = new Map<string, boolean>();
      const computeMatches = (node: TreeItem): boolean => {
        const nodeId = getNodeId(node);
        const selfMatches = nodeMatchesQuery(node, query);
        let childMatches = false;
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            if (computeMatches(child)) childMatches = true;
          }
        }
        const matches = selfMatches || childMatches;
        matchMap.set(nodeId, matches);
        if (childMatches) autoExpanded.add(nodeId);
        return matches;
      };

      let matchedRootCount = 0;
      for (const root of data) {
        if (computeMatches(root)) matchedRootCount += 1;
      }

      let index = 0;
      const build = (node: TreeItem, level: number) => {
        const nodeId = getNodeId(node);
        if (!matchMap.get(nodeId)) return;
        items.push({ ...node, level, nodeId, index: index++ });
        if (
          node.children &&
          node.children.length > 0 &&
          autoExpanded.has(nodeId)
        ) {
          for (const child of node.children) build(child, level + 1);
        }
      };

      for (const root of data) build(root, 0);
      return { items, matchedRootCount, autoExpanded };
    }

    let index = 0;
    const build = (node: TreeItem, level: number) => {
      const nodeId = getNodeId(node);
      items.push({ ...node, level, nodeId, index: index++ });
      if (
        node.children &&
        node.children.length > 0 &&
        expandedNodes.has(nodeId)
      ) {
        for (const child of node.children) build(child, level + 1);
      }
    };
    for (const root of data) build(root, 0);
    return { items, matchedRootCount: data.length, autoExpanded };
  }

  async function copyValue(nodeId: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      copiedNodeId = nodeId;
      setTimeout(() => {
        if (copiedNodeId === nodeId) copiedNodeId = null;
      }, 1_500);
    } catch (error) {
      console.error("Failed to copy value", error);
    }
  }

  async function copyNodeJson(item: FlattenedItem) {
    const data = JSON.stringify(
      item,
      (key, value) => {
        // Skip these fields when copying
        if (key === "nodeId" || key === "level" || key === "index")
          return undefined;
        return value;
      },
      2,
    );
    await copyValue(item.nodeId, data);
  }
</script>

<AppFrame.Root>
  <AppFrame.Header title="Loader Grabber">
    {#snippet right()}{/snippet}
  </AppFrame.Header>

  <AppFrame.Body scroll={false} maxWidth="max-w-6xl">
    <div class="flex h-full flex-col gap-4">
      {#if error}
        <Alert.Root variant="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      {/if}

      <div class="grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2">
        <Card.Root
          class="overflow-hidden rounded-xl border-border/40 shadow-none"
        >
          <Card.Header
            class="flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
          >
            <Card.Title class="text-xs font-semibold text-foreground/70"
              >Loader</Card.Title
            >
          </Card.Header>
          <Card.Content class="flex flex-col gap-4 p-3.5">
            <div class="flex items-end gap-3">
              <div class="flex w-24 flex-col gap-1.5">
                <Label
                  for="loader-id"
                  class="text-xs font-semibold text-foreground/80">ID</Label
                >
                <NumberField.Root
                  bind:value={loaderId}
                  min={1}
                  max={Number.MAX_SAFE_INTEGER}
                  class="gap-1"
                >
                  <NumberField.Group class="h-7 bg-input/20">
                    <NumberField.Input
                      id="loader-id"
                      class="text-center font-mono text-xs"
                      autocomplete="off"
                      placeholder="ID"
                    />
                  </NumberField.Group>
                </NumberField.Root>
              </div>

              <div class="flex flex-1 flex-col gap-1.5">
                <Label class="text-xs font-semibold text-foreground/80"
                  >Source</Label
                >
                <Select.Root bind:value={loaderType}>
                  <Select.Trigger
                    size="sm"
                    class="h-7 w-full border-input bg-input/20 px-2 text-xs"
                  >
                    {@const loaderOption = getLoaderOption(loaderType)}
                    <span
                      class={cn(
                        "truncate text-xs/relaxed",
                        !loaderOption && "text-muted-foreground",
                      )}
                    >
                      {loaderOption?.label ?? ""}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each loaderOptions as option (option.value)}
                      <Select.Item value={option.value} class="text-xs">
                        {option.label}
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <Button
                onclick={handleLoad}
                disabled={loaderType === null ||
                  (requiresLoaderId(loaderType) && !loaderId)}
                class="h-7 px-4 text-xs shadow-none transition-all"
              >
                Load
              </Button>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root
          class="overflow-hidden rounded-xl border-border/40 shadow-none"
        >
          <Card.Header
            class="flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
          >
            <div class="flex items-center gap-2">
              <Card.Title class="text-xs font-semibold text-foreground/70"
                >Grabber</Card.Title
              >
              <span
                class="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-blue-500/80"
              >
                {grabbedData ? matchedRootCount : 0}
              </span>
            </div>

            <div class="relative">
              <Icon
                icon="search"
                class="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50"
              />
              <Input
                type="search"
                placeholder="Search..."
                class="h-6 w-48 border-input bg-input/20 pl-7 text-[11px] transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
                bind:value={searchQuery}
                disabled={!grabbedData}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              class="h-7 gap-1.5 border-border/40 px-2.5 text-[11px]"
              onclick={handleExport}
              disabled={!grabbedData}
            >
              <Icon icon="download" size="sm" />
              Export
            </Button>
          </Card.Header>
          <Card.Content class="flex flex-col gap-4 p-3.5">
            <div class="flex items-end gap-3">
              <div class="flex flex-1 flex-col gap-1.5">
                <Label class="text-xs font-semibold text-foreground/80"
                  >Source</Label
                >
                <Select.Root bind:value={grabberType}>
                  <Select.Trigger
                    size="sm"
                    class="h-7 w-full border-input bg-input/20 px-2 text-xs"
                  >
                    {@const grabberOption = getGrabberOption(grabberType)}
                    <span
                      class={cn(
                        "truncate text-xs/relaxed",
                        !grabberOption && "text-muted-foreground",
                      )}
                    >
                      {grabberOption?.label ?? ""}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each grabberOptions as option (option.value)}
                      <Select.Item value={option.value} class="text-xs">
                        {option.label}
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <Button
                onclick={handleGrab}
                disabled={grabberType === null || isLoading}
                class="h-7 min-w-[80px] px-4 text-xs shadow-none transition-all"
              >
                {#if isLoading}
                  <Icon icon="loader" size="sm" spin />
                {:else}
                  Grab
                {/if}
              </Button>
            </div>
            <div class="relative h-[50vh] p-0">
              {#if !isLoading}
                <div class="h-full">
                  <VirtualList
                    data={visibleItems}
                    key="nodeId"
                    estimateSize={28}
                    overflow={2}
                    class="no-scrollbar"
                  >
                    {#snippet children({ data: item })}
                      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression, sonarjs/no-use-of-empty-return-value -->
                      {@render TreeNode(item)}
                    {/snippet}
                  </VirtualList>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </AppFrame.Body>
</AppFrame.Root>

{#snippet TreeNode(item: FlattenedItem)}
  {@const hasChildren = item.children && item.children.length > 0}
  {@const isAutoExpanded = searchActive && autoExpanded.has(item.nodeId)}
  {@const isExpanded = searchActive
    ? isAutoExpanded
    : expandedNodes.has(item.nodeId)}
  {@const canToggle = hasChildren && !searchActive}
  {@const showChildrenToggle = searchActive ? isAutoExpanded : hasChildren}
  {@const inputHandler = () => {
    if (!canToggle) return;
    if (isExpanded) {
      expandedNodes.delete(item.nodeId);
    } else {
      expandedNodes.add(item.nodeId);
    }
  }}
  {@const hasValue =
    item.value !== undefined &&
    item.value !== "undefined" &&
    item.value !== "null" &&
    item.value !== ""}
  {@const isCopied = copiedNodeId === item.nodeId}

  <div class="group/row relative select-none">
    {#if item.level > 0}
      {#each Array.from({ length: item.level }) as _, i (i)}
        <div
          class="absolute top-0 h-full border-l border-border/10"
          style="left: {i * 16 + 18}px"
        ></div>
      {/each}
      <!-- Connector line for leaf nodes -->
      {#if !hasChildren}
        <div
          class="absolute top-1/2 h-[1px] bg-border/10"
          style="left: {(item.level - 1) * 16 + 18}px; width: 24px;"
        ></div>
      {/if}
    {/if}

    <div
      class={cn(
        "group relative flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-xs transition-all",
        canToggle ? "hover:bg-secondary/40" : "cursor-default",
        isExpanded && hasChildren && "bg-secondary/20",
      )}
      onclick={inputHandler}
      onkeydown={(ev) => ev.key === "Enter" && inputHandler()}
      style="padding-left: {item.level * 16 + 8}px"
      role="button"
      tabindex="0"
    >
      {#if showChildrenToggle}
        <div
          class="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center"
        >
          <Icon
            icon="chevron_right"
            class={cn(
              "h-3 w-3 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90 text-foreground",
            )}
          />
        </div>
      {:else}
        <!-- Spacer to maintain alignment with siblings -->
        <div class="mt-0.5 h-3.5 w-3.5 flex-shrink-0"></div>
      {/if}

      <div class="flex min-w-0 flex-1 items-center gap-1.5 leading-relaxed">
        {#if hasChildren}
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <span class="flex-shrink-0 truncate font-medium text-foreground">
              {#if searchRegex}
                {@const parts = item.name.split(searchRegex)}
                {#each parts as part, index (index)}
                  {#if part.toLowerCase() === queryLower}
                    <mark
                      class="rounded-sm bg-primary/20 px-0.5 text-foreground"
                      >{part}</mark
                    >
                  {:else}
                    {part}
                  {/if}
                {/each}
              {:else}
                {item.name}
              {/if}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class={cn(
              "h-5 w-5 rounded-sm shadow-none transition-all hover:bg-muted",
              isCopied && "text-success",
            )}
            onclick={async (ev) => {
              ev.stopPropagation();
              await copyNodeJson(item);
            }}
            title="Copy JSON"
          >
            {#if isCopied}
              <Icon icon="check" size="xs" />
            {:else}
              <Icon icon="copy" size="xs" />
            {/if}
          </Button>
        {:else if !hasChildren && item.name}
          <span
            class="flex-shrink-0 truncate font-medium text-muted-foreground"
          >
            {#if searchRegex}
              {@const parts = item.name.split(searchRegex)}
              {#each parts as part, index (index)}
                {#if part.toLowerCase() === queryLower}
                  <mark class="rounded-sm bg-primary/20 px-0.5 text-foreground"
                    >{part}</mark
                  >
                {:else}
                  {part}
                {/if}
              {/each}
            {:else}
              {item.name}
            {/if}
          </span>
        {/if}

        {#if hasValue}
          <button
            class={cn(
              "inline-flex min-w-0 items-center gap-1.5 truncate rounded-sm px-1.5 py-0.5 font-mono text-[11px] transition-all",
              "bg-muted/30 text-foreground ring-1 ring-border/20 hover:bg-muted/50 hover:ring-border/40",
              isCopied && "bg-success/10 text-success ring-success/30",
            )}
            title="Click to copy"
            onclick={async (ev) => {
              ev.stopPropagation();
              await copyValue(item.nodeId, item.value!);
            }}
          >
            {#if isCopied}
              <Icon icon="check" size="xs" class="flex-shrink-0" />
            {/if}
            <span class="truncate">{item.value}</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/snippet}
