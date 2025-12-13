<script lang="ts">
  import { cn } from "@vexed/ui/util";
  import { Button, Input } from "@vexed/ui";
  import * as Empty from "@vexed/ui/Empty";
  import * as Select from "@vexed/ui/Select";
  import * as Tabs from "@vexed/ui/Tabs";
  import { VirtualList } from "@vexed/ui";
  import Download from "lucide-svelte/icons/download";
  import Loader from "lucide-svelte/icons/loader";
  import Database from "lucide-svelte/icons/database";
  import Upload from "lucide-svelte/icons/upload";
  import Check from "lucide-svelte/icons/check";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Search from "lucide-svelte/icons/search";

  import { SvelteSet } from "svelte/reactivity";
  import log from "electron-log";

  import { client } from "@shared/tipc";
  import { GrabberDataType, LoaderDataType } from "@shared/types";
  import type { QuestData } from "@game/lib/models/Quest";
  import type { ShopInfo } from "@game/lib/Shops";
  import type { ItemData } from "@game/lib/models/Item";
  import type { MonsterData } from "@game/lib/models/Monster";

  const logger = log.scope("app/loader-grabber");

  type GrabbedData = ShopInfo | QuestData[] | ItemData[] | MonsterData[];

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

  function isQuestDataArray(data: GrabbedData): data is QuestData[] {
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

  let activeTab = $state("grabber");
  let loaderId = $state<number>();
  let loaderType = $state<string>("");
  let grabberType = $state<string>("");
  let grabbedData = $state<GrabbedData | null>(null);
  let treeData = $state<TreeItem[]>([]);
  let expandedNodes = new SvelteSet<string>();
  let isLoading = $state<boolean>(false);
  let searchQuery = $state("");
  let flattenedItems = $derived(flattenTreeData(treeData, expandedNodes));
  let filteredTreeData = $derived(
    searchQuery
      ? treeData.filter((item) => {
          const query = searchQuery.toLowerCase();
          return item.name.toLowerCase().includes(query);
        })
      : treeData
  );
  let filteredItems = $derived(
    searchQuery
      ? flattenTreeData(filteredTreeData, expandedNodes)
      : flattenedItems
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
            out = data.map((quest: QuestData) => ({
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
            out = data.map((item: ItemData) => ({
              name: item.sName,
              children: [
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
                {
                  name: "Description",
                  value: item.sDesc,
                },
              ],
            }));
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
                    value: String(mon.MonID),
                  },
                  {
                    name: "MonMapID",
                    value: String(mon.MonMapID),
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
</script>

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Loader Grabber
        </h1>
      </div>

      <div class="flex items-center gap-2">
        {#if activeTab === "grabber" && grabbedData}
          <Button variant="outline" size="sm" class="gap-2" onclick={handleExport}>
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
          <Tabs.Trigger value="grabber" class="gap-2">
            <Download class="h-4 w-4" />
            Grabber
          </Tabs.Trigger>
          <Tabs.Trigger value="loader" class="gap-2">
            <Upload class="h-4 w-4" />
            Loader
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="loader" class="flex-1">
          <div class="flex flex-col gap-4">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label for="loader-id" class="text-sm font-medium text-muted-foreground">
                  ID
                </label>
                <Input
                  type="number"
                  id="loader-id"
                  bind:value={loaderId}
                  placeholder="Enter ID"
                  class="bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                  autocomplete="off"
                />
              </div>

              <div class="space-y-1.5">
                <label for="loader-type" class="text-sm font-medium text-muted-foreground">
                  Data Type
                </label>
                <Select.Root bind:value={loaderType}>
                  <Select.Trigger class="w-full bg-secondary/50 border-border/50 hover:bg-secondary transition-colors">
                    <span class="text-sm truncate">
                      {#if loaderType === "0"}Hair Shop
                      {:else if loaderType === "1"}Shop
                      {:else if loaderType === "2"}Quest
                      {:else if loaderType === "3"}Armor Customizer
                      {:else}Select type...{/if}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="0">Hair Shop</Select.Item>
                    <Select.Item value="1">Shop</Select.Item>
                    <Select.Item value="2">Quest</Select.Item>
                    <Select.Item value="3">Armor Customizer</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <Button
              onclick={handleLoad}
              disabled={!loaderType || (loaderType !== "3" && !loaderId)}
              class="w-full sm:w-auto gap-2"
            >
              <Upload class="h-4 w-4" />
              Load Data
            </Button>
          </div>
        </Tabs.Content>

        <Tabs.Content value="grabber" class="flex h-full min-h-0 flex-1 flex-col gap-4">
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="flex-1">
                <Select.Root bind:value={grabberType}>
                  <Select.Trigger class="w-full bg-secondary/50 border-border/50 hover:bg-secondary transition-colors">
                    <span class="text-sm truncate">
                      {#if grabberType === "0"}Shop Items
                      {:else if grabberType === "1"}Quests
                      {:else if grabberType === "2"}Inventory
                      {:else if grabberType === "3"}Temp Inventory
                      {:else if grabberType === "4"}Bank
                      {:else if grabberType === "5"}Cell Monsters
                      {:else if grabberType === "6"}Map Monsters
                      {:else}Select type...{/if}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="0">Shop Items</Select.Item>
                    <Select.Item value="1">Quests</Select.Item>
                    <Select.Item value="2">Inventory</Select.Item>
                    <Select.Item value="3">Temp Inventory</Select.Item>
                    <Select.Item value="4">Bank</Select.Item>
                    <Select.Item value="5">Cell Monsters</Select.Item>
                    <Select.Item value="6">Map Monsters</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <Button
                onclick={handleGrab}
                disabled={!grabberType || isLoading}
                class="gap-2"
              >
                {#if isLoading}
                  <Loader class="h-4 w-4 animate-spin" />
                  Grabbing...
                {:else}
                  <Download class="h-4 w-4" />
                  Grab Data
                {/if}
              </Button>
            </div>

            {#if treeData.length > 0}
              <div class="relative">
                <Search
                  class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
                />
                <Input
                  type="search"
                  placeholder="Search items..."
                  class="pl-10 bg-secondary/50 border-border/50 focus:bg-background transition-colors"
                  bind:value={searchQuery}
                />
              </div>
            {/if}
          </div>

          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">
              <span class="tabular-nums font-medium text-foreground">{filteredTreeData.length}</span>
              {#if searchQuery && filteredTreeData.length !== treeData.length}
                <span class="text-muted-foreground/70"> of {treeData.length}</span>
              {/if}
              <span class="text-muted-foreground/70"> item{filteredTreeData.length !== 1 ? 's' : ''}</span>
            </span>
          </div>

          <div class="relative flex-1 overflow-hidden rounded-xl border border-border/50 bg-card">
            {#if isLoading}
              <div class="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader class="text-primary h-6 w-6 animate-spin" />
                <p class="text-sm">Loading data...</p>
              </div>
            {:else if treeData.length === 0}
              <div class="flex h-full items-center justify-center">
                <Empty.Root>
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <Database />
                    </Empty.Media>
                    <Empty.Title>No data</Empty.Title>
                    <Empty.Description>
                      Select a data type and click "Grab Data" to fetch information.
                    </Empty.Description>
                  </Empty.Header>
                </Empty.Root>
              </div>
            {:else if filteredItems.length === 0}
              <div class="flex h-full items-center justify-center">
                <Empty.Root>
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <Search />
                    </Empty.Media>
                    <Empty.Title>No matches</Empty.Title>
                    <Empty.Description>
                      No items match "{searchQuery}"
                    </Empty.Description>
                  </Empty.Header>
                </Empty.Root>
              </div>
            {:else}
              <div class="h-full overflow-hidden p-2">
                <VirtualList data={filteredItems} key="nodeId" class="no-scrollbar">
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
  {@const isLeaf = !hasChildren}
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

  <div class="select-none">
    <div
      class={cn(
        "group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        hasChildren ? "hover:bg-secondary/50" : "cursor-default",
      )}
      onclick={inputHandler}
      onkeydown={(ev) => ev.key === "Enter" && inputHandler()}
      style="margin-left: {item.level * 16}px"
      role="button"
      tabindex="0"
    >
      {#if hasChildren}
        <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
          <ChevronRight
            class={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-90 text-foreground",
            )}
          />
        </div>
      {:else}
        <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
          {#if hasValue}
            <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></div>
          {/if}
        </div>
      {/if}

      <div class="flex min-w-0 flex-1 items-center gap-2 leading-relaxed">
        {#if hasChildren}
          <span class="flex-shrink-0 truncate font-medium text-foreground">
            {item.name}
          </span>
          <span class="text-xs text-muted-foreground">
            ({item.children?.length})
          </span>
        {:else if !hasChildren && item.name && hasValue}
          <span class="flex-shrink-0 truncate font-medium text-foreground">
            {item.name}
          </span>
        {/if}

        {#if hasValue}
          <button
            class={cn(
              "inline-flex min-w-0 items-center gap-1 truncate rounded px-1.5 py-0.5 font-mono text-sm transition-all",
              "bg-secondary/80 text-foreground hover:bg-secondary",
              isCopied && "bg-success/20 text-success",
            )}
            title="Click to copy"
            onclick={(ev) => {
              ev.stopPropagation();
              copyValue(item.nodeId, item.value!);
            }}
          >
            {#if isCopied}<Check class="h-3 w-3 flex-shrink-0" />{/if}
            <span class="truncate">{item.value}</span>
          </button>
        {/if}
      </div>
    </div>

    {#if hasChildren && isExpanded}
      <div class="relative">
        <div
          class="absolute left-0 top-0 bottom-0 w-px bg-border/40"
          style="margin-left: {item.level * 16 + 18}px"
        ></div>
        {#each item.children || [] as child, index (`${child.name}-${index}`)}
          {@render TreeNode({
            ...child,
            level: item.level + 1,
            nodeId: `${item.nodeId}-${index}-${child.name}-${item.level + 1}`,
            index: item.index * 1000 + index,
          } as FlattenedItem)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}
