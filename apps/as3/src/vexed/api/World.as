package vexed.api
{
    import vexed.Main;
    import flash.display.DisplayObject;

    public class World
    {
        private static var game:* = Main.instance.getGame();

        public static function isMapLoadComplete():Boolean
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

        public static function getPlayers():String
        {
            // {"player_name":player_data}
            return JSON.stringify(game.world.uoTree);
        }

        public static function getPlayerByName(name:String):*
        {
            var ret:* = null;
            for each (var player:Object in game.world.uoTree)
            {
                if (player.strUsername.toLowerCase() == name.toLowerCase())
                {
                    ret = player;
                }
            }
            return ret;
        }

        public static function getPlayerNames():Array
        {
            return game.world.areaUsers;
        }

        public static function isPlayerInCell(name:String, cell:String):Boolean
        {
            var plyr:* = getPlayerByName(name);
            if (plyr != null)
            {
                return plyr.strFrame.toLowerCase() == cell.toLowerCase();
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
            return _loc_5 > _loc_2.cd;
        }

        public static function getMonsterInCell(name:String):*
        {
            for each (var monster:* in game.world.getMonstersByCell(game.world.strFrame))
            {
                var monName:String = monster.objData.strMonName.toLowerCase();
                if ((monName.indexOf(name.toLowerCase()) > -1 || name == '*') && monster.pMC != null)
                {
                    return monster;
                }
            }
            return null;
        }

        public static function availableMonstersInCell():String
        {
            var retMonsters:Array = [];
            for each (var monster:* in game.world.getMonstersByCell(game.world.strFrame))
            {
                if (monster.pMC != null)
                {
                    retMonsters.push(monster.objData);
                }
            }
            return JSON.stringify(retMonsters);
        }

        public static function walkTo(xPos:int, yPos:int, walkSpeed:int):void
        {
            walkSpeed = (walkSpeed == 8 ? game.world.WALKSPEED : walkSpeed);
            game.world.myAvatar.pMC.walkTo(xPos, yPos, walkSpeed);
            game.world.moveRequest( {'mc': game.world.myAvatar.pMC, 'tx': xPos, 'ty': yPos, 'sp': walkSpeed});
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

        public static function getRoomID():Number
        {
            return game.world.curRoom;
        }

        public static function getMapName():String
        {
            return game.world.strMapName;
        }

        public static function getRoomNumber():Number
        {
            return game.world.strAreaName.split("-")[1];
        }

        public static function reloadMap():void
        {
            game.world.reloadCurrentMap();
        }

        public static function loadMapSWF(mapName:String):void
        {
            game.world.loadMap(mapName);
        }
    }
}