<script lang="ts">
  import { cn } from "../../../shared";
  import { client } from "../../../shared/tipc";
  import { GrabberDataType, LoaderDataType } from "../../../shared/types";
  import { VirtualList } from "@vexed/ui";
  import type { QuestData } from "../../game/lib/models/Quest";
  import type { ShopInfo } from "../../game/lib/Shops";
  import type { ItemData } from "../../game/lib/models/Item";
  import type { MonsterData } from "../../game/lib/models/Monster";
  import { SvelteSet } from "svelte/reactivity";
  import log from "electron-log";

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

  let loaderId = $state<number>();
  let loaderType = $state<string>("");
  let grabberType = $state<string>("");
  let grabbedData = $state<GrabbedData | null>(null);
  let treeData = $state<TreeItem[]>([]);
  let expandedNodes = $state<SvelteSet<string>>(new SvelteSet());
  let isLoading = $state<boolean>(false);
  let flattenedItems = $derived(flattenTreeData(treeData, expandedNodes));

  async function handleLoad() {
    if (!loaderType || (loaderType !== "3" && !loaderId)) return;

    switch (loaderType) {
      case "0": // Hair shop
        await client.loaderGrabber.load({
          type: LoaderDataType.HairShop,
          id: loaderId!,
        });
        break;
      case "1": // Shop
        await client.loaderGrabber.load({
          type: LoaderDataType.Shop,
          id: loaderId!,
        });
        break;
      case "2": // Quest
        await client.loaderGrabber.load({
          type: LoaderDataType.Quest,
          id: loaderId!,
        });
        break;
      case "3": // Armor customizer
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
        case "0": // Shop Items
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Shop,
          })) as GrabbedData;
          break;
        case "1": // Quests
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Quest,
          })) as GrabbedData;
          break;
        case "2": // Inventory
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Inventory,
          })) as GrabbedData;
          break;
        case "3": // Temp Inventory
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.TempInventory,
          })) as GrabbedData;
          break;
        case "4": // Bank
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.Bank,
          })) as GrabbedData;
          break;
        case "5": // Cell Monsters
          data = (await client.loaderGrabber.grab({
            type: GrabberDataType.CellMonsters,
          })) as GrabbedData;
          break;
        case "6": // Map Monsters
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
        case "0": // Shop Items
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
        case "1": // Quests
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
        case "2": // Inventory
        case "4": // Bank
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
        case "3": // Temp Inventory
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
        case "5": // Cell Monsters
        case "6": // Map Monsters
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
</script>

<main
  class="m-0 flex min-h-screen flex-col overflow-hidden bg-background-primary text-white focus:outline-none"
>
  <div
    class="flex w-full flex-col space-y-6 p-4 sm:flex-row sm:space-x-6 sm:space-y-0"
  >
    <div class="flex-shrink-0 sm:w-1/3">
      <div
        class="h-full rounded-lg border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
      >
        <h3 class="mb-6 text-xl font-semibold text-white">Loader</h3>

        <div class="space-y-4">
          <div>
            <label
              for="loader-id"
              class="mb-2 block text-sm font-medium text-gray-300"
            >
              ID
            </label>
            <input
              type="number"
              id="loader-id"
              bind:value={loaderId}
              class="w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter ID"
              autocomplete="off"
            />
          </div>

          <div>
            <label
              for="loader-select"
              class="mb-2 block text-sm font-medium text-gray-300"
            >
              Data Type
            </label>
            <select
              id="loader-select"
              bind:value={loaderType}
              class="w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-1.5 text-white transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="" disabled>Select type...</option>
              <option value="0">Hair shop</option>
              <option value="1">Shop</option>
              <option value="2">Quest</option>
              <option value="3">Armor customizer</option>
            </select>
          </div>

          <button
            onclick={handleLoad}
            disabled={!loaderType || (loaderType !== "3" && !loaderId)}
            class="w-full rounded-md border border-gray-700/30 bg-gray-800/30 px-3 py-1.5 font-medium text-white transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-700/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load
          </button>
        </div>
      </div>
    </div>

    <div class="w-full flex-grow sm:w-2/3">
      <div
        class="h-full rounded-lg border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
      >
        <div
          class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <h2 class="mb-4 text-xl font-bold text-white sm:mb-0">Grabber</h2>
          <div
            class="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <button
              onclick={handleGrab}
              disabled={!grabberType || isLoading}
              class="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {#if isLoading}
                <div class="flex items-center space-x-1.5">
                  <svg
                    class="h-3.5 w-3.5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Grabbing...</span>
                </div>
              {:else}
                Grab
              {/if}
            </button>
            <button
              onclick={handleExport}
              class="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-green-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600"
            >
              Export
            </button>
          </div>
        </div>

        <div class="flex h-[calc(100vh-12rem)] flex-col space-y-6">
          <div class="flex-shrink-0 space-y-4">
            <div>
              <label
                for="grabber-select"
                class="mb-3 block text-sm font-medium text-gray-300"
              >
                Data Type
              </label>
              <select
                id="grabber-select"
                bind:value={grabberType}
                class="w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-4 py-3 text-white transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="" disabled>Select type...</option>
                <option value="0">Shop Items</option>
                <option value="1">Quests</option>
                <option value="2">Inventory</option>
                <option value="3">Temp Inventory</option>
                <option value="4">Bank</option>
                <option value="5">Cell Monsters</option>
                <option value="6">Map Monsters</option>
              </select>
            </div>
          </div>

          <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              class="h-full overflow-hidden rounded-md border border-gray-700/50 bg-background-primary backdrop-blur-sm"
            >
              {#if isLoading}
                <div class="flex h-full items-center justify-center p-8">
                  <div class="flex flex-col items-center space-y-4">
                    <svg
                      class="h-8 w-8 animate-spin text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div class="text-gray-400">Loading data...</div>
                  </div>
                </div>
              {:else if flattenedItems.length > 0}
                <div class="h-full p-2">
                  <VirtualList
                    data={flattenedItems}
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
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

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

  <div class="select-none">
    <div
      class={cn(
        "group flex cursor-pointer items-start space-x-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200 hover:bg-gray-700/40 hover:shadow-sm",
        isLeaf && "cursor-default hover:bg-gray-700/20",
      )}
      onclick={inputHandler}
      onkeydown={inputHandler}
      style="margin-left: {item.level * 16}px"
      role="button"
      tabindex="0"
    >
      {#if hasChildren}
        <div
          class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
        >
          <svg
            class={cn(
              "h-3 w-3 text-gray-400 transition-all duration-300 ease-out group-hover:text-gray-300",
              isExpanded && "rotate-90 text-blue-400",
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {:else}
        <div
          class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
        >
          {#if hasValue}
            <svg
              class="h-2.5 w-2.5 text-emerald-400/80"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="4" />
            </svg>
          {/if}
        </div>
      {/if}

      <div class="flex min-w-0 flex-1 items-center space-x-2 leading-relaxed">
        {#if hasChildren}
          <span
            class="flex-shrink-0 truncate font-semibold text-blue-200 group-hover:text-blue-100"
            >{item.name}</span
          >
        {:else if !hasChildren && item.name && hasValue}
          <span
            class="flex-shrink-0 truncate font-medium text-gray-300 group-hover:text-gray-200"
            >{item.name}</span
          >
        {/if}

        {#if hasValue}
          <span class="flex-shrink-0 text-gray-500">:</span>
          <span
            class={cn(
              "font-mono text-sm text-emerald-300 transition-colors duration-200 hover:cursor-pointer hover:underline group-hover:text-emerald-200",
              "min-w-0 truncate",
            )}
            title={item.value}
            onclick={() =>
              navigator.clipboard.writeText(item.value!).catch(() => {})}
            onkeydown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                navigator.clipboard.writeText(item.value!).catch(() => {});
              }
            }}
            tabindex="0"
            role="button"
          >
            {item.value}
          </span>
        {/if}
      </div>
    </div>

    {#if hasChildren}
      <div
        class={cn(
          "expand-container relative",
          isExpanded ? "expanded" : "collapsed",
        )}
      >
        {#if item.level < 3}
          <div
            class={cn(
              "absolute border-l border-gray-600/40 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0",
            )}
            style="left: {item.level * 20 +
              15}px; top: 0; bottom: 0; width: 1px"
          ></div>
        {/if}
        {#if isExpanded}
          <div class="transition-all duration-300 ease-out">
            {#each item.children || [] as child, index}
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
    {/if}
  </div>
{/snippet}

<style>
  .expand-container {
    transition:
      max-height 0.3s ease-out,
      opacity 0.3s ease-out;
    overflow: hidden;
  }

  .expand-container.expanded {
    max-height: 2000px;
  }

  .expand-container.collapsed {
    max-height: 0;
    opacity: 0;
  }
</style>
