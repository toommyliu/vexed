package vexed.api
{
    import vexed.Main;

    public class TempInventory
    {
        private static var game:* = Main.instance.getGame();

        public static function getTempItems():String
        {
            return JSON.stringify(game.world.myAvatar.tempitems);
        }

        public static function getTempItem(name:String):Object
        {
            for each (var item:Object in game.world.myAvatar.tempitems)
            {
                if (item.sName.toLowerCase() == name.toLowerCase())
                {
                    return item;
                }
            }
            return null;
        }

        public static function isItemInTemp(itemName:String, itemQty:String):Boolean
        {
            var item:Object = getTempItem(itemName);
            if (item == null)
            {
                return false;
            }

            if (itemQty == "*")
            {
                return true;
            }
            else
            {
                if (item.iQty >= parseInt(itemQty))
                {
                    return true;
                }
            }

            return false;
        }
    }
}