<script lang="ts">
  import { cn } from "@vexed/ui/util";
  import { Button, Input, Label } from "@vexed/ui";
  import * as NumberField from "@vexed/ui/NumberField";
  import * as Select from "@vexed/ui/Select";
  import * as Tabs from "@vexed/ui/Tabs";
  import { VirtualList } from "@vexed/ui";
  import Download from "@vexed/ui/icons/Download";
  import Loader from "@vexed/ui/icons/Loader";
  import Upload from "@vexed/ui/icons/Upload";
  import Check from "@vexed/ui/icons/Check";
  import ChevronRight from "@vexed/ui/icons/ChevronRight";
  import Search from "@vexed/ui/icons/Search";
  import Copy from "@vexed/ui/icons/Copy";

  import { SvelteSet } from "svelte/reactivity";
  import log from "electron-log";

  import { getEnhancementName, getWeaponProcName } from "@vexed/game";
  import type { QuestInfo, ShopInfo, ItemData, MonsterData } from "@vexed/game";

  import { client } from "~/shared/tipc";
  import { GrabberDataType, LoaderDataType } from "~/shared/types";

  const logger = log.scope("app/loader-grabber");

  type GrabbedData = ShopInfo | QuestInfo[] | ItemData[] | MonsterData[];
  type TreeItem = {
    name: string;
    value?: string;
    children?: TreeItem[];
  };
  type FlattenedItem = TreeItem & {
    level: number;
    nodeId: string;
    index: number;
  };

  function isShopInfo(data: GrabbedData): data is ShopInfo {
    return "items" in data && Array.isArray((data as ShopInfo).items);
  }
  function isQuestDataArray(data: GrabbedData): data is QuestInfo[] {
    return (
      Array.isArray(data) &&
      (data.length === 0 ||
        (data.length > 0 && data[0] != null && "QuestID" in data[0]))
    );
  }
  function isItemDataArray(data: GrabbedData): data is ItemData[] {
    return (
      Array.isArray(data) &&
      (data.length === 0 ||
        (data.length > 0 && data[0] != null && "ItemID" in data[0]))
    );
  }
  function isMonsterDataArray(data: GrabbedData): data is MonsterData[] {
    return (
      Array.isArray(data) &&
      (data.length === 0 ||
        (data.length > 0 && data[0] != null && "MonID" in data[0]))
    );
  }

  let activeTab = $state<"loader" | "grabber">("loader");
  let loaderId = $state(0);
  let loaderType = $state<string>("");
  let grabberType = $state<string>("");
  let grabbedData = $state<GrabbedData | null>(null);
  let treeData = $state<TreeItem[]>([]);
  let expandedNodes = new SvelteSet<string>();
  let isLoading = $state<boolean>(false);
  let searchQuery = $state("");
  let debouncedSearchQuery = $state("");

  $effect(() => {
    const query = searchQuery;
    if (!query) {
      debouncedSearchQuery = "";
      return;
    }

    // for very short queries, we debounce it so it doesn't get too fast
    // esp. if the source data is large
    const delay = query.length <= 3 ? 300 : 150;
    const timeout = setTimeout(() => {
      debouncedSearchQuery = query;
    }, delay);

    return () => clearTimeout(timeout);
  });

  let flattenedItems = $derived(flattenTreeData(treeData, expandedNodes));
  let filteredTreeData = $derived(
    debouncedSearchQuery
      ? treeData.filter((item) => {
          const query = debouncedSearchQuery.toLowerCase();
          return item.name.toLowerCase().includes(query);
        })
      : treeData,
  );
  let filteredItems = $derived(
    debouncedSearchQuery
      ? flattenTreeData(filteredTreeData, expandedNodes)
      : flattenedItems,
  );
  let copiedNodeId = $state<string | null>(null);

  async function handleLoad() {
    if (!loaderType || (loaderType !== "3" && !loaderId)) return;

    switch (loaderType) {
      case "0":
        await client.loaderGrabber.load({
          type: LoaderDataType.HairShop,
          id: loaderId!,
        });
        break;
      case "1":
        await client.loaderGrabber.load({
          type: LoaderDataType.Shop,
          id: loaderId!,
        });
        break;
      case "2":
        await client.loaderGrabber.load({
          type: LoaderDataType.Quest,
          id: loaderId!,
        });
        break;
      case "3":
        await client.loaderGrabber.load({
          type: LoaderDataType.ArmorCustomizer,
          id: loaderId!,
        });
        break;
    }
  }

  async function handleGrab() {
    if (!grabberType) return;

    isLoading = true;
    try {
      let data: GrabbedData;
      switch (grabberType) {
        case "0":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Shop,
          })) as GrabbedData;
          break;
        case "1":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Quest,
          })) as GrabbedData;
          break;
        case "2":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Inventory,
          })) as GrabbedData;
          break;
        case "3":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.TempInventory,
          })) as GrabbedData;
          break;
        case "4":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Bank,
          })) as GrabbedData;
          break;
        case "5":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.CellMonsters,
          })) as GrabbedData;
          break;
        case "6":
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.MapMonsters,
          })) as GrabbedData;
          break;
        default:
          return;
      }

      if (!data) return;
      grabbedData = data;
      expandedNodes.clear();

      let out: TreeItem[] = [];

      switch (grabberType) {
        case "0":
          if (isShopInfo(data)) {
            out = data.items.map((item) => {
              return {
                name: item.sName,
                children: [
                  { name: "Shop Item ID", value: String(item.ShopItemID) },
                  { name: "ID", value: String(item.ItemID) },
                  {
                    name: "Cost",
                    value: `${item.iCost} ${item.bCoins === 1 ? "ACs" : "Gold"}`,
                  },
                  { name: "Category", value: item.sType },
                  { name: "Description", value: item.sDesc },
                ],
              };
            });
          }
          break;
        case "1":
          if (isQuestDataArray(data)) {
            out = data.map((quest: QuestInfo) => ({
              name: `${quest.QuestID} - ${quest.sName}`,
              children: [
                { name: "ID", value: String(quest.QuestID) },
                { name: "Description", value: quest.sDesc },
                {
                  name: "Required Items",
                  children: Object.values(quest?.oItems || {}).map((item) => ({
                    name: item.sName,
                    children: [
                      { name: "ID", value: String(item.ItemID) },
                      { name: "Quantity", value: String(item.iQty) },
                      {
                        name: "Temporary",
                        value: item.bTemp ? "Yes" : "No",
                      },
                      {
                        name: "Description",
                        value: item.sDesc,
                      },
                    ],
                  })),
                },
                {
                  name: "Rewards",
                  children: (quest?.Rewards || []).map((item) => ({
                    name: item.sName,
                    children: [
                      {
                        name: "ID",
                        value: String(item.ItemID),
                      },
                      {
                        name: "Quantity",
                        value: String(item.iQty),
                      },
                      {
                        name: "Drop chance",
                        value: String(item.DropChance),
                      },
                    ],
                  })),
                },
              ],
            }));
          }
          break;
        case "2":
        case "4":
          if (isItemDataArray(data)) {
            out = data.map((item: ItemData) => {
              const children: TreeItem[] = [
                {
                  name: "ID",
                  value: String(item.ItemID),
                },
                {
                  name: "Char Item ID",
                  value: String(item.CharItemID),
                },
                {
                  name: "Quantity",
                  value:
                    item.sType === "Class"
                      ? "1/1"
                      : `${item.iQty}/${item.iStk}`,
                },
                {
                  name: "AC Tagged",
                  value: item.bCoins === 1 ? "Yes" : "No",
                },
                {
                  name: "Category",
                  value: item.sType,
                },
              ];

              const enhancementName = getEnhancementName(item.EnhPatternID);
              const procName = item.ProcID
                ? getWeaponProcName(item.ProcID)
                : "";
              const validProc =
                procName && procName !== "Unknown" ? procName : "";

              if (enhancementName || validProc) {
                const parts = [enhancementName, validProc].filter(Boolean);
                children.push({
                  name: "Enhancement",
                  value: parts.join(", "),
                });
              }

              children.push({
                name: "Description",
                value: item.sDesc,
              });

              return {
                name: item.sName,
                children,
              };
            });
          }
          break;
        case "3":
          if (isItemDataArray(data)) {
            out = data.map((item) => ({
              name: item.sName,
              children: [
                {
                  name: "ID",
                  value: String(item.ItemID),
                },
                {
                  name: "Quantity",
                  value: `${item.iQty}/${item.iStk}`,
                },
              ],
            }));
          }
          break;
        case "5":
        case "6":
          if (isMonsterDataArray(data)) {
            out = data.map((mon) => {
              const ret: TreeItem = {
                name: mon.strMonName,
                children: [
                  {
                    name: "ID",
                    value: String(mon.monId),
                  },
                  {
                    name: "MonMapID",
                    value: String(mon.monMapId),
                  },
                ],
              };
              ret.children!.push(
                { name: "Race", value: mon.sRace },
                {
                  name: "Level",
                  value: String(
                    "intLevel" in mon && typeof mon.intLevel === "number"
                      ? mon.intLevel
                      : mon.iLvl,
                  ),
                },
              );

              if (grabberType === "5") {
                ret.children!.push({
                  name: "Health",
                  value: `${mon.intHP}/${mon.intHPMax}`,
                });
              } else {
                ret.children!.push({
                  name: "Cell",
                  value: mon.strFrame!,
                });
              }

              return ret;
            });
          }
          break;
      }

      treeData = out;
      logger.debug("Grabbed data:", data);
    } catch (error) {
      logger.error("Error grabbing data.", error);
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function flattenTreeData(
    data: TreeItem[],
    expandedNodes: Set<string>,
  ): FlattenedItem[] {
    const result: FlattenedItem[] = [];
    let index = 0;

    function traverse(
      items: TreeItem[],
      level: number = 0,
      parentPath: string = "",
    ) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        if (!item) continue;

        const nodeId = parentPath
          ? `${parentPath}-${idx}-${item.name}-${level}`
          : `${idx}-${item.name}-${level}`;

        const flatItem: FlattenedItem = {
          ...item,
          level,
          nodeId,
          index: index++,
        };

        result.push(flatItem);

        if (item.children && expandedNodes.has(nodeId)) {
          traverse(item.children, level + 1, nodeId);
        }
      }
    }

    traverse(data);
    return result;
  }

  async function copyValue(nodeId: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      copiedNodeId = nodeId;
      setTimeout(() => {
        if (copiedNodeId === nodeId) copiedNodeId = null;
      }, 1500);
    } catch {
      // ignore
    }
  }

  async function copyNodeJson(item: FlattenedItem) {
    try {
      const data = JSON.stringify(
        item,
        (key, value) => {
          if (key === "nodeId" || key === "level" || key === "index")
            return undefined;
          return value;
        },
        2,
      );
      await navigator.clipboard.writeText(data);
      copiedNodeId = item.nodeId;
      setTimeout(() => {
        if (copiedNodeId === item.nodeId) copiedNodeId = null;
      }, 1500);
    } catch {}
  }
</script>

<div class="flex h-screen flex-col bg-background">
  <header
    class="elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-semibold tracking-tight text-foreground">
          Loader Grabber
        </h1>
      </div>

      <div class="flex items-center gap-2">
        {#if activeTab === "grabber" && grabbedData}
          <Button
            variant="outline"
            size="sm"
            class="gap-2"
            onclick={handleExport}
          >
            <Download class="h-4 w-4" />
            <span class="hidden sm:inline">Export</span>
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-4">
      <Tabs.Root bind:value={activeTab} class="flex h-full flex-col gap-4">
        <Tabs.List class="w-fit">
          <Tabs.Trigger value="loader" class="gap-2">
            <Upload class="h-4 w-4" />
            Loader
          </Tabs.Trigger>
          <Tabs.Trigger value="grabber" class="gap-2">
            <Download class="h-4 w-4" />
            Grabber
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="loader" class="flex-1">
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <NumberField.Root
                bind:value={loaderId}
                min={1}
                max={Number.MAX_SAFE_INTEGER}
                class="gap-2"
              >
                <Label for="loader-id">ID</Label>
                <NumberField.Input
                  id="loader-id"
                  placeholder="e.g. 1337"
                  class="h-10 border-border/50 bg-secondary/50 font-mono transition-all focus:bg-background"
                  autocomplete="off"
                />
              </NumberField.Root>

              <div class="grid gap-2">
                <Label for="loader-type">Source</Label>
                <Select.Root bind:value={loaderType}>
                  <Select.Trigger
                    id="loader-type"
                    class="h-10 w-full border-border/50 bg-secondary/50 transition-all hover:bg-secondary"
                  >
                    <span
                      class={cn(
                        "truncate text-sm",
                        !loaderType && "text-muted-foreground",
                      )}
                    >
                      {#if loaderType === "0"}Hair shop
                      {:else if loaderType === "1"}Shop
                      {:else if loaderType === "2"}Quest
                      {:else if loaderType === "3"}Armor customizer
                      {:else}Select source...{/if}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="0">Hair shop</Select.Item>
                    <Select.Item value="1">Shop</Select.Item>
                    <Select.Item value="2">Quest</Select.Item>
                    <Select.Item value="3">Armor customizer</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <Button
              onclick={handleLoad}
              disabled={!loaderType || (loaderType !== "3" && !loaderId)}
              class="h-10 w-full gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Load
            </Button>
          </div>
        </Tabs.Content>

        <Tabs.Content
          value="grabber"
          class="flex h-full min-h-0 flex-1 flex-col gap-4"
        >
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-4 p-1 sm:flex-row sm:items-end">
              <div class="grid flex-1 gap-2">
                <Label for="grabber-type">Source</Label>
                <Select.Root bind:value={grabberType}>
                  <Select.Trigger
                    id="grabber-type"
                    class="h-10 w-full border-border/40 bg-secondary/50 !ring-0 !ring-offset-0 transition-all hover:bg-secondary"
                  >
                    <span
                      class={cn(
                        "truncate text-sm",
                        !grabberType && "text-muted-foreground",
                      )}
                    >
                      {#if grabberType === "0"}Shop items
                      {:else if grabberType === "1"}Quests
                      {:else if grabberType === "2"}Inventory
                      {:else if grabberType === "3"}Temp inventory
                      {:else if grabberType === "4"}Bank
                      {:else if grabberType === "5"}Cell monsters
                      {:else if grabberType === "6"}Map monsters
                      {:else}Select source...{/if}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="0">Shop items</Select.Item>
                    <Select.Item value="1">Quests</Select.Item>
                    <Select.Item value="2">Inventory</Select.Item>
                    <Select.Item value="3">Temp inventory</Select.Item>
                    <Select.Item value="4">Bank</Select.Item>
                    <Select.Item value="5">Cell monsters</Select.Item>
                    <Select.Item value="6">Map monsters</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <Button
                onclick={handleGrab}
                disabled={!grabberType || isLoading}
                class="h-10 w-[140px] gap-2 px-6 shadow-sm !ring-0 !ring-offset-0 transition-all"
              >
                {#if isLoading}
                  <Loader class="h-4 w-4 animate-spin" />
                  Grabbing...
                {:else}
                  Grab
                {/if}
              </Button>
            </div>

            {#if treeData.length > 0}
              <div class="relative">
                <Search
                  class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  placeholder="Search items..."
                  class="border-border/50 bg-secondary/50 pl-10 transition-colors focus:bg-background"
                  bind:value={searchQuery}
                />
              </div>
            {/if}
          </div>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-4">
              <span class="text-muted-foreground">
                <span class="font-medium tabular-nums text-foreground"
                  >{filteredTreeData.length}</span
                >
                {#if debouncedSearchQuery && filteredTreeData.length !== treeData.length}
                  <span class="text-muted-foreground/70">
                    of {treeData.length}</span
                  >
                {/if}
                <span class="text-muted-foreground/70">
                  item{filteredTreeData.length !== 1 ? "s" : ""}</span
                >
              </span>
            </div>
          </div>

          <div
            class="relative flex-1 overflow-hidden rounded-xl border border-border/50 bg-card"
          >
            {#if !isLoading}
              <div class="h-full overflow-hidden p-2">
                <VirtualList
                  data={filteredItems}
                  key="nodeId"
                  class="no-scrollbar"
                >
                  {#snippet children({ data: item })}
                    {@render TreeNode(item)}
                  {/snippet}
                </VirtualList>
              </div>
            {/if}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </main>
</div>

{#snippet TreeNode(item: FlattenedItem)}
  {@const isExpanded = expandedNodes.has(item.nodeId)}
  {@const hasChildren = item.children && item.children.length > 0}
  {@const inputHandler = () => {
    if (hasChildren) {
      if (isExpanded) {
        expandedNodes.delete(item.nodeId);
      } else {
        expandedNodes.add(item.nodeId);
      }
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
      {#each Array(item.level) as _, i (i)}
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
        "group relative flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-all",
        hasChildren ? "hover:bg-secondary/40" : "cursor-default",
        isExpanded && hasChildren && "bg-secondary/20",
      )}
      onclick={inputHandler}
      onkeydown={(ev) => ev.key === "Enter" && inputHandler()}
      style="padding-left: {item.level * 16 + 8}px"
      role="button"
      tabindex="0"
    >
      {#if hasChildren}
        <div
          class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
        >
          <ChevronRight
            class={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90 text-foreground",
            )}
          />
        </div>
      {:else}
        <!-- Spacer to maintain alignment with siblings -->
        <div class="mt-0.5 h-5 w-5 flex-shrink-0"></div>
      {/if}

      <div class="flex min-w-0 flex-1 items-center gap-2 leading-relaxed">
        {#if hasChildren}
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <span class="flex-shrink-0 truncate font-semibold text-foreground">
              {#if debouncedSearchQuery}
                {@const parts = item.name.split(
                  new RegExp(`(${debouncedSearchQuery})`, "gi"),
                )}
                {#each parts as part}
                  {#if part.toLowerCase() === debouncedSearchQuery.toLowerCase()}
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
            <span class="text-xs font-medium text-muted-foreground/50">
              {item.children?.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class={cn(
              "h-6 w-6 shadow-sm transition-all hover:bg-secondary/80",
              isCopied && "text-success/100",
            )}
            onclick={(ev) => {
              ev.stopPropagation();
              copyNodeJson(item);
            }}
            title="Copy JSON"
          >
            {#if isCopied}
              <Check class="h-2 w-2" />
            {:else}
              <Copy class="h-2 w-2" />
            {/if}
          </Button>
        {:else if !hasChildren && item.name}
          <span
            class="flex-shrink-0 truncate font-medium text-muted-foreground"
          >
            {item.name}
          </span>
        {/if}

        {#if hasValue}
          <button
            class={cn(
              "inline-flex min-w-0 items-center gap-1.5 truncate rounded-md px-2 py-0.5 font-mono text-[13px] transition-all",
              "bg-secondary/60 text-foreground ring-1 ring-border/50 hover:bg-secondary hover:ring-border",
              isCopied && "bg-success/10 text-success ring-success/30",
            )}
            title="Click to copy"
            onclick={(ev) => {
              ev.stopPropagation();
              copyValue(item.nodeId, item.value!);
            }}
          >
            {#if isCopied}
              <Check class="h-3 w-3 flex-shrink-0" />
            {/if}
            <span class="truncate">{item.value}</span>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/snippet}
