class House {
	static get items() {
		return Flash.call(window.swf.GetHouseItems);
	}

	static get totalSlots() {
		return Flash.call(window.swf.HouseSlots);
	}
}