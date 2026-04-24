package vexed.game
{
import vexed.Main;
import flash.display.DisplayObject;

[BridgeNamespace("world")]
public class World
  {
    private static var game:Object = Main.getInstance().getGame();

    private static var padNames:RegExp = /(Spawn|Center|Left|Right|Up|Down|Top|Bottom)/;


    [BridgeExport]
    public static function isLoaded():Boolean
    {
      if (!game.world.mapLoadInProgress)
      {
        try
        {
          return game.getChildAt((game.numChildren - 1)) != game.mcConnDetail;
        }
        catch (e:Error)
        {
          return false;
        }
      }

      return false;
    }


    [BridgeExport]
    public static function isActionAvailable(gameAction:String):Boolean
    {
      var _loc_2:* = undefined;
      var _loc_3:* = undefined;
      var _loc_4:* = undefined;
      var _loc_5:* = undefined;
      _loc_2 = game.world.lock[gameAction];
      _loc_3 = new Date();
      _loc_4 = _loc_3.getTime();
      _loc_5 = _loc_4 - _loc_2.ts;
      return _loc_5 < _loc_2.cd ? false : true;
    }

    //[BridgeExport]
    //public static function getCellMonsters():Array
    //  {
      //var monsters:Array = game.world.getMonstersByCell(game.world.strFrame);
      //var ret:Array = [];

      //for (var id:Object in monsters)
      //{
        //var monster:Object = monsters[id];

        //if (!Boolean(monster.pMC) || !Boolean(monster.pMC.visible) || monster.dataLeaf.intState <= 0)
        //{
          //continue;
        //}

        //var mon:Object = new Object();
        //mon.intHP = monster.dataLeaf.intHP;
        //mon.intHPMax = monster.dataLeaf.intHPMax;
        //mon.intState = monster.dataLeaf.intState;
        //mon.iLvl = monster.dataLeaf.iLvl;
        //mon.intMP = monster.dataLeaf.intMP;
        //mon.intMPMax = monster.dataLeaf.intMPMax;
        //mon.monId = monster.dataLeaf.MonID;
        //mon.monMapId = monster.dataLeaf.MonMapID;
        //mon.sRace = monster.objData.sRace;
        //mon.sFrame = monster.dataLeaf.strFrame;
        //mon.strMonName = monster.objData.strMonName;
        //ret.push(mon);
      //}

      //return ret;
    //}

    [BridgeExport]
    public static function isMonsterAvailable(monMapId:Number):Boolean
    {
      var monster:Object = game.world.getMonster(monMapId);
      if (!monster)
      {
        return false;
      } 

      return Boolean(monster.pMC) && monster.pMC.visible && monster.dataLeaf.intState > 0;
    }

    [BridgeExport]
    public static function getMonsterByName(name:String):Object
    {
      if (!name)
      {
        return null;
      }

      name = name.toLowerCase();
      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame))
      {
        if (mon.pMC)
        {
          var monsterName:String = mon.pMC.pname.ti.text.toLowerCase();
          if (((monsterName.indexOf(name) > -1) || (name == "*")) && mon.dataLeaf.intState > 0)
          {
            return mon;
          }
        }
      }

      return null;
    }


    [BridgeExport]
    public static function getMonsterByMonMapId(monMapId:*):Object
    {
      if (!monMapId)
      {
        return null;
      }

      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame))
      {
        if (mon.pMC)
        {
          var monster:int = mon.dataLeaf.MonMapID;
          if (mon != null && mon.dataLeaf != null && mon.dataLeaf.MonMapID == monMapId)
          {
            return mon;
          }
        }
      }

      return null;
    }


    [BridgeExport]
    public static function getCells():Array
    {
      var cells:Array = [];
      for each (var cell:Object in game.world.map.currentScene.labels)
      {
        cells.push(cell.name);
      }
      return cells;
    }


    [BridgeExport]
    public static function getCellPads():Array
    {
      var cellPads:Array = new Array();
      var cellPadsCnt:int = game.world.map.numChildren;
      for (var i:int = 0; i < cellPadsCnt; ++i)
      {
        var child:DisplayObject = game.world.map.getChildAt(i);
        if (padNames.test(child.name))
        {
          cellPads.push(child.name);
        }
      }

      return cellPads;
    }

    [BridgeExport]
    public static function reload():void
    {
      game.world.reloadCurrentMap();
    }


    [BridgeExport]
    public static function loadSwf(swf:String):void
    {
      game.world.loadMap(swf);
    }


    [BridgeExport]
    public static function getMapItem(itemId:int):void
    {
      if (!itemId)
      {
        return;
      }

      game.world.getMapItem(itemId);
    }


    [BridgeExport]
    public static function setSpawnPoint(cell:String = null, pad:String = null):void
    {
      if (!cell)
      {
        cell = game.world.strFrame;
      }

      if (!pad)
      {
        pad = game.world.strPad;
      }

      game.world.setSpawnPoint(cell, pad);
    }
  }
}
