class TempInventory {
	static get items() {
		return Flash.call(window.swf.GetTempItems);
	}
}
