package vexed.game {
  import vexed.Main;

  public class DropStack {
    private static var game:* = Main.getInstance().getGame();

    private static var cls:Class = Main.getInstance().getGameDomain().getDefinition("liteAssets.draw.customDrops") as Class;

    public static function acceptDrop(itemId:int):void {
      if (!itemId)
        return;

      game.sfc.sendXtMessage("zm", "getDrop", [itemId], "str", game.world.curRoom);
    }

    public static function rejectDrop(itemName:String, itemId:int):void {
      if (game.litePreference.data.bCustomDrops) {
        if (!game.cDropsUI.isMenuOpen()) {
          game.cDropsUI.onToggleMenu(null);
        }
        game.cDropsUI.onBtNo(game.world.invTree[itemId]);
      }
      else {
        itemName = itemName.toLowerCase();

        for (var i:int = game.ui.dropStack.numChildren - 1; i >= 0; i--) {
          var child:* = game.ui.dropStack.getChildAt(i);
          if (child.cnt.strName.text.toLowerCase().indexOf(itemName) == 0)
            game.ui.dropStack.removeChildAt(i);
        }
      }
    }

    public static function isUsingCustomDrops():Boolean {
      return game.litePreference.data.bCustomDrops;
    }

    public static function setCustomDropsUi(on:Boolean):void {
      game.litePreference.data.bCustomDrops = on;
      game.litePreference.flush();

      if (on) {
        if (game.cDropsUI) {
          game.cDropsUI.cleanup();
        }
        game.cDropsUI = new cls(game);
      }
      else if (game.cDropsUI != null) {
        game.cDropsUI.cleanup();
      }
    }

    public static function isCustomDropsUiOpen():Boolean {
      return game.cDropsUI !== null && game.cDropsUI.isMenuOpen();
    }
  }
}