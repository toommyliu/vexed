import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';

// square-plus
const svgOpen =
	'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM200 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>';

// square-minus
const svgClose =
	'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm88 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>';

let lastData: unknown = null;

function createTreeNode(data) {
	// The node
	const div = document.createElement('div');
	div.className = 'node';

	if (data.children && data.children.length > 0) {
		div.classList.add('has-children');
	}

	// The content
	const $content = document.createElement('div');
	$content.className = 'content';

	// The name of the node
	const $text = document.createElement('span');
	$text.textContent = `${data.name}${data.value ? ':' : ''}`;

	$content.appendChild($text);
	div.appendChild($content);

	if (data.children && !data.value) {
		// Branch (root)
		const $expander = document.createElement('div');
		$expander.className = 'expander';
		$expander.innerHTML = svgOpen;

		$content.insertBefore($expander, $text);

		const $childcontainer = document.createElement('div');
		$childcontainer.className = 'child-container';
		$childcontainer.style.display = 'none';

		// Recursively create child nodes
		for (const child of data.children) {
			const $childnode = createTreeNode(child);
			$childcontainer.appendChild($childnode);
		}

		div.appendChild($childcontainer);

		$content.addEventListener('click', (ev) => {
			ev.stopPropagation();
			$childcontainer.style.display =
				$childcontainer.style.display === 'none' ? '' : 'none';
			const isHidden = $childcontainer.style.display === 'none';
			$expander.innerHTML = isHidden ? svgOpen : svgClose;
		});
	} else if (!data.children && (data.value || !data.value)) {
		$text.classList.add('child-name');
		// Data leaf (child)
		const $span = document.createElement('span');
		$span.className = 'child-value';
		$span.textContent = data.value ?? 'N/A';
		if (!data.value) {
			$text.textContent += ':';
		}

		$span.addEventListener('click', async (ev) => {
			ev.stopPropagation();
			await navigator.clipboard.writeText(data.value).catch(() => {});
		});

		$content.appendChild($span);
	}

	return div;
}

function createTree(data) {
	const tree = document.createDocumentFragment();
	for (const item of data) {
		const node = createTreeNode(item);
		tree.appendChild(node);
	}
	return tree;
}

function parseTreeData(data, type) {
	let out = [];

	switch (type) {
		case '0':
			out = data.items.map((item) => {
				return {
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
				};
			});
			break;
		case '1': // quest
			out = data.map((quest) => {
				return {
					name: `${quest.QuestID} - ${quest.sName}`,
					children: [
						{ name: 'ID', value: quest.QuestID },
						{ name: 'Description', value: quest.sDesc },
						{
							name: 'Required Items',
							children: quest.RequiredItems.map((i) => {
								return {
									name: i.sName,
									children: [
										{ name: 'ID', value: i.ItemID },
										{ name: 'Quantity', value: i.iQty },
										{
											name: 'Temporary',
											value: i.bTemp ? 'Yes' : 'No',
										},
										{
											name: 'Description',
											value: i.sDesc,
										},
									],
								};
							}),
						},
						{
							name: 'Rewards',
							children: quest.Rewards.map((item) => {
								return {
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
								};
							}),
						},
					],
				};
			});
			break;
		case '2':
		case '4':
			out = data.map((item) => {
				return {
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
							value:
								item.sType === 'Class'
									? '1/1'
									: `${item.iQty}/${item.iStk}`,
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
				};
			});
			break;
		case '3':
			out = data.map((item) => {
				return {
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
				};
			});
			break;
		case '5':
		case '6':
			out = data.map((mon) => {
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
					{ name: 'Level', value: mon.iLvl ?? mon.intLevel },
				);

				if (type === 5) {
					ret.children.push({
						name: 'Health',
						value: `${mon.intHP}/${mon.intHPMax}`,
					});
				} else {
					ret.children.push({
						name: 'Cell',
						value: mon.strFrame,
					});
				}

				return ret;
			});
			break;
	}

	return out;
}

window.addEventListener('ready', async () => {
	{
		const btn = document.querySelector('#loader-btn') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			const id = (
				document.querySelector('#loader-id') as HTMLInputElement
			).value;
			const type = (
				document.querySelector('#loader-select') as HTMLSelectElement
			).value;

			window.msgPort?.postMessage({
				event: IPC_EVENTS.LOADER_GRABBER_LOAD,
				args: { id, type },
			});
		});
	}

	{
		const btn = document.querySelector('#grabber-btn') as HTMLButtonElement;
		btn.addEventListener('click', async () => {
			const type = (
				document.querySelector('#grabber-select') as HTMLSelectElement
			).value;
			window.msgPort?.postMessage({
				event: IPC_EVENTS.LOADER_GRABBER_GRAB,
				args: { type },
			});
		});
	}

	{
		const btn = document.querySelector(
			'#grabber-export',
		) as HTMLButtonElement;
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

	window.addMsgHandler(async (ev) => {
		if (ev.data.event === IPC_EVENTS.LOADER_GRABBER_GRAB) {
			const {
				args: { data, type },
			} = ev.data;

			let treeData;

			treeData = parseTreeData(data, type);
			lastData = data;

			const container = document.querySelector('#tree');
			container!.innerHTML = '';

			const tree = createTree(treeData);
			container.appendChild(tree);
		}
	});
});