window.addEventListener('DOMContentLoaded', async () => {
	const locations = document.getElementById('locations');
	const ret = ['hello', 'world', 'this', 'is', 'a', 'test']
	ret.push(...ret);
	ret.push(...ret);
	ret.push(...ret);

	for (const location of ret) {
		const btn = document.createElement('button');
		btn.classList.add('w3-button', 'w3-dark-grey', 'w3-block');
		btn.textContent = location;
		locations.appendChild(btn);
	}
});

