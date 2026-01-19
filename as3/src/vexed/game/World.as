package vexed.game
{
  import vexed.Main;
  import flash.display.DisplayObject;

  public class World
  {
    private static var game:Object = Main.getInstance().getGame();

    private static var padNames:RegExp = /(Spawn|Center|Left|Right|Up|Down|Top|Bottom)/;

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

    public static function getCellMonsters():Array {
      var monsters:Array = game.world.getMonstersByCell(game.world.strFrame);
      var ret:Array = [];

      for (var id:Object in monsters) {
        var monster:Object = monsters[id];

        if (!Boolean(monster.pMC) || !Boolean(monster.pMC.visible) || monster.dataLeaf.intState <= 0) {
          continue;
        }

        var mon:Object = new Object();
        mon.sRace = monster.objData.sRace;
        mon.strMonName = monster.objData.strMonName;
        mon.MonID = monster.dataLeaf.MonID;
        mon.MonMapID = monster.dataLeaf.MonMapID;
        mon.iLvl = monster.dataLeaf.iLvl;
        mon.intState = monster.dataLeaf.intState;
        mon.intHP = monster.dataLeaf.intHP;
        mon.intHPMax = monster.dataLeaf.intHPMax;
        ret.push(mon);
      }

      return ret;
    }

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

    public static function getCells():Array
    {
      var cells:Array = [];
      for each (var cell:Object in game.world.map.currentScene.labels)
      {
        cells.push(cell.name);
      }
      return cells;
    }

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
  }
}