package skua.api
{
    import skua.Main;

    import flash.events.TimerEvent;
    import flash.utils.Timer;
    import flash.display.DisplayObject;

    public class World
    {
        private static var game:* = Main.instance.getGame();

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
    }
}