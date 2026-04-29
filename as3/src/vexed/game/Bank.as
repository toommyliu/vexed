package vexed.game
{
  import vexed.Main;
  import flash.display.MovieClip;

  [BridgeNamespace("bank")]
  public class Bank
  {
    // BankController game.world.bankinfo

    private static var game:Object = Main.getInstance().getGame();

    private static var loaded:Boolean = false;

    [BridgeExport]
    public static function getItems():Array
    {
      if (!game.world.bankinfo || !(game.world.bankinfo.items is Array))
      {
        return [];
      }

      return game.world.bankinfo.items;
    }

    [BridgeExport]
    public static function getItem(item:*):Object
    {
      if (!game.world.bankinfo)
      {
        return null;
      }

      var itemId:Number = ItemLookup.toItemId(item);
      if (!isNaN(itemId) && game.world.bankinfo.getBankItem is Function)
      {
        var bankItem:Object = game.world.bankinfo.getBankItem(int(itemId));
        if (bankItem)
        {
          return bankItem;
        }
      }

      return ItemLookup.find(game.world.bankinfo.items, item);
    }

    [BridgeExport]
    public static function contains(item:*, quantity:int = 1):Boolean
    {
      var itemObj:Object = getItem(item);
      if (!itemObj)
      {
        return false;
      }

      return itemObj.iQty >= quantity;
    }

    [BridgeExport]
    public static function loadItems(force:Boolean = false):void
    {
      if (loaded && !force)
      {
        return;
      }

      game.getBank();
      loaded = true;
    }

    [BridgeExport]
    public static function getSlots():int
    {
      return game.world.myAvatar.objData.iBankSlots;
    }

    [BridgeExport]
    public static function getUsedSlots():int
    {
      return game.world.myAvatar.iBankCount;
    }

    [BridgeExport]
    public static function deposit(key:*):Boolean
    {
      var item:Object = Inventory.getItem(key);
      if (!item)
      {
        return false;
      }

      game.world.sendBankFromInvRequest(item);
      return true;
    }

    [BridgeExport]
    public static function withdraw(key:*):Boolean
    {
      var item:Object = getItem(key);
      if (!item)
      {
        return false;
      }

      game.world.sendBankToInvRequest(item);
      return true;
    }

    [BridgeExport]
    public static function swap(invKey:*, bankKey:*):Boolean
    {
      var invItem:Object = Inventory.getItem(invKey);
      var bankItem:Object = getItem(bankKey);

      if (!invItem || !bankItem)
      {
        return false;
      }

      game.world.sendBankSwapInvRequest(bankItem, invItem);
      return true;
    }

    // world.toggleBank
    [BridgeExport]
    public static function open():void
    {
      if (!loaded)
      {
        loadItems();
      }
      if (!game.world.uiLock)
      {
        if (game.ui.mcPopup.currentLabel == "Bank")
        {
          MovieClip(game.ui.mcPopup.getChildByName("mcBank")).fClose();
        }
        else
        {
          game.ui.mcPopup.fOpen("Bank");
        }
      }
    }

    [BridgeExport]
    public static function isOpen():Boolean
    {
      return game.ui.mcPopup.currentLabel === "Bank";
    }

    [BridgeIgnore]
    public static function onLogout():void
    {
      loaded = false;
    }
  }
}
