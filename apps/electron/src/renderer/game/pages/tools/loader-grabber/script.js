const parent = window.opener;

// square-plus
const svgOpen =
	'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM200 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>';

// square-minus
const svgClose =
	'<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm88 200l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>';

function createTreeNode(data) {
	// The node
	const node = document.createElement('div');
	node.className = 'node';

	// The content
	const content = document.createElement('div');
	content.className = 'content';

	// The name of the node
	const text = document.createElement('span');
	text.textContent = `${data.name}${data.value ? ':' : ''}`;

	content.appendChild(text);
	node.appendChild(content);

	if (data.children && !data.value) {
		// Branch
		const expander = document.createElement('span');
		expander.className = 'expander';
		expander.innerHTML = svgOpen;
		content.insertBefore(expander, text);

		const childContainer = document.createElement('div');
		childContainer.className = 'child-container w3-hide';

		// Nested child nodes
		for (const child of data.children) {
			const childNode = createTreeNode(child);
			childContainer.appendChild(childNode);
		}

		node.appendChild(childContainer);

		content.addEventListener('click', (e) => {
			e.stopPropagation();
			childContainer.classList.toggle('w3-hide');
			const isHidden = childContainer.classList.contains('w3-hide');
			expander.innerHTML = isHidden ? svgOpen : svgClose;
		});
	} else if (data.value) {
		// Leaf
		const span = document.createElement('span');
		span.className = 'child-value';
		span.textContent = data.value;
		span.addEventListener('click', (e) => {
			e.stopPropagation();
			navigator.clipboard.writeText(data.value);
		});
		content.appendChild(span);
	}

	return node;
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
		case 0: // shop
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
		case 1: // quest
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
											value: i.sDesc ?? '',
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
		case 2: // inventory
		case 4: // bank
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
							value: `${item.iQty}/${item.iStk}`,
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
		case 3: // temp. inventory
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
		case 5: // cell monsters
		case 6: // map monsters
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

window.addEventListener('message', (ev) => {
	const {
		data: {
			event,
			args: { data, type },
		},
	} = ev;

	let treeData;

	switch (event) {
		case 'tools:loadergrabber:grab':
			treeData = parseTreeData(data, type);

			const container = document.getElementById('tree');

			// Clear the tree
			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}

			const tree = createTree(treeData);
			container.appendChild(tree);
			break;
	}
});

window.addEventListener('DOMContentLoaded', async () => {
	{
		const btn = document.getElementById('loader-btn');
		btn.addEventListener('click', async () => {
			const $id = document.getElementById('loader-id');
			const $source = document.getElementById('loader-select');

			const source = $source.value;
			const id = $id.value;

			if (source !== '3' && !id) {
				return;
			}

			parent.postMessage({
				event: 'tools:loadergrabber:load',
				args: {
					type: Number.parseInt(source),
					id: Number.parseInt(id),
				},
			});
		});
	}

	{
		const btn = document.getElementById('grabber-btn');
		const $source = document.getElementById('grabber-select');
		btn.addEventListener('click', async () => {
			const type = $source.value;
			if (!type) {
				return;
			}

			parent.postMessage({
				event: 'tools:loadergrabber:grab',
				args: { type: Number.parseInt(type) },
			});
		});
	}
});
