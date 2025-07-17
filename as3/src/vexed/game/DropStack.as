package vexed.game {
  import vexed.Main;
  import flash.events.MouseEvent;
  import flash.filters.ColorMatrixFilter;

  public class DropStack {
    private static var game:* = Main.getInstance().getGame();

    private static var cls:Class = Main.getInstance().getGameDomain().getDefinition("liteAssets.draw.customDrops") as Class;

    // private static var inactive:ColorMatrixFilter =          new

    // var _loc2_:AdjustColor = new AdjustColor();
    // _loc2_.saturation = -100;
    // _loc2_.brightness = -100;
    // _loc2_.contrast = 0;
    // _loc2_.hue = 0;
    // inactive = new ColorMatrixFilter(_loc2_.CalculateFinalFlatArray());

    private static var inactive:ColorMatrixFilter = new ColorMatrixFilter([0.3, 0.3, 0.3, 0, 0,
          0.3, 0.3, 0.3, 0, 0,
          0.3, 0.3, 0.3, 0, 0,
          0, 0, 0, 1, 0]);

    public static function acceptDrop(itemId:int):void {
      if (!itemId) {
        return;
      }

      game.sfc.sendXtMessage("zm", "getDrop", [itemId], "str", game.world.curRoom);
    }

    public static function rejectDrop(itemName:String, itemId:String):void {
      try {
        if (game.litePreference.data.bCustomDrops) {
          // Main.getInstance().getExternal().debug("is using custom drops");
          // if (!game.cDropsUI) {
          // Main.getInstance().getExternal().debug("cDropsUI is null!");
          // return;
          // }
          // if (!game.cDropsUI.isMenuOpen()) {
          // Main.getInstance().getExternal().debug("is not open");
          // game.cDropsUI.onToggleMenu(new MouseEvent(MouseEvent.CLICK));
          // // game.cDropsUI.inner_menu.visible = true;
          // }
          // else {
          // Main.getInstance().getExternal().debug("is open");
          // }
          // Main.getInstance().getExternal().debug("checking if menu is open");
          // if (!game.cDropsUI.isMenuOpen()) {
          // Main.getInstance().getExternal().debug("menu not open still");
          // }
          // else {
          // Main.getInstance().getExternal().debug("thinks its open");
          // }
          // Main.getInstance().getExternal().debug("rejecting drop");
          // if (game.world.invTree[itemId] == null) {
          // Main.getInstance().getExternal().debug("item not found");
          // }
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
      catch (e:Error) {
        Main.getInstance().getExternal().debug("Error rejecting drop: " + e.message);
      }
    }

    public static function isUsingCustomDrops():Boolean {
      return game.litePreference.data.bCustomDrops;
    }

    // public static function setCustomDropsUi(on:Boolean, draggable:Boolean):void {
    // game.litePreference.data.bCustomDrops = on;
    // game.litePreference.data.dOptions["dragMode"] = draggable;
    // game.litePreference.flush();

    // // Main.getInstance().getExternal().debug("setCustomDropsUi: " + on);
    // if (on) {
    // // Main.getInstance().getExternal().debug("creating custom drops ui");
    // if (game.cDropsUI) {
    // // Main.getInstance().getExternal().debug("cleaning up old custom drops ui");
    // game.cDropsUI.cleanup();
    // }
    // // Main.getInstance().getExternal().debug("creating new custom drops ui");

    // // Create the custom drops ui
    // game.cDropsUI = new cls(game);

    // // Set up draggable state or not
    // game.cDropsUI.onChange(draggable);

    // }
    // else if (game.cDropsUI != null) {
    // Main.getInstance().getExternal().debug("cleaning up custom drops ui");
    // game.cDropsUI.cleanup();
    // }
    // }

    public static function setCustomDropsUiOpen(on:Boolean):void {
      // game.litePreference.data.dOptions["openMenu"] = on;
      // game.litePreference.flush();

      if (!game.cDropsUI) {
        Main.getInstance().getExternal().debug("cDropsUI is null; cannot toggle custom drops UI");
        return;
      }

      var isDraggable:Boolean = false;
      try {
        isDraggable = ("mcDraggable" in game.cDropsUI) && Boolean(game.cDropsUI.mcDraggable);
      }
      catch (e:Error) {
        isDraggable = false;
      }

      try {
        // debug print typeof game.cDropsUI.onToggleMenu
        // Main.getInstance().getExternal().debug("Toggling custom drops UI function: " + (isDraggable ? "onToggleMenu" : "onToggleAttach"));
        // typeof(game.cDropsUI.onToggleMenu) === "function" or typeof(game.cDropsUI.onToggleAttach) === "function"
        // Main.getInstance().getExternal().debug("typeof game.cDropsUI.onToggleMenu: " + typeof (game.cDropsUI.onToggleMenu));
        // Main.getInstance().getExternal().debug("typeof game.cDropsUI.onToggleAttach: " + typeof (game.cDropsUI.onToggleAttach));
        if (isDraggable && ("onToggleMenu" in game.cDropsUI)) {
          Main.getInstance().getExternal().debug("Calling onToggleMenu");
          game.cDropsUI.onToggleMenu(new MouseEvent(MouseEvent.CLICK));
        }
        else if ("onToggleAttach" in game.cDropsUI) {
          Main.getInstance().getExternal().debug("Calling onToggleAttach");
          game.cDropsUI.onToggleAttach(new MouseEvent(MouseEvent.CLICK));
        }
        else {
          Main.getInstance().getExternal().debug("Neither onToggleMenu nor onToggleAttach found on cDropsUI");
        }
      }
      catch (e:Error) {
        Main.getInstance().getExternal().debug("Error toggling custom drops UI: " + e.message);
      }
    }

    public static function isCustomDropsUiOpen():Boolean {
      if (game.cDropsUI) {
        return game.cDropsUI.isMenuOpen();
      }

      return false;
    }
  }
}