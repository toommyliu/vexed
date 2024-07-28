const treeData = [
	{
		name: 'Frogzard',
		children: [
			{ name: 'ID', value: '31' },
			{ name: 'MonMapID', value: '1' },
			{ name: 'Race', value: 'None' },
			{ name: 'Level', value: '2' },
			{ name: 'Health', value: '310/310' },
		],
	},
	{
		name: 'Frogzard',
		children: [
			{ name: 'ID', value: '31' },
			{ name: 'MonMapID', value: '2' },
			{ name: 'Race', value: 'None' },
			{ name: 'Level', value: '2' },
			{ name: 'Health', value: '310/310' },
		],
	},
];
treeData.push(...treeData);
treeData.push(...treeData);

function createTreeNode(data) {
	const node = document.createElement('div');
	node.className = 'tree-node';

	const content = document.createElement('div');
	content.className = 'tree-content';

	const expander = document.createElement('span');
	expander.className = 'expander';
	expander.textContent = data.children ? '▶' : '  ';

	const text = document.createElement('span');
	text.textContent = data.name;

	content.appendChild(expander);
	content.appendChild(text);
	node.appendChild(content);

	if (data.children) {
		const childContainer = document.createElement('div');
		childContainer.className = 'child-container hidden';

		data.children.forEach((child) => {
			const childLine = document.createElement('div');
			childLine.className = 'child-line';

			const nameSpan = document.createElement('span');
			nameSpan.className = 'child-name';
			nameSpan.textContent = `${child.name}: `;

			const valueSpan = document.createElement('span');
			valueSpan.className = 'child-value';
			valueSpan.textContent = child.value;
			valueSpan.addEventListener('click', (e) => {
				// Prevent triggering parent's click event
				e.stopPropagation();
				navigator.clipboard.writeText(valueSpan.textContent);
			});

			childLine.appendChild(nameSpan);
			childLine.appendChild(valueSpan);
			childContainer.appendChild(childLine);
		});

		node.appendChild(childContainer);

		content.addEventListener('click', (e) => {
			childContainer.classList.toggle('hidden');
			expander.textContent = childContainer.classList.contains('hidden')
				? '▶'
				: '▼';
		});
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

window.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('tree');
	const tree = createTree(treeData);
	container.appendChild(tree);
});
