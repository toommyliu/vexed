package vexed.module {
  import flash.display.MovieClip;
  import flash.utils.getQualifiedClassName;
  import flash.utils.Dictionary;
  import vexed.util.SFSEvent;
  import vexed.Main;
  import flash.events.EventDispatcher;
  import flash.concurrent.Mutex;
  import flash.utils.getTimer;
  import flash.utils.setTimeout;
  import flash.utils.Timer;
  import flash.events.TimerEvent;

  public class Drops extends Module {

    // { itemId: itemData }
    private var itemData:Object;

    // { itemId: count }
    private var drops:Dictionary;

    private static var _instance:Drops;

    private var mutex:Mutex = new Mutex();

    private var demoState:int = 0;

    public function Drops() {
      super("Drops");

      this.itemData = {};
      this.drops = new Dictionary();

      Drops._instance = this;
    }

    public static function saveItemData(itemObj:*):void {
      if (_instance.itemData[itemObj.ItemID]) {
        return;
      }

      _instance.itemData[itemObj.ItemID] = itemObj;
    }

    public static function updateDropQty(itemId:Number, qty:int):void {
      var currentQty:int = _instance.drops[itemId] || 0;
      _instance.drops[itemId] = currentQty + qty;
    }

    // { itemId: count }
    public static function getDrops():Dictionary {
      return _instance.drops;
    }

    // { "itemName": count }
    public static function getDropsHumanized():String {
      var humanReadable:Object = {};

      for (var itemId:* in _instance.drops) {
        var item:* = _instance.itemData[itemId];
        if (item && item.sName) {
          humanReadable[String(item.sName)] = int(_instance.drops[itemId]);
        }
      }

      return JSON.stringify(humanReadable);
    }
  }
}