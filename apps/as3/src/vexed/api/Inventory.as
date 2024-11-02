package vexed.api
{
    import vexed.Main;

    public class Inventory
    {
        private static var game:* = Main.instance.getGame();

        public static function items():Array
        {
            return game.world.myAvatar.items;
        }

        public static function getItem(name:String):Object
        {
            for (var i:int = 0; i < game.world.myAvatar.items.length; i++)
            {
                if (game.world.myAvatar.items[i].name.toLowerCase() == name.toLowerCase())
                {
                    return game.world.myAvatar.items[i];
                }
            }
            return null;
        }

        public static function getItemByID(id:int):Object
        {
            for (var i:int = 0; i < game.world.myAvatar.items.length; i++)
            {
                if (game.world.myAvatar.items[i].ItemID == id)
                {
                    return game.world.myAvatar.items[i];
                }
            }
            return null;
        }

        public static function slots():Number
        {
            return game.world.myAvatar.objData.iBagSlots;
        }

        public static function usedSlots():Number
        {
            return game.world.myAvatar.items.length;
        }
    }
}