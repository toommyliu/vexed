class Bank {
	static get items() {
		return Flash.call(window.swf.GetBankItems);
	}

	static get availableSlots() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.BankSlots);
	}

	static get usedSlots() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.UsedBankSlots);
	}

	static get totalSlots() {
		if (!Auth.loggedIn) return null;
		return Bank.availableSlots - Bank.usedSlots;
	}

	/**
	 * @param {string} name
	 */
	static deposit(name) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof name !== 'string') throw new Error('name must be a string');

		Flash.call(window.swf.TransferToBank, name);
	}

	static withdraw(name) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof name !== 'string') throw new Error('name must be a string');

		Flash.call(window.swf.TransferToInventory, name);
	}

	static swap(out_item, in_item) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof out_item !== 'string') throw new Error('out_item must be a string');
		if (typeof in_item !== 'string') throw new Error('in_item must be a string');

		Flash.call(window.swf.BankSwap, in_item, out_item);
	}

	static open() {
		if (!Auth.loggedIn) throw new Error('not logged in');

		Flash.call(window.swf.ShowBank);
	}
}
