class TempInventory {
    static get items() {
        return Flash.call(swf.GetTempItems);
    }
};