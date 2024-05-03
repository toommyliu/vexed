class Inventory {
	static get items() {
		return Flash.call(window.swf.GetInventoryItems);
	}

	static get totalSlots() {
		return Flash.call(window.swf.InventorySlots);
	}

	static get usedSlots() {
		return Flash.call(window.swf.UsedInventorySlots);
	}

	static get availableSlots() {
		return Inventory.totalSlots - Inventory.usedSlots;
	}
}
