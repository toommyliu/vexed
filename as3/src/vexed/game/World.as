package vexed.game {
  import vexed.Main;
  import flash.display.DisplayObject;
  import vexed.util.Util;

  public class World {
    private static var game:Object = Main.getInstance().getGame();

    public static function isLoaded():Boolean {
      if (!game.world.mapLoadInProgress) {
        try {
          return game.getChildAt((game.numChildren - 1)) != game.mcConnDetail;
        }
        catch (e:Error) {
          return false;
        }
      }

      return false;
    }

    public static function getPlayerNames():Array /* string[] names */
    {
      return game.world.areaUsers;
    }

    public static function getPlayers():String /* { [name: string]: PlayerData } */
    {
      var ret:Object = {};
      for (var player:String in game.world.uoTree) {
        var playerObj:Object = game.world.uoTree[player];
        if (playerObj !== null) {
          var playerObj_:Object = getPlayer(player);
          if (playerObj_ !== null) {
            ret[player] = getPlayer(player);
          }
        }
      }
      return JSON.stringify(ret);
    }

    public static function getPlayer(name:String):String {
      if (!name)
        return null;

      name = name.toLowerCase();

      const playerObj:Object = game.world.uoTree[name];
      if (!playerObj)
        return null;

      const ret:Object = {};

      for (var key:String in playerObj) {
        try {
          if (key === 'auras') {
            var auras:* = playerObj['auras'];
            if (auras is Object) {
              var aurasArr:Array = Util.serializeAuras(auras);
              ret[key] = aurasArr;
            }
          }
          else {
            ret[key] = playerObj[key];
          }
        }
        catch (e:Error) {
        }
      }

      return JSON.stringify(ret);
    }

    public static function isPlayerInCell(name:String, cell:String = null):Boolean {
      if (!name) {
        return false;
      }

      // Use current cell if none is provided
      if (!cell) {
        cell = game.world.strFrame;
      }

      var player:Object = game.world.uoTree[name.toLowerCase()];
      if (!player) {
        return false;
      }

      return player.strFrame.toLowerCase() === cell.toLowerCase();
    }

    public static function isActionAvailable(gameAction:String):Boolean {
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

    public static function getMonsterByName(name:String):Object {
      if (!name)
        return null;

      name = name.toLowerCase();
      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame)) {
        if (mon.pMC) {
          var monsterName:String = mon.pMC.pname.ti.text.toLowerCase();
          if (((monsterName.indexOf(name) > -1) || (name == "*")) && mon.dataLeaf.intState > 0) {
            return mon;
          }
        }
      }

      return null;
    }

    public static function getMonsterByMonMapId(monMapId:*):Object {
      if (!monMapId) {
        return null;
      }

      for each (var mon:Object in game.world.getMonstersByCell(game.world.strFrame)) {
        if (mon.pMC) {
          var monster:int = mon.dataLeaf.MonMapID;
          if (monster == monMapId && mon.dataLeaf.intState > 0) {
            return mon;
          }
        }
      }

      return null;
    }

    public static function getCells():Array {
      var cells:Array = [];
      for each (var cell:Object in game.world.map.currentScene.labels) {
        cells.push(cell.name);
      }
      return cells;
    }

    public static function getCellPads():Array {
      var cellPads:Array = new Array();
      var padNames:RegExp = /(Spawn|Center|Left|Right|Up|Down|Top|Bottom)/;
      var cellPadsCnt:int = game.world.map.numChildren;
      for (var i:int = 0; i < cellPadsCnt; ++i) {
        var child:DisplayObject = game.world.map.getChildAt(i);
        if (padNames.test(child.name)) {
          cellPads.push(child.name);
        }
      }

      return cellPads;
    }

    // public static function getItemTree():Array {
    // var items:Array = [];
    // for (var id:* in game.world.invTree) {
    // items.push(game.world.invTree[id]);
    // }

    // return items;
    // }

    public static function getRoomId():int {
      return game.world.curRoom;
    }

    public static function getRoomNumber():int {
      return Number(game.world.strAreaName.split('-')[1]);
    }

    public static function reload():void {
      game.world.reloadCurrentMap();
    }

    public static function loadSwf(swf:String):void {
      game.world.loadMap(swf);
    }

    public static function getMapItem(itemId:int):void {
      if (!itemId) {
        return;
      }

      game.world.getMapItem(itemId);
    }

    public static function setSpawnPoint(cell:String = null, pad:String = null):void {
      if (!cell) {
        cell = game.world.strFrame;
      }

      if (!pad) {
        pad = game.world.strPad;
      }

      game.world.setSpawnPoint(cell, pad);
    }

    public static function getPlayerAuras(name:String):Array {
      var player:Object = game.world.uoTree[name.toLowerCase()];
      if (!player) {
        return [];
      }

      return Util.serializeAuras(player.auras);
    }
  }
}