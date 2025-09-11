package vexed.game {
  import vexed.Main;
  import flash.events.MouseEvent;
  import flash.utils.getQualifiedClassName;
  import flash.utils.Dictionary;
  import mx.utils.StringUtil;

  public class DropList {
    private static var game:* = Main.getInstance().getGame();

    private static var cls:Class = Main.getInstance().getGameDomain().getDefinition("liteAssets.draw.customDrops") as Class;

    public static var drops:Dictionary = new Dictionary();

    private static var items:Object = {};

    private static const DROP_REGEX:RegExp = /(.*)\s+x\s*(\d*)/i;

    private static const DROP_MC:String = "DFrame2MC";

    // Save item data
    public static function saveItem(itemId:int, itemData:Object):void {
      if (!items[itemId])
        items[itemId] = itemData;
    }

    // Get item data
    public static function getItems():Object {
      return items;
    }

    // Update qty of drops
    public static function updateCount(itemName:String, qty:int):void {
      if (!drops[itemName])
        drops[itemName] = 0;
      drops[itemName] += qty;
    }

    // Get qty of drops
    public static function getDrops():Object {
      var json:Object = {};
      for (var itemName:String in drops) {
        json[itemName] = drops[itemName];
      }
      return JSON.stringify(json);
    }

    // Parse the item name and count from the drop string
    public static function parseDrop(name:String):Object {
      var ret:Object = new Object();
      var lowerName:String = StringUtil.trim(name.toLowerCase());
      ret.name = lowerName;
      ret.count = 1;

      var res:Array = DROP_REGEX.exec(lowerName);
      if (res != null && res.length > 2) {
        ret.name = String(res[1]).replace(/\s+$/, "");
        var countStr:String = String(res[2]);
        if (countStr != null && countStr != "") {
          var parsedCount:int = parseInt(countStr);
          if (!isNaN(parsedCount) && parsedCount > 0) {
            ret.count = parsedCount;
          }
        }
      }

      return ret;
    }

    public static function acceptDrop(itemId:int):void {
      var itemObj:* = items[itemId];
      if (isUsingCustomDrops()) {
        if (!isCustomDropsUiOpen())
          toggleUi();

        if (itemObj) {
          game.cDropsUI.acceptDrop(itemObj); // Updates the ui, removing the item
          game.sfc.sendXtMessage("zm", "getDrop", [itemId], "str", game.world.curRoom); // Adds the item to the inventory
        }
      }
      else {
        var children:int = game.ui.dropStack.numChildren;
        for (var i:int = 0; i < children; i++) {
          var child:* = game.ui.dropStack.getChildAt(i);
          var mcName:String = getQualifiedClassName(child);
          var dropItemName:String = child.cnt.strName.text; // Defeated Makai x1
          var data:* = parseDrop(dropItemName); // {name: "defeated makai", count: 1}

          if (mcName == DROP_MC && data.name == StringUtil.trim(itemObj.sName.toLowerCase()))
            child.cnt.ybtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
        }
      }
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
      return Boolean(game.cDropsUI) && game.litePreference.data.bCustomDrops;
    }

    // Whether using custom drops ui with draggable mode
    public static function isDraggable():Boolean {
      return isUsingCustomDrops() && Boolean(game.cDropsUI.mcDraggable);
    }

    public static function isCustomDropsUiOpen():Boolean {
      if (game.cDropsUI)
        return game.cDropsUI.isMenuOpen();

      return false;
    }
  }
}