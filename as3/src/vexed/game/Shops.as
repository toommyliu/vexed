package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  [BridgeNamespace("shops")]
  public class Shops {
    private static var game:Object = Main.getInstance().getGame();

    private static function getShopInfo():Object {
      return game.world.shopinfo;
    }

    private static function getShopItemsSafe():Array {
      var info:Object = getShopInfo();
      if (!info || !(info.items is Array)) {
        return [];
      }

      return info.items;
    }

    private static function getInventoryItem(key:*):Object {
      var item:Object = Inventory.getItem(key);
      if (item || !(key is String)) {
        return item;
      }

      var itemId:Number = Number(key);
      if (isNaN(itemId)) {
        return null;
      }

      return Inventory.getItem(int(itemId));
    }

    private static function sendBuy(item:Object, quantity:int):void {
      if (quantity === 1) {
        game.world.sendBuyItemRequest(item);
        return;
      }

      game.world.sendBuyItemRequestWithQuantity({
        accept: 1,
        iQty: quantity,
        iSel: item
      });
    }

    private static function sendSell(item:Object, quantity:int):void {
      if (quantity === -1) {
        game.world.sendSellItemRequest(item);
        return;
      }

      game.world.sendSellItemRequestWithQuantity({
        accept: 1,
        iSel: item,
        iQty: quantity
      });
    }

    [BridgeExport]
    public static function getItem(key:*):Object {
      if (!key) {
        return null;
      }

      var items:Array = getShopItemsSafe();
      if (items.length === 0) {
        return null;
      }

      var item:Object = ItemLookup.find(items, key);
      if (item || !(key is String)) {
        return item;
      }

      var itemId:Number = Number(key);
      if (isNaN(itemId)) {
        return null;
      }

      return ItemLookup.find(items, int(itemId));
    }

    [BridgeExport]
    public static function buyByName(name:String, quantity:int = 1):Boolean {
      if (!name || quantity <= 0) {
        return false;
      }

      var item:Object = getItem(name);
      if (!item) {
        return false;
      }

      sendBuy(item, quantity);
      return true;
    }

    [BridgeExport]
    public static function buyById(id:*, quantity:int = 1):Boolean {
      if (!id || quantity <= 0) {
        return false;
      }

      if (!(id is String) && !(id is int) && !(id is uint) && !(id is Number)) {
        return false;
      }

      var item:Object = getItem(id);
      if (!item) {
        return false;
      }

      sendBuy(item, quantity);
      return true;
    }

    [BridgeExport]
    public static function sellByName(name:String, quantity:int = -1):Boolean {
      if (!name || (quantity !== -1 && quantity <= 0)) {
        return false;
      }

      var item:Object = Inventory.getItem(name);
      if (!item) {
        return false;
      }

      sendSell(item, quantity);
      return true;
    }

    [BridgeExport]
    public static function sellById(id:*, quantity:int = -1):Boolean {
      if (!id || (quantity !== -1 && quantity <= 0)) {
        return false;
      }

      if (!(id is String) && !(id is int) && !(id is uint) && !(id is Number)) {
        return false;
      }

      var item:Object = getInventoryItem(id);
      if (!item) {
        return false;
      }

      sendSell(item, quantity);
      return true;
    }

    [BridgeExport]
    public static function load(shopId:int):void {
      game.world.sendLoadShopRequest(shopId);
    }

    [BridgeExport]
    public static function loadHairShop(shopId:int):void {
      game.world.sendLoadHairShopRequest(shopId);
    }

    [BridgeExport]
    public static function loadArmorCustomize():void {
      game.openArmorCustomize();
    }

    [BridgeExport]
    public static function isMergeShop():Boolean {
      var info:Object = getShopInfo();
      if (!info) {
        return false;
      }

      return game.isMergeShop(info);
    }

    [BridgeExport]
    public static function canBuyItem(itemName:String):Boolean {
      if (!getShopInfo()) {
        return false;
      }

      var item:Object = getItem(itemName);
      if (!item) {
        return false;
      }

      if (!isMergeShop()) {
        return Util.canBuyItem(item);
      }

      if (!(item.turnin is Array)) {
        return true;
      }

      for each (var req:Object in item.turnin) {
        if (!req || !req.sName) {
          continue;
        }

        var requiredQty:int = int(req.iQty);
        if (requiredQty <= 0) {
          requiredQty = 1;
        }

        if (!Inventory.contains(req.sName, requiredQty)) {
          return false;
        }
      }

      return true;
    }
  }
}
