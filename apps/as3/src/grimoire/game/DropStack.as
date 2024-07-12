package grimoire.game
{
	import grimoire.Root;
	import flash.utils.getQualifiedClassName;
	import flash.events.MouseEvent;
	import flash.external.ExternalInterface;

	public class DropStack
	{
		// buggy
		private static function parseDrop(name:*):*
		{
			var ret:* = new Object();
			ret.name = name;
			ret.count = 1;
			var regex:RegExp = /(.*)\s+x\s*(\d*)/g;
			var result:Object = regex.exec(ret.name);
			if (result == null)
			{
				return ret;
			}
			else
			{
				ret.name = result[1];
				ret.count = parseInt(result[2]);
				return ret;
			}
		}

		public static function pickupDrops(whitelist:String):void
		{
			var all:Boolean = whitelist == "*";
			var pickup:Array = whitelist.toLowerCase().split(",");
			var accepted:* = [];
			if (Root.Game.litePreference.data.bCustomDrops)
			{
				var source:* = Root.Game.cDropsUI.mcDraggable ? Root.Game.cDropsUI.mcDraggable.menu : Root.Game.cDropsUI;
				for (var i:int = 0; i < source.numChildren; i++)
				{
					var child:* = source.getChildAt(i);
					if (child.itemObj)
					{
						var itemName:String = child.itemObj.sName.toLowerCase();
						if ((all || pickup.indexOf(itemName) > -1) && accepted.indexOf(itemName) == -1)
						{
							child.btYes.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
							accepted.push(itemName);
						}
					}
				}
			}
			else
			{
				var children:int = Root.Game.ui.dropStack.numChildren;
				for (i = 0; i < children; i++)
				{
					child = Root.Game.ui.dropStack.getChildAt(i);
					var type:String = getQualifiedClassName(child);
					if (type.indexOf("DFrame2MC") != -1)
					{
						var drop:* = parseDrop(child.cnt.strName.text);
						var name:* = drop.name;
						if ((all || pickup.indexOf(name) > -1) && accepted.indexOf(name) == -1)
						{
							child.cnt.ybtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
							accepted.push(name);
						}
					}
				}
			}
		}

		public static function rejectExcept(whitelist:String):void
		{
			var pickup:Array = whitelist.toLowerCase().split(",");
			if (Root.Game.litePreference.data.bCustomDrops)
			{
				var source:* = Root.Game.cDropsUI.mcDraggable ? Root.Game.cDropsUI.mcDraggable.menu : Root.Game.cDropsUI;
				for (var i:int = 0; i < source.numChildren; i++)
				{
					var child:* = source.getChildAt(i);
					if (child.itemObj)
					{
						var itemName:String = child.itemObj.sName.toLowerCase();
						if (pickup.indexOf(itemName) == -1)
						{
							child.btNo.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
							ExternalInterface.call('debug', itemName);
						}
					}
				}
			}
			else
			{
				var children:int = Root.Game.ui.dropStack.numChildren;
				for (i = 0; i < children; i++)
				{
					child = Root.Game.ui.dropStack.getChildAt(i);
					var type:String = getQualifiedClassName(child);
					if (type.indexOf("DFrame2MC") != -1)
					{
						var drop:* = parseDrop(child.cnt.strName.text);
						var name:* = drop.name;
						if (pickup.indexOf(name) == -1)
						{
							child.cnt.nbtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
						}
					}
				}
			}
		}

		public static function getDropStack():String
		{
			var children:int = Root.Game.ui.dropStack.numChildren;
			var drops:* = [];
			var items:* = {};
			if (Root.Game.litePreference.data.bCustomDrops)
			{
				var source:* = Root.Game.cDropsUI.mcDraggable ? Root.Game.cDropsUI.mcDraggable.menu : Root.Game.cDropsUI;
				for (var i:int = 0; i < source.numChildren; i++)
				{
					var child:* = source.getChildAt(i);
					if (child.itemObj)
					{
						var count:int = child.txtDrop.text.split("x ")[1];
						drops.push( {name: child.itemObj.sName, count: count});
					}
				}
			}
			else
			{
				// should be ok :)
				for (i = 0; i < children; i++)
				{
					child = Root.Game.ui.dropStack.getChildAt(i);
					var type:String = getQualifiedClassName(child);
					if (type.indexOf("DFrame2MC") > -1)
					{
						var drop:* = parseDrop(child.cnt.strName.text);
						var prevIndex:int = items[drop.name];
						if (prevIndex)
						{
							drops[prevIndex].count += 1;
						}
						else
						{
							drops.push(drop);
							items[drop.name] = drops.length - 1;
						}
					}
				}
			}
			return JSON.stringify(drops);
		}
	}
}
