package vexed.game
{
  import vexed.Main;
  import flash.display.MovieClip;

  public class Bank
  {
    // BankController game.world.bankinfo

    private static var game:Object = Main.getInstance().getGame();

    private static var loaded:Boolean = false;

    public static function getItems():Array
    {
      return game.world.bankinfo.items;
    }

    public static function getItem(item:*):Object
    {
      if (!item)
        return null;

      var items:Array = game.world.bankinfo.items;
      if (items is Array)
      {
        var ret:Object;
        if (item is String)
        {
          item = item.toLowerCase();
          for each (ret in items)
          {
            if (ret.sName.toLowerCase() === item)
              return ret;
          }
        }
        else if (item is int)
        {
          for each (ret in items)
          {
            if (ret.ItemID === item)
              return ret;
          }
        }
      }

      return null;
    }

    public static function contains(item:*, quantity:int = 1):Boolean
    {
      var itemObj:Object = getItem(item);
      if (!itemObj)
      {
        return false;
      }

      return itemObj.iQty >= quantity;
    }

    public static function loadItems(force:Boolean = false):void
    {
      if (loaded && !force)
      {
        return;
      }

      game.sfc.sendXtMessage("zm", "loadBank", ["All"], "str", game.world.curRoom);
      loaded = true;
    }

    public static function getSlots():int
    {
      return game.world.myAvatar.objData.iBankSlots;
    }

    public static function getUsedSlots():int
    {
      return game.world.myAvatar.iBankCount;
    }

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
    public static function open():void
    {
      if (!loaded)
      {
        game.getBank();
        loaded = true;
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

    public static function isOpen():Boolean
    {
      return game.ui.mcPopup.currentLabel === "Bank";
    }

    public static function onLogout():void
    {
      loaded = false;
    }
  }
}