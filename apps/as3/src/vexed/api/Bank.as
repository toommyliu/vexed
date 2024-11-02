
package vexed.api
{
    import vexed.Main;

    public class Bank
    {
        private static var game:* = Main.instance.getGame();

        public static function items():Array
        {
            return game.world.bankinfo.items;
        }

        public static function getItem(name:String):Object
        {
            for (var i:int = 0; i < game.world.bankinfo.items.length; i++)
            {
                if (game.world.bankinfo.items[i].name.toLowerCase() == name.toLowerCase())
                {
                    return game.world.bankinfo.items[i];
                }
            }
            return null;
        }

        public static function getItemByID(id:int):Object
        {
            for (var i:int = 0; i < game.world.bankinfo.items.length; i++)
            {
                if (game.world.bankinfo.items[i].ItemID == id)
                {
                    return game.world.bankinfo.items[i];
                }
            }
            return null;
        }

        public static function slots():Number
        {
            return game.world.myAvatar.objData.iBankSlots;
        }

        public static function usedSlots():Number
        {
            return game.world.myAvatar.iBankCount;
        }

        public static function deposit(name:String):Boolean
        {
            var item:Object = Inventory.getItem(name) || Inventory.getItemByID(parseInt(name));
            if (item != null)
            {
                game.world.sendBankFromInvRequest(item);
                return true;
            }
            return false;
        }

        public static function withdraw(name:String):Boolean
        {
            var item:Object = getItem(name) || getItemByID(parseInt(name));
            if (item != null)
            {
                game.world.sendBankToInvRequest(item);
                return true;
            }
            return false;
        }

        public static function swap(invItemName:*, bankItemName:*):Boolean
        {
            var invItem:Object = null;
            var bankItem:Object = null;

            if (typeof invItemName == 'string')
            {
                invItem = getItem(invItemName) || getItemByID(parseInt(invItemName));
            }
            else if (typeof invItemName == 'number')
            {
                invItem = getItemByID(invItemName);
            }

            if (typeof bankItemName == 'string')
            {
                bankItem = getItem(bankItemName) || getItemByID(parseInt(bankItemName));
            }
            else if (typeof bankItemName == 'number')
            {
                bankItem = getItemByID(bankItemName);
            }

            if (invItem != null && bankItem != null)
            {
                game.world.sendSwapBankRequest(invItem, bankItem);
                return true;
            }
            return false;
        }

        public static function open():void
        {
            game.world.toggleBank();
        }

        public static function load():void
        {
            game.sfc.sendXtMessage("zm", "loadBank", ["All"], "str", game.world.curRoom);
        }
    }
}