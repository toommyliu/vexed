package vexed.game
{
  import vexed.Main;

  public class Bank
  {
    // BankController game.world.bankinfo
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array
    {
      return game.world.bankinfo.items;
    }

    public static function getItem(key:* = null):Object
    {
      if (!key)
        return null;

      if (game.world.bankinfo.items is Array && game.world.bankinfo.items.length > 0)
      {
        var item:Object;
        if (key is String)
        {
          key = key.toLowerCase();
          for each (item in game.world.bankinfo.items)
          {
            if (item.sName.toLowerCase() === key)
              return item;
          }
        }
        else if (key is int)
        {
          if (game.world.bankinfo.isItemInBank(key))
            return game.world.bankinfo.getBankItem(key);
        }
      }

      return null;
    }

    public static function contains(key:*, quantity:int):Boolean
    {
      if (!key)
        return false;

      if (quantity is int && quantity <= 0)
        return false;

      var item:Object = getItem(key);
      if (!item)
        return false;

      if (!quantity)
        return true;

      return item.iQty >= quantity;
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
      if (!invItem)
      {
        return false;
      }

      var bankItem:Object = getItem(bankKey);
      if (!bankItem)
      {
        return false;
      }

      game.world.sendBankSwapInvRequest(bankItem, invItem);
      return true;
    }

    public static function open():void
    {
      game.world.toggleBank();
    }

    public static function isOpen():Boolean
    {
      return game.ui.mcPopup.currentLabel === "Bank";
    }
  }
}