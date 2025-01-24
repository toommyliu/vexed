package vexed.game
{
  import vexed.Main;
  import flash.display.DisplayObject;
  import flash.utils.describeType;

  public class World
  {
    private static var game:Object = Main.getInstance().getGame();

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

    public static function getPlayerNames():Array /* string[] names */
    {
      return game.world.areaUsers;
    }

    public static function getPlayers():Object /* { [name: string]: PlayerData } */
    {
      return game.world.uoTree;
    }

    public static function getPlayer(name:String):Object
    {
      if (!name)
        return null;

      const playerObj:Object = game.world.uoTree[name];

      if (!playerObj || playerObj.strUsername.toLowerCase() !== name.toLowerCase())
        return null;

      const ret:Object = {};

      for (var key:String in playerObj)
      {
        if (key === 'auras')
        {
          // No auras
          if (!playerObj[key])
          {
            ret[key] = [];
            continue;
          }

          // Empty auras
          const data:XML = describeType(playerObj[key]);
          if (playerObj[key] == null || playerObj[key] == '' ||
              (playerObj[key] is Object &&
                (data..accessor.length() < 0 || data..variable.length() < 0)))
          {
            ret[key] = [];
            continue;
          }

          // Auras
          if (playerObj[key] is Object)
          {
            var playerAuras:Object = playerObj[key];
            var auras:Array = [];
            for (var index:String in playerAuras)
            {

              try
              {
                const auraObj:Object = {};
                for (var key_:String in playerAuras[index]) // properties of the aura
                {
                  // This key throws: Failed conversion between PP_Var and V8 value
                  // Probably a circular reference or something
                  if (key_ !== 'cLeaf')
                  {
                    auraObj[key_] = playerAuras[index][key_];
                  }
                }

                auras.push(auraObj);
              }
              catch (e:Error)
              {
              }
            }

            ret[key] = auras;
          }
        }
        else
        {
          // Should be serializable in some way
          ret[key] = playerObj[key];
        }
      }

      return ret;
    }

    public static function isPlayerInCell(name:String, cell:String = null):Boolean
    {
      if (!name)
        return false;

      // Use current cell if none is provided
      if (!cell)
        cell = game.world.strFrame;

      cell = cell.toLowerCase();

      var player:Object = getPlayer(name);
      if (player === null)
        return false;

      return player.strFrame.toLowerCase() === cell;
    }

    public static function isActionAvailable(gameAction:String):Boolean
    {
      var action:Object = game.world.lock[gameAction];
      var currentTime:Date = new Date();
      var currentTimeMs:Number = currentTime.getTime();
      var actionTimeMs:Number = currentTimeMs - action.ts;
      return actionTimeMs < action.cd;
    }

    public static function getCellMonsters():Array
    {
      var monsters:Array = game.world.getMonstersByCell(game.world.strFrame);
      var ret:Array = [];

      for (var id:Object in monsters)
      {
        var monster:Object = monsters[id];

        if (!Boolean(monster.pMC) || !Boolean(monster.pMC.visible) || monster.dataLeaf.intState <= 0)
          continue;

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

    public static function getMonsterByName(key:String):Object
    {
      if (!key || !(key is String))
        return null;

      key = key.toLowerCase();
      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame))
      {
        if (mon.pMC)
        {
          var monster:String = mon.pMC.pname.ti.text.toLowerCase();
          if (((monster.indexOf(key.toLowerCase()) > -1) || (key == "*")) && mon.dataLeaf.intState > 0)
          {
            return mon;
          }
        }
      }

      return null;
    }

    public static function getMonsterByMonMapId(key:int):Object
    {
      if (!key || !(key is int))
        return null;

      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame))
      {
        if (mon.pMC)
        {
          var monster:int = mon.dataLeaf.MonMapID;
          if (monster === key && mon.dataLeaf.intState > 0)
          {
            return mon;
          }
        }
      }

      return null;
    }

    public static function isMonsterAvailable(key:*):Boolean
    {
      if (!key)
        return false;

      if (key is String)
      {
        return getMonsterByName(key) !== null;
      }
      else if (key is int)
      {
        return getMonsterByMonMapId(key) !== null;
      }

      return false;
    }

    public static function getCells():Array
    {
      var cells:Array = [];
      for each (var cell:Object in game.world.map.currentScene.labels)
        cells.push(cell.name);
      return cells;
    }

    public static function getCellPads():Array
    {
      var cellPads:Array = new Array();
      var padNames:RegExp = /(Spawn|Center|Left|Right|Up|Down|Top|Bottom)/;
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

    public static function getItemTree():Array
    {
      var items:Array = [];
      for (var id:* in game.world.invTree)
      {
        items.push(game.world.invTree[id]);
      }

      return items;
    }

    public static function getRoomId():int
    {
      return game.world.curRoom;
    }

    public static function getRoomNumber():int
    {
      return Number(game.world.strAreaName.split('-')[1]);
    }

    public static function reload():void
    {
      game.world.reloadCurrentMap();
    }

    public static function loadSwf(swf:String):void
    {
      game.world.loadMap(swf);
    }

    // TODO:
    // World
    // Jump
    // GoTo
    // GetMapItem
    // Player
    // GetAurasValue
    // public static function loadHairShop(shopId:int):void
    // {
    // game.world.sendLoadHairShopRequest(shopId);
    // }

    // public static function loadArmorCustomize():void
    // {
    // game.openArmorCustomize();
    // }
  }
}