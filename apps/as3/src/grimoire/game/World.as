package grimoire.game
{
	import grimoire.Root;
	import flash.external.ExternalInterface;
	import grimoire.Externalizer;

	public class World
	{
		public static function isMapLoaded():String
		{
			if (!Root.Game.world.mapLoadInProgress)
			{
				try
				{
					return Root.Game.getChildAt((Root.Game.numChildren - 1)) != Root.Game.mcConnDetail ? (Root.TrueString) : (Root.FalseString);
				}
				catch (e:Error)
				{
					return Root.FalseString;
				}
			}
			return Root.FalseString;
		}

		public static function getPlayerNames():String
		{
			return JSON.stringify(Root.Game.world.areaUsers);
		}

		public static function isActionAvailable(gameAction:String):String
		{
			var gameActionLock:* = undefined;
			var date:* = undefined;
			var now:* = undefined;
			var diff:* = undefined;
			gameActionLock = Root.Game.world.lock[gameAction];
			date = new Date();
			now = date.getTime();
			diff = now - gameActionLock.ts;
			return diff < gameActionLock.cd ? Root.FalseString : Root.TrueString;
		}

		public static function getCellMonsters():String
		{
			var mons:Array = Root.Game.world.getMonstersByCell(Root.Game.world.strFrame);
			var ret:Array = [];
			for (var id:Object in mons)
			{
				var m:Object = mons[id];
				var mon:Object = new Object();
				mon.sRace = m.objData.sRace;
				mon.strMonName = m.objData.strMonName;
				mon.MonID = m.dataLeaf.MonID;
				mon.MonMapID = m.dataLeaf.MonMapID;
				mon.iLvl = m.dataLeaf.iLvl;
				mon.intState = m.dataLeaf.intState;
				mon.intHP = m.dataLeaf.intHP;
				mon.intHPMax = m.dataLeaf.intHPMax;
				ret.push(mon);
			}
			return JSON.stringify(ret);
		}

		public static function getVisibleCellMonsters():String
		{
			var mons:Array = Root.Game.world.getMonstersByCell(Root.Game.world.strFrame);
			var ret:Array = [];
			for (var id:Object in mons)
			{
				var m:Object = mons[id];
				if (m.pMC == null || !m.pMC.visible || m.dataLeaf.intState <= 0)
				{
					continue;
				}
				var mon:Object = new Object();
				mon.sRace = m.objData.sRace;
				mon.strMonName = m.objData.strMonName;
				mon.MonID = m.dataLeaf.MonID;
				mon.MonMapID = m.dataLeaf.MonMapID;
				mon.iLvl = m.dataLeaf.iLvl;
				mon.intState = m.dataLeaf.intState;
				mon.intHP = m.dataLeaf.intHP;
				mon.intHPMax = m.dataLeaf.intHPMax;
				ret.push(mon);
			}
			return JSON.stringify(ret);
		}

		public static function getMonsters():String
		{
			var monsters:* = Caller.selectArrayObjects('world.monsters', 'objData');
			if (monsters.length > 0)
			{
				ExternalInterface.call('debug', monsters);
				var _monsters:* = JSON.parse(monsters);
				var ret:Array = [];
				for each (var monster:* in monsters);
				{
					var mon:Object = new Object();
					mon.sRace = monster.sRace;
					mon.strMonName = monster.strMonName;
					mon.MonID = monster.MonID;
					mon.MonMapID = monster.MonMapID;
					mon.iLevel = monster.intLevel;
					// mon.MonMapID = monster.dataLeaf.MonMapID;
					// mon.iLvl = monster.dataLeaf.iLvl;
					// mon.intState = monster.dataLeaf.intState;
					// mon.intHP = monster.dataLeaf.intHP;
					// mon.intHPMax = monster.dataLeaf.intHPMax;
					// ret.push(mon);
				}
				return JSON.stringify(ret);
			}
			return null;
		}

		public static function GetMonsterByName(name:String):Object
		{
			for each (var mon:Object in Root.Game.world.getMonstersByCell(Root.Game.world.strFrame))
			{
				if (mon.pMC)
				{
					var monster:String = mon.pMC.pname.ti.text.toLowerCase();
					if (((monster.indexOf(name.toLowerCase()) > -1) || (name == "*")) && mon.dataLeaf.intState > 0)
					{
						return mon;
					}
				}
			}
			return null;
		}

		public static function GetMonsterByMonMapId(monId:String):Object
		{
			for each (var mon:Object in Root.Game.world.getMonstersByCell(Root.Game.world.strFrame))
			{
				if (mon.pMC)
				{
					var monster:String = mon.dataLeaf.MonMapID;
					if (((monster.indexOf(monId) > -1) || (monId == "*")) && mon.dataLeaf.intState > 0)
					{
						return mon;
					}
				}
			}
			return null;
		}

		public static function getMonster(monsterIdentifier:String):Object
		{
			monsterIdentifier = monsterIdentifier.toLowerCase();
			for each (var mon:Object in Root.Game.world.getMonstersByCell(Root.Game.world.strFrame))
			{
				if (mon.pMC)
				{
					//mon.pMC.pname.ti.text.toLowerCase()
					// var monName:String = mon.pMC.pname.ti.text.toLowerCase();
					// var monMapID:String = mon.dataLeaf.MonMapID.toLowerCase();
					// Externalizer.debugS("monName: " + monName);
					// Externalizer.debugS("monMapID: " + monMapID);

					// if (mon.dataLeaf.intState > 0)
					// {
					// 	if (monsterIdentifier == "*")
					// 	{
					// 		return mon;
					// 	}
					// 	else if (monsterIdentifier.indexOf(monName) > -1)
					// 	{
					// 		return mon;
					// 	}
					// }
				}
			}
			return null;
		}

		public static function getMonsterHealth(monster:String):String
		{
			var mon:Object = World.GetMonsterByName(monster);
			if (mon != null)
			{
				return mon.dataLeaf.intHP.toString();
			}
			return null;
		}

		public static function IsMonsterAvailable(name:String):String
		{
			return GetMonsterByName(name) != null ? Root.TrueString : Root.FalseString;
		}

		public static function IsMonsterAvailableByMonMapID(monMapID:String):String
		{
			return GetMonsterByMonMapId(monMapID) != null ? Root.TrueString : Root.FalseString;
		}

		public static function SetSpawnPoint():void
		{
			Root.Game.world.setSpawnPoint(Root.Game.world.strFrame, Root.Game.world.strPad);
		}

		public static function GetSkillName(index:String):String
		{
			var i:int = parseInt(index);
			return "\"" + Root.Game.world.actions.active[i].nam + "\"";
		}

		public static function GetCells():String
		{
			var cells:Array = [];
			for each (var cell:Object in Root.Game.world.map.currentScene.labels)
				cells.push(cell.name);
			return JSON.stringify(cells);
		}

		public static function GetItemTree():String
		{
			var items:Array = [];

			for (var id:* in Root.Game.world.invTree)
			{
				items.push(Root.Game.world.invTree[id]);
			}

			return JSON.stringify(items);
		}

		public static function RoomId():String
		{
			return Root.Game.world.curRoom.toString();
		}

		public static function RoomNumber():String
		{
			return Root.Game.world.strAreaName.split("-")[1];
		}

		public static function Players():String
		{
			return JSON.stringify(Root.Game.world.uoTree);
		}

		public static function PlayerByName(target:String):String
		{
			var result:String = "";
			for (var p:* in Root.Game.world.uoTree)
			{
				var player:* = Root.Game.world.uoTree[p];
				if (player.strUsername.toLowerCase() == target.toLowerCase())
				{
					result = JSON.stringify(player);
				}
			}
			return result;
		}

		public static function GetCellPlayers(param1:String):String
		{
			for (var p:* in Root.Game.world.uoTree)
			{
				var player:* = Root.Game.world.uoTree[p];
				if (player.strUsername.toLowerCase() == param1.toLowerCase())
				{
					if (player.strFrame.toLowerCase() == Root.Game.world.strFrame.toLowerCase())
					{
						return Root.TrueString;
					}
				}
			}
			return Root.FalseString;
		}

		public static function CheckCellPlayer(playerName:String, cellName:String):String
		{
			for (var p:* in Root.Game.world.uoTree)
			{
				var player:* = Root.Game.world.uoTree[p];
				if (player.strUsername.toLowerCase() == playerName.toLowerCase())
				{
					if (player.strFrame.toLowerCase() == cellName.toLowerCase())
					{
						return Root.TrueString;
					}
				}
			}
			return Root.FalseString;
		}

		public static function GetPlayerHealth(target:String):String
		{
			var result:int = 100;
			for (var p:* in Root.Game.world.uoTree)
			{
				var player:* = Root.Game.world.uoTree[p];
				if (player.strUsername.toLowerCase() == target.toLowerCase())
				{
					result = player.intHP;
					break;
				}
			}
			return String(result);
		}

		public static function GetPlayerHealthPercentage(target:String):String
		{
			var result:int = 100;
			for (var p:* in Root.Game.world.uoTree)
			{
				var player:* = Root.Game.world.uoTree[p];
				if (player.strUsername.toLowerCase() == target.toLowerCase())
				{
					var currHP:int = player.intHP;
					var maxHP:int = player.intHPMax;
					result = currHP / maxHP * 100;
					break;
				}
			}
			return String(result);
		}

		public static function ReloadMap():void
		{
			Root.Game.world.reloadCurrentMap();
		}

		public static function LoadMap(swf:String):void
		{
			Root.Game.world.loadMap(swf);
		}

		public static function Join(param1:String, param2:String = "Enter", param3:String = "Spawn"):void
		{
			Root.Game.world.gotoTown(param1, param2, param3);
		}

		public static function GoTo(username:String):void
		{
			Root.Game.world['goto'](username);
		}
		public static function Jump(param1:String, param2:String = "Spawn"):void
		{
			Root.Game.world.moveToCell(param1, param2);
		}
	}
}
