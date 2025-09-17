package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class Shops {
    private static var game:Object = Main.getInstance().getGame();

    public static function getInfo():Object {
      return game.world.shopinfo;
    }

    public static function getItems():Array {
      return game.world.shopinfo.items;
    }

    public static function getItem(key:*):Object {
      if (!key)
        return null;

      if (game.world.shopinfo !== null && game.world.shopinfo.items is Array) {
        var item:Object;
        var items:Array = game.world.shopinfo.items;
        if (key is String) {
          key = key.toLowerCase();
          for each (item in items) {
            if (item.sName.toLowerCase() === key /* name key */ || item.ItemID === key /* string key */)
              return item;
          }
        }
        else if (key is int) {
          key = String(key);
          for each (item in items) {
            if (item.ItemID === key /* int key */)
              return item;
          }
        }
      }

      return null;
    }

    public static function buyByName(name:String, quantity:int = 1):Boolean {
      if (!name)
        return false;

      if (quantity <= 0)
        return false;

      var item:Object = getItem(name);
      if (!item)
        return false;

      if (quantity === 1) {
        game.world.sendBuyItemRequest(item);
      }
      else {
        var buyObj:Object = new Object();
        buyObj.accept = 1;
        buyObj.iQty = quantity;
        buyObj.iSel = item;
        game.world.sendBuyItemRequestWithQuantity(buyObj);
      }

      return true;
    }

    public static function buyById(id:* /* string or int ItemID */, quantity:int = 1):Boolean {
      if (!id)
        return false;

      if (!(id is String) && !(id is int))
        return false;

      return buyByName(String(id), quantity);
    }

    public static function sellByName(name:String, quantity:int = -1):Boolean {
      if (!name)
        return false;

      if (quantity !== -1 && quantity <= 0)
        return false;

      var item:Object = Inventory.getItem(name);
      if (!item)
        return false;

      if (quantity === -1) {
        // sell stack
        game.world.sendSellItemRequest(item);
      }
      else {
        // sell quantity
        var sellObj:Object = new Object();
        sellObj.accept = 1;
        sellObj.iSel = item;
        sellObj.iQty = quantity;
        game.world.sendSellItemRequestWithQuantity(sellObj);
      }
      return true;
    }

    public static function sellById(id:* /* string or int ItemID */, quantity:int = -1):Boolean {
      if (!id)
        return false;

      if (!(id is String) && !(id is int))
        return false;

      return sellByName(String(id), quantity);
    }

    public static function load(shopId:int):void {
      game.world.sendLoadShopRequest(shopId);
    }

    public static function loadHairShop(shopId:int):void {
      game.world.sendLoadHairShopRequest(shopId);
    }

    public static function loadArmorCustomize():void {
      game.openArmorCustomize();
    }

    public static function isMergeShop():Boolean {
      if (!game.world.shopinfo)
        return false;

      return game.isMergeShop(game.world.shopinfo);
    }

    public static function canBuyItem(itemName:String):Boolean {
      if (!game.world.shopinfo)
        return false;

      var item:Object = getItem(itemName);
      if (!item)
        return false;

      if (isMergeShop()) {
        for each (var req:Object in item.turnin) {
          if (!Inventory.contains(req.sName))
            return false;
        }

        return true;
      }
      else
        return Util.canBuyItem(item);
    }
  }
}
