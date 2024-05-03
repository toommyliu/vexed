class Bank {
	static get items() {
		return Flash.call(window.swf.GetBankItems);
	}

	static get availableSlots() {
		return Flash.call(window.swf.BankSlots);
	}

	static get usedSlots() {
		return Flash.call(window.swf.UsedBankSlots);
	}

	static get totalSlots() {
		return Bank.availableSlots - Bank.usedSlots;
	}

	static deposit(name) {
		Flash.call(window.swf.TransferToBank, name);
	}

	static withdraw(name) {
		Flash.call(window.swf.TransferToInventory, name);
	}

	static swap(out_item, in_item) {
		Flash.call(window.swf.BankSwap, in_item, out_item);
	}

	static open() {
		Flash.call(window.swf.ShowBank);
	}
}
