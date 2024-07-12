package grimoire.game
{
	import grimoire.Root;
	import grimoire.Externalizer;
	import flash.utils.getQualifiedClassName;

	public class Caller extends Object
	{
		private static var _gameClass:Class;
		private static var _handler:*;

		public static function getGameObject(path:String):String
		{
			return JSON.stringify(_getObjectS(Root.Game, path));
		}

		public static function getGameObjectS(path:String):String
		{
			if (_gameClass == null)
			{
				_gameClass = Root.GameDomain.getDefinition(getQualifiedClassName(Root.Game)) as Class;
			}
			var obj:* = _getObjectS(_gameClass, path);
			return JSON.stringify(obj);
		}

		public static function setGameObject(path:String, value:*):void
		{
			var parts:Array = path.split(".");
			var varName:String = parts.pop();
			var obj:* = _getObjectA(Root.Game, parts);
			obj[varName] = value;
		}

		public static function getArrayObject(path:String, index:int):String
		{
			var obj:* = _getObjectS(Root.Game, path);
			return JSON.stringify(obj[index]);
		}

		public static function setArrayObject(path:String, index:int, value:*):void
		{
			var obj:* = _getObjectS(Root.Game, path);
			obj[index] = value;
		}

		public static function callGameFunction(path:String, ...args):String
		{
			var parts:Array = path.split(".");
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(Root.Game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply(null, args));
		}

		public static function callGameFunction0(path:String):String
		{
			var parts:Array = path.split(".");
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(Root.Game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply());
		}

		public static function selectArrayObjects(path:String, selector:String):String
		{
			var obj:* = _getObjectS(Root.Game, path);
			if (!(obj is Array))
			{
				Externalizer.debugS("selectArrayObjects target is not an array");
				return "";
			}
			var array:Array = obj as Array;
			var narray:Array = new Array();
			for (var j:int = 0; j < array.length; j++)
			{
				narray.push(_getObjectS(array[j], selector));
			}
			return JSON.stringify(narray);
		}

		public static function _getObjectS(root:Object, path:String):Object
		{
			return _getObjectA(root, path.split("."));
		}

		public static function _getObjectA(root:Object, parts:Array):Object
		{
			var obj:Object = root;
			for (var i:int = 0; i < parts.length; i++)
			{
				obj = obj[parts[i]];
			}
			return obj;
		}

		public static function isNull(path:String):String
		{
			try
			{
				return (_getObjectS(Root.Game, path) == null).toString();
			}
			catch (ex:Error)
			{
			}
			return "true";
		}

		public static function sendClientPacket(packet:String, type:String):void
		{
			Externalizer.debugS("type: " + type);
			if (_handler == null)
			{
				var cls:Class = Class(Root.GameDomain.getDefinition("it.gotoandplay.smartfoxserver.handlers.ExtHandler"));
				_handler = new cls(Root.Game.sfc);
			}
			if (type == "xml")
			{
				xmlReceived(packet);
			}
			else if (type == "json")
			{
				jsonReceived(packet);
			}
			else if (type == "str")
			{
				strReceived(packet);
			}
			else
			{
				Externalizer.debugS("Invalid packet type.");
			}
		}

		public static function xmlReceived(packet:String):void
		{
			_handler.handleMessage(new XML(packet), "xml");
		}

		public static function jsonReceived(packet:String):void
		{
			_handler.handleMessage(JSON.parse(packet)["b"], "json");
		}

		public static function strReceived(packet:String):void
		{
			var array:Array = packet.substr(1, packet.length - 2).split("%");
			_handler.handleMessage(array.splice(1, array.length - 1), "str");
		}
	}
}