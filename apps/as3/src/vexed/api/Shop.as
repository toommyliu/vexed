package vexed.api
{
    import vexed.Main;

    public class Shop
    {
        private static var game:* = Main.instance.getGame();

        public static function buyItemByName(name:String, quantity:int = -1):void
        {
            for each (var item:* in game.world.shopinfo.items)
            {
                if (item.sName.toLowerCase() == name.toLowerCase())
                {
                    if (quantity == -1)
                        game.world.sendBuyItemRequest(item);
                    else
                    {
                        var buyItem:* = new Object();
                        buyItem = item;
                        buyItem.iSel = item;
                        buyItem.iQty = quantity;
                        buyItem.iSel.iQty = quantity;
                        buyItem.accept = 1;
                        game.world.sendBuyItemRequestWithQuantity(buyItem);
                    }
                    break;
                }
            }
        }

        public static function buyItemByID(id:int, shopItemID:int, quantity:int = -1):void
        {
            for each (var item:* in game.world.shopinfo.items)
            {
                if (item.ItemID == id && (shopItemID == 0 || item.ShopItemID == shopItemID))
                {
                    if (quantity == -1)
                        game.world.sendBuyItemRequest(item);
                    else
                    {
                        var buyItem:* = new Object();
                        buyItem = item;
                        buyItem.iSel = item;
                        buyItem.iQty = quantity;
                        buyItem.iSel.iQty = quantity;
                        buyItem.accept = 1;
                        game.world.sendBuyItemRequestWithQuantity(buyItem);
                    }
                    break;
                }
            }
        }
    }
}