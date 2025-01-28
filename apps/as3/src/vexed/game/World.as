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
      var ret:Object = {};
      for (var player:String in game.world.uoTree)
      {
        var playerObj:Object = game.world.uoTree[player];
        if (playerObj !== null)
        {
          ret[player] = getPlayer(player);
        }
      }
      return ret;
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
                  if (key_ !== 'cLeaf') // aura source
                  {
                    auraObj[key_] = playerAuras[index][key_];
                  }

                  // Main.getInstance().getExternal().debug(ObjectUtil.toString(playerAuras[index][key_]));
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

    public static function getMapItem(itemId:int):void
    {
      if (!itemId)
        return;

      game.world.getMapItem(itemId);
    }

    public static function setSpawnPoint(cell:String = null, pad:String = null):void
    {
      if (!cell)
        cell = game.world.strFrame;

      if (!pad)
        pad = game.world.strPad;

      game.world.setSpawnPoint(cell, pad);
    }

    // TODO:
    // World
    // Player
    // GetAurasValue
  }
}