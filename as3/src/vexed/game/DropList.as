package vexed.game {
  import vexed.Main;
  import flash.events.MouseEvent;
  import flash.filters.ColorMatrixFilter;
  import flash.utils.getQualifiedClassName;
  import flash.utils.Dictionary;

  public class DropList {
    private static var game:* = Main.getInstance().getGame();

    private static var cls:Class = Main.getInstance().getGameDomain().getDefinition("liteAssets.draw.customDrops") as Class;

    public static var drops:Dictionary = new Dictionary();

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

    private static const DROP_REGEX:RegExp = /(.*)\s+x\s*(\d*)/;

    public static function updateCount(itemName:String, qty:int):void {
      if (!drops[itemName]) {
        drops[itemName] = 0;
      }
      drops[itemName] += qty;
    }

    public static function getDrops():Object {
      var json:Object = {};
      for (var itemName:String in drops) {
        json[itemName] = drops[itemName];
      }
      return JSON.stringify(json);
    }

    // Parse the item name and count from the drop string
    public static function parseDrop(name:*):* {
      var ret:* = new Object();
      var lowerName:String = name.toLowerCase().trim();
      ret.name = lowerName;
      ret.count = 1;
      var res:Object = DROP_REGEX.exec(lowerName);
      if (res != null) {
        ret.name = res[1].replace(/\s+$/, "");
        var countStr:String = res[2];
        if (countStr != "") {
          ret.count = int(countStr);
        }
      }
      return ret;
    }

    public static function acceptDrop(itemId:int):void {
      if (isUsingCustomDrops()) {
        var source:* = game.cDropsUI.mcDraggable ? game.cDropsUI.mcDraggable.menu : game.cDropsUI;
        for (var i:int = 0; i < source.numChildren; i++) {
          var child:* = source.getChildAt(i);
          if (child.itemObj) {
            var itemName:String = child.itemObj.sName.toLowerCase();
            child.btYes.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
          }
        }
      }
      else {
        var children:int = game.ui.dropStack.numChildren;
        for (i = 0; i < children; i++) {
          var type:String = getQualifiedClassName(child);
          if (type.indexOf("DFrame2MC") != -1) {
            var drop:* = parseDrop(child.cnt.strName.text);
            var name:* = drop.name;
            child.cnt.ybtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
          }
        }
      }
      // game.sfc.sendXtMessage("zm", "getDrop", [itemId], "str", game.world.curRoom);
    }

    // Toggle open/closed of custom ui
    public static function toggleUi():void {
      if (isDraggable()) {
        game.cDropsUI.mcDraggable.menuBar.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
      }
      else if (isUsingCustomDrops()) {
        game.cDropsUI.onShow();
      }
    }

    public static function acceptList(itemIds:Array):void {
      if (isUsingCustomDrops()) {

      }
      else {

      }
    }

    public static function rejectDrop(itemName:String, itemId:String):void {
      try {
        if (isUsingCustomDrops()) {
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

    // Whether using custom drops ui
    public static function isUsingCustomDrops():Boolean {
      return game.litePreference.data.bCustomDrops;
    }

    // Whether using custom drops ui with draggable mode
    public static function isDraggable():Boolean {
      return isUsingCustomDrops() && Boolean(game.cDropsUI.mcDraggable);
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