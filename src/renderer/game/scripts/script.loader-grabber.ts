import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';

const iconCollapsed = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
</svg>`;

const iconExpanded = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
</svg>`;

let lastData: { data: TreeInputData[]; type: string } | null = null;

function createTreeNode(data: TreeNode): HTMLDivElement {
  const node = document.createElement('div');
  node.className = 'tree-node';

  const nodeContent = document.createElement('div');
  nodeContent.className = 'tree-node-content';

  const nodeName = document.createElement('span');
  nodeName.className = 'tree-node-name';
  nodeName.textContent = data.name;

  if (data?.children?.length) {
    const expander = document.createElement('div');
    expander.className = 'tree-expander';
    expander.innerHTML = iconCollapsed;
    nodeContent.appendChild(expander);
    nodeContent.appendChild(nodeName);

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    childrenContainer.style.display = 'none';

    // Recursively add child nodes
    for (const child of data.children) {
      if (child.value) {
        // Leaf with value
        const childItem = document.createElement('div');
        childItem.className = 'tree-child-item';

        const key = document.createElement('span');
        key.className = 'tree-key';
        key.textContent = child.name + ':';

        const value = document.createElement('span');
        value.className = 'tree-node-value';
        value.textContent = String(child.value ?? 'N/A');
        value.title = String(child.value ?? 'N/A');

        childItem.appendChild(key);
        childItem.appendChild(value);
        childrenContainer.appendChild(childItem);
      } else {
        // Child is another branch node
        childrenContainer.appendChild(createTreeNode(child));
      }
    }

    // Append
    node.appendChild(nodeContent);
    node.appendChild(childrenContainer);
  } else {
    // Leaf without children
    nodeContent.appendChild(nodeName);

    if (data.value !== undefined) {
      const valueEl = document.createElement('span');
      valueEl.className = 'tree-node-value';
      valueEl.textContent = String(data.value ?? 'N/A');

      nodeContent.appendChild(document.createTextNode(': '));
      nodeContent.appendChild(valueEl);
    }

    node.appendChild(nodeContent);
  }

  return node;
}

function renderTree(data: TreeNode[]) {
  const container = document.querySelector('#tree') as HTMLDivElement;
  container.innerHTML = '';

  for (const item of data) {
    container.appendChild(createTreeNode(item));
  }
}

document.addEventListener('click', async (ev) => {
  const target = ev.target as HTMLElement;

  // Find the closest tree-node-content parent if we clicked on a child element
  const nodeContent = target.closest('.tree-node-content');

  // Handle expander
  if (nodeContent) {
    ev.stopPropagation();
    const node = nodeContent.parentElement;
    const childrenContainer = node?.querySelector(
      ':scope > .tree-children',
    ) as HTMLElement;

    if (!childrenContainer) return;

    const isExpanded = childrenContainer.style.display !== 'none';
    const expander = nodeContent.querySelector('.tree-expander');

    if (!expander) return;

    if (isExpanded) {
      expander.innerHTML = iconCollapsed;
      expander.classList.remove('expanded');
      childrenContainer.style.display = 'none';
    } else {
      expander.innerHTML = iconExpanded;
      expander.classList.add('expanded');
      childrenContainer.style.display = 'block';
    }

    return;
  }

  // Handle value copy
  if (target.classList.contains('tree-node-value')) {
    ev.stopPropagation();
    const value = target.textContent ?? '';
    void navigator.clipboard.writeText(value);
  }
});

function parseTreeData(data: TreeInputData, type: string): TreeNode[] {
  let out: TreeNode[] = [];

  if (!data) return out;

  switch (type) {
    case '0':
      out = (data as ShopData).items.map((item) => ({
        name: item.sName,
        children: [
          { name: 'Shop Item ID', value: item.ShopItemID },
          { name: 'ID', value: item.ItemID },
          {
            name: 'Cost',
            value: `${item.iCost} ${item.bCoins === 1 ? 'ACs' : 'Gold'}`,
          },
          { name: 'Category', value: item.sType },
          { name: 'Description', value: item.sDesc },
        ],
      }));
      break;
    case '1': // quest
      out = (data as Quest[]).map((quest) => ({
        name: `${quest.QuestID} - ${quest.sName}`,
        children: [
          { name: 'ID', value: quest.QuestID },
          { name: 'Description', value: quest.sDesc },
          {
            name: 'Required Items',
            children: quest.RequiredItems.map((quest) => ({
              name: quest.sName,
              children: [
                { name: 'ID', value: quest.ItemID },
                { name: 'Quantity', value: quest.iQty },
                {
                  name: 'Temporary',
                  value: quest.bTemp ? 'Yes' : 'No',
                },
                {
                  name: 'Description',
                  value: quest.sDesc,
                },
              ],
            })),
          },
          {
            name: 'Rewards',
            children: quest.Rewards.map((item) => ({
              name: item.sName,
              children: [
                {
                  name: 'ID',
                  value: item.ItemID,
                },
                {
                  name: 'Quantity',
                  value: item.iQty,
                },
                {
                  name: 'Drop chance',
                  value: item.DropChance,
                },
              ],
            })),
          },
        ],
      }));
      break;
    case '2':
    case '4':
      out = (data as InventoryItem[]).map((item) => ({
        name: item.sName,
        children: [
          {
            name: 'ID',
            value: item.ItemID,
          },
          {
            name: 'Char Item ID',
            value: item.CharItemID,
          },
          {
            name: 'Quantity',
            value: item.sType === 'Class' ? '1/1' : `${item.iQty}/${item.iStk}`,
          },
          {
            name: 'AC Tagged',
            value: item.bCoins === 1 ? 'Yes' : 'No',
          },
          {
            name: 'Category',
            value: item.sType,
          },
          {
            name: 'Description',
            value: item.sDesc,
          },
        ],
      }));
      break;
    case '3':
      out = (data as InventoryItem[]).map((item) => ({
        name: item.sName,
        children: [
          {
            name: 'ID',
            value: item.ItemID,
          },
          {
            name: 'Quantity',
            value: `${item.iQty}/${item.iStk}`,
          },
        ],
      }));
      break;
    case '5':
    case '6':
      out = (data as Monster[]).map((mon) => {
        const ret = {
          name: mon.strMonName,
          children: [
            {
              name: 'ID',
              value: mon.MonID,
            },
            {
              name: 'MonMapID',
              value: mon.MonMapID,
            },
          ],
        };

        ret.children.push(
          { name: 'Race', value: mon.sRace },
          { name: 'Level', value: (mon.iLvl ?? mon.intLevel)! },
        );

        if (type === '5') {
          ret.children.push({
            name: 'Health',
            value: `${mon.intHP}/${mon.intHPMax}`,
          });
        } else {
          ret.children.push({
            name: 'Cell',
            value: mon.strFrame!,
          });
        }

        return ret;
      });
      break;
  }

  return out;
}

window.addEventListener('DOMContentLoaded', async () => {
  {
    const btn = document.querySelector('#loader-btn') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      const id = (document.querySelector('#loader-id') as HTMLInputElement)
        .value;
      const type = (
        document.querySelector('#loader-select') as HTMLSelectElement
      ).value;
      await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.LOADER_GRABBER_LOAD,
        data: { id, type },
      });
    });
  }

  {
    const btn = document.querySelector('#grabber-btn') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      const type = (
        document.querySelector('#grabber-select') as HTMLSelectElement
      ).value;

      const ret = await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.LOADER_GRABBER_GRAB,
          data: { type },
        })
        .then((res) => res as { data: TreeInputData; type: string });

      if (!ret) return;

      {
        const { data, type } = ret;
        const treeData = parseTreeData(data as TreeInputData, type);

        lastData = ret;

        renderTree(treeData);
      }
    });
  }

  {
    const btn = document.querySelector('#grabber-export') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      if (!lastData) return;

      const blob = new Blob([JSON.stringify(lastData, null, 2)], {
        type: 'text/plain',
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'data.json';
      a.click();
    });
  }
});

type TreeNode = {
  children?: TreeNode[];
  name: string;
  value?: number | string | undefined;
};

type ShopData = {
  items: {
    ItemID: number | string;
    ShopItemID: number | string;
    bCoins: number;
    iCost: number;
    sDesc: string;
    sName: string;
    sType: string;
  }[];
};

type Quest = {
  QuestID: number | string;
  RequiredItems: {
    ItemID: number | string;
    bTemp: boolean;
    iQty: number;
    sDesc: string;
    sName: string;
  }[];
  Rewards: {
    DropChance: number;
    ItemID: number | string;
    iQty: number;
    sName: string;
  }[];
  sDesc: string;
  sName: string;
};

type InventoryItem = {
  CharItemID?: number | string;
  ItemID: number | string;
  bCoins?: number;
  iQty: number;
  iStk: number;
  sDesc?: string;
  sName: string;
  sType: string;
};

type Monster = {
  MonID: number | string;
  MonMapID: number | string;
  iLvl?: number;
  intHP?: number;
  intHPMax?: number;
  intLevel?: number;
  sRace: string;
  strFrame?: string;
  strMonName: string;
};

type TreeInputData = InventoryItem[] | Monster[] | Quest[] | ShopData;
