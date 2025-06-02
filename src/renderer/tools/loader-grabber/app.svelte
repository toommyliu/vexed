<script lang="ts">
  import { cn } from "../../../shared";
  import { client, handlers } from "../../../shared/tipc";
  import { GrabberDataType, LoaderDataType } from "../../../shared/types";

  let loaderId = $state<number>();
  let loaderType = $state<string>("");
  let grabberType = $state<string>("");
  let grabbedData = $state<any>(null);
  let treeData = $state<any[]>([]);
  let expandedNodes = $state<Set<string>>(new Set());

  async function handleLoad() {
    if (!loaderId || !loaderType) return;

    switch (loaderType) {
      case "0": // Hair shop
        await client.load({
          type: LoaderDataType.HairShop,
          id: loaderId,
        });
        break;
      case "1": // Shop
        await client.load({
          type: LoaderDataType.Shop,
          id: loaderId,
        });
        break;
      case "2": // Quest
        await client.load({
          type: LoaderDataType.Quest,
          id: loaderId,
        });
        break;
      case "3": // Armor customizer
        await client.load({
          type: LoaderDataType.ArmorCustomizer,
          id: loaderId,
        });
        break;
    }
  }

  async function handleGrab() {
    if (!grabberType) return;
    console.log(`Grabbing ${grabberType}`);

    let data: any;
    switch (grabberType) {
      case "0": // Shop Items
        data = await client.grab({ type: GrabberDataType.Shop });
        break;
      case "1": // Quests
        data = await client.grab({ type: GrabberDataType.Quest });
        break;
      case "2": // Inventory
        data = await client.grab({ type: GrabberDataType.Inventory });
        break;
      case "3": // Temp Inventory
        data = await client.grab({ type: GrabberDataType.TempInventory });
        break;
      case "4": // Bank
        data = await client.grab({ type: GrabberDataType.Bank });
        break;
      case "5": // Cell Monsters
        data = await client.grab({ type: GrabberDataType.CellMonsters });
        break;
      case "6": // Map Monsters
        data = await client.grab({ type: GrabberDataType.MapMonsters });
        break;
      default:
        return;
    }

    grabbedData = data;
    console.log(data);

    // Process data into tree structure
    let out: any[] = [];

    switch (grabberType) {
      case "0":
        out = (data as any).items.map((item: any) => ({
          name: item.sName,
          children: [
            { name: "Shop Item ID", value: item.ShopItemID },
            { name: "ID", value: item.ItemID },
            {
              name: "Cost",
              value: `${item.iCost} ${item.bCoins === 1 ? "ACs" : "Gold"}`,
            },
            { name: "Category", value: item.sType },
            { name: "Description", value: item.sDesc },
          ],
        }));
        break;
      case "1": // quest
        out = (data as any[]).map((quest: any) => ({
          name: `${quest.QuestID} - ${quest.sName}`,
          children: [
            { name: "ID", value: quest.QuestID },
            { name: "Description", value: quest.sDesc },
            {
              name: "Required Items",
              children: quest.RequiredItems.map((quest: any) => ({
                name: quest.sName,
                children: [
                  { name: "ID", value: quest.ItemID },
                  { name: "Quantity", value: quest.iQty },
                  {
                    name: "Temporary",
                    value: quest.bTemp ? "Yes" : "No",
                  },
                  {
                    name: "Description",
                    value: quest.sDesc,
                  },
                ],
              })),
            },
            {
              name: "Rewards",
              children: quest.Rewards.map((item: any) => ({
                name: item.sName,
                children: [
                  {
                    name: "ID",
                    value: item.ItemID,
                  },
                  {
                    name: "Quantity",
                    value: item.iQty,
                  },
                  {
                    name: "Drop chance",
                    value: item.DropChance,
                  },
                ],
              })),
            },
          ],
        }));
        break;
      case "2":
      case "4":
        out = (data as any[]).map((item: any) => ({
          name: item.sName,
          children: [
            {
              name: "ID",
              value: item.ItemID,
            },
            {
              name: "Char Item ID",
              value: item.CharItemID,
            },
            {
              name: "Quantity",
              value:
                item.sType === "Class" ? "1/1" : `${item.iQty}/${item.iStk}`,
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
        break;
      case "3":
        out = (data as any[]).map((item: any) => ({
          name: item.sName,
          children: [
            {
              name: "ID",
              value: item.ItemID,
            },
            {
              name: "Quantity",
              value: `${item.iQty}/${item.iStk}`,
            },
          ],
        }));
        break;
      case "5":
      case "6":
        out = (data as any[]).map((mon: any) => {
          const ret = {
            name: mon.strMonName,
            children: [
              {
                name: "ID",
                value: mon.MonID,
              },
              {
                name: "MonMapID",
                value: mon.MonMapID,
              },
            ],
          };

          ret.children.push(
            { name: "Race", value: mon.sRace },
            { name: "Level", value: (mon.iLvl ?? mon.intLevel)! },
          );

          if (grabberType === "5") {
            ret.children.push({
              name: "Health",
              value: `${mon.intHP}/${mon.intHPMax}`,
            });
          } else {
            ret.children.push({
              name: "Cell",
              value: mon.strFrame!,
            });
          }

          return ret;
        });
        break;
    }

    treeData = out;
  }

  function handleExport() {
    if (!grabbedData) {
      console.warn("No data to export");
      return;
    }

    const dataStr = JSON.stringify(grabbedData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `grabbed-data-${grabberType}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Data exported");
  }

  interface TreeItem {
    name: string;
    value?: any;
    children?: TreeItem[];
  }
</script>

{#snippet TreeNode(item: TreeItem, level: number = 0)}
  {@const nodeId = `${item.name}-${level}`}
  {@const isExpanded = expandedNodes.has(nodeId)}
  {@const hasChildren = item.children && item.children.length > 0}
  {@const isLeaf = !hasChildren}

  <div class="select-none">
    <div
      class={cn(
        "group flex cursor-pointer items-center space-x-2 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-gray-700/40 hover:shadow-sm",
        isLeaf && "cursor-default",
        isLeaf && "hover:bg-gray-700/20",
      )}
      onclick={() => {
        if (hasChildren) {
          if (isExpanded) {
            expandedNodes.delete(nodeId);
          } else {
            expandedNodes.add(nodeId);
          }
          expandedNodes = new Set(expandedNodes);
        }
      }}
      style="margin-left: {level * 20}px"
    >
      {#if hasChildren}
        <div class="flex h-5 w-5 items-center justify-center">
          <span
            class={cn(
              "text-xs text-gray-400 transition-all duration-200 group-hover:text-gray-300",
              isExpanded && "rotate-90 text-blue-400",
            )}
          >
            ▶
          </span>
        </div>
      {:else}
        <div class="flex h-5 w-5 items-center justify-center">
          <div class="h-1.5 w-1.5 rounded-full bg-gray-500"></div>
        </div>
      {/if}

      <div class="flex min-w-0 flex-1 items-center space-x-2">
        {#if hasChildren}
          <span
            class="break-words font-semibold text-blue-200 group-hover:text-blue-100"
            >{item.name}</span
          >
        {:else}
          <span
            class="break-words font-medium text-gray-300 group-hover:text-gray-200"
            >{item.name}</span
          >
        {/if}

        {#if item.value !== undefined}
          <span class="flex-shrink-0 text-gray-500">:</span>
          <span
            class={cn(
              "font-mono text-sm text-emerald-300 hover:cursor-pointer hover:underline group-hover:text-emerald-200",
              item.name === "Description"
                ? "truncate"
                : "overflow-hidden break-all",
            )}
            title={item.value}
            onclick={() =>
              navigator.clipboard.writeText(item.value).catch(() => {})}
          >
            {item.value}
          </span>
        {/if}
      </div>
    </div>

    {#if isExpanded && hasChildren}
      <div class="relative">
        {#if level < 3}
          <div
            class="absolute border-l border-gray-600/40"
            style="left: {level * 20 + 15}px; top: 0; bottom: 0; width: 1px"
          ></div>
        {/if}
        {#each item.children as child}
          {@render TreeNode(child, level + 1)}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<main
  class="m-0 flex min-h-screen flex-col overflow-hidden bg-zinc-950 text-white focus:outline-none"
>
  <div
    class="flex w-full flex-col space-y-6 p-4 sm:flex-row sm:space-x-6 sm:space-y-0"
  >
    <div class="flex-shrink-0 sm:w-1/3">
      <div
        class="h-full rounded-lg border border-gray-800/50 bg-gradient-to-br from-[#111113] to-[#1a1a1c] p-6 backdrop-blur-sm"
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
              class="w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            disabled={!loaderId || !loaderType}
            class="w-full rounded-md border border-gray-700/30 bg-gray-800/30 px-3 py-1.5 font-medium text-white transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-700/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            Load
          </button>
        </div>
      </div>
    </div>

    <div class="w-full flex-grow sm:w-2/3">
      <div
        class="h-full rounded-lg border border-gray-800/50 bg-gradient-to-br from-[#111113] to-[#1a1a1c] p-6 backdrop-blur-sm"
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
              disabled={!grabberType}
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600 sm:px-6 sm:py-2.5 sm:text-base sm:font-semibold"
            >
              Grab
            </button>
            <button
              onclick={handleExport}
              class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-green-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600 sm:px-6 sm:py-2.5 sm:text-base sm:font-semibold"
            >
              Export
            </button>
          </div>
        </div>

        <div class="flex h-[calc(100vh-12rem)] flex-col gap-6">
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

          <div class="flex min-h-0 flex-1 flex-col">
            <div
              class="flex-1 overflow-hidden rounded-md border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm"
            >
              {#if treeData.length > 0}
                <div class="h-full overflow-y-auto">
                  <div class="p-3">
                    <div class="space-y-1">
                      {#each treeData as item, index}
                        {@render TreeNode(item)}
                        {#if index < treeData.length - 1}
                          <div class="my-2 border-b border-gray-700/30"></div>
                        {/if}
                      {/each}
                    </div>
                  </div>
                </div>
              {:else}
                <div
                  class="flex h-32 items-center justify-center p-8 text-center"
                >
                  <div class="text-gray-400">
                    {grabbedData
                      ? "No data to display"
                      : "Select a data type and click 'Grab' to view data"}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
