package vexed
{
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.display.MovieClip;
	import flash.display.Stage;
	import flash.events.Event;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.system.ApplicationDomain;
	import flash.system.Security;
	import flash.display.StageQuality;
	import flash.utils.getQualifiedClassName;

	import vexed.Externalizer;
	import vexed.util.SFSEvent;
	import vexed.module.ModuleStore;

	public class Main extends MovieClip
	{
		public static var instance:Main;

		private static var _gameClass:Class;
		private static var _fxStore:* = new Object();
		private static var _fxLastOpt:Boolean = false;
		private static var _handler:*;

		private var game:*;
		private var external:Externalizer;

		private var sURL:String = "https://game.aq.com/game/";
		private var versionUrl:String = (sURL + "api/data/gameversion");
		private var loginURL:String = (sURL + "api/login/now");

		private var sFile:String;
		private var isEU:Boolean;
		private var urlLoader:URLLoader;
		private var loader:Loader;
		private var vars:Object;

		private var stg:Stage;
		private var gameDomain:ApplicationDomain;

		public function Main()
		{
			String.prototype.trim = function():String
			{
				return this.replace(/^\s+|\s+$/g, "");
			};

			Main.instance = this;

			if (stage)
			{
				this.init();
			}
			else
			{
				addEventListener(Event.ADDED_TO_STAGE, this.init);
			}
		}

		private function init(e:Event = null):void
		{
			removeEventListener(Event.ADDED_TO_STAGE, this.init);
			this.onAddedToStage();
		}

		private function onAddedToStage():void
		{
			Security.allowDomain("*");
			this.urlLoader = new URLLoader();
			this.urlLoader.addEventListener(Event.COMPLETE, this.onDataComplete);
			this.urlLoader.load(new URLRequest(this.versionUrl));
		}

		private function onDataComplete(event:Event):void
		{
			this.urlLoader.removeEventListener(Event.COMPLETE, this.onDataComplete);
			this.vars = JSON.parse(event.target.data);
			this.sFile = ((this.vars.sFile + "?ver=") + Math.random());

			// Load the game
			this.loader = new Loader();
			this.loader.contentLoaderInfo.addEventListener(Event.COMPLETE, this.onComplete);
			this.loader.load(new URLRequest(this.sURL + "gamefiles/" + this.sFile));
		}

		private function onComplete(event:Event):void
		{
			this.loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, this.onComplete);

			this.stg = stage;
			// This probably makes no difference
			this.stg.quality = StageQuality.LOW;
			this.stg.removeChildAt(0);
			this.game = this.stg.addChild(this.loader.content);

			// this.stg.scaleMode = StageScaleMode.SHOW_ALL;
			// this.stg.align = StageAlign.TOP;

			for (var param:String in root.loaderInfo.parameters)
			{
				this.game.params[param] = root.loaderInfo.parameters[param];
			}

			this.game.params.vars = this.vars;
			this.game.params.sURL = this.sURL;
			this.game.params.sTitle = this.vars.sTitle;
			this.game.params.sBG = this.vars.sBG;
			this.game.params.isEU = this.isEU;
			this.game.params.loginURL = this.loginURL;

			this.game.sfc.addEventListener(SFSEvent.onConnection, this.onConnection);
			this.game.sfc.addEventListener(SFSEvent.onConnectionLost, this.onConnectionLost);
			this.game.sfc.addEventListener(SFSEvent.onExtensionResponse, this.onExtensionResponse);

			this.gameDomain = LoaderInfo(event.target).applicationDomain;

			ModuleStore.init();

			this.external = new Externalizer();

			this.stg.addEventListener(Event.ENTER_FRAME, ModuleStore.handleFrame);
		}

		private function onConnection():void
		{
			this.external.call("connection", "OnConnection");
		}

		private function onConnectionLost():void
		{
			this.external.call("connection", "OnConnectionLost");
		}

		private function onExtensionResponse(packet:*):void
		{
			if (packet.params.message.indexOf("%xt%zm%") > -1)
			{
				this.external.call("packetFromClient", packet.params.message.replace(/^\s+|\s+$/g, ''));
			}
			else
			{
				this.external.call("packetFromServer", this.processPacket(packet.params.message));
			}
		}

		private function processPacket(packet:String):String
		{
			var index:int = 0;
			if (packet.indexOf("[Sending - STR]: ") > -1)
			{
				packet = packet.replace("[Sending - STR]: ", "");
			}
			if (packet.indexOf("[ RECEIVED ]: ") > -1)
			{
				packet = packet.replace("[ RECEIVED ]: ", "");
			}
			if (packet.indexOf("[Sending]: ") > -1)
			{
				packet = packet.replace("[Sending]: ", "");
			}
			if (packet.indexOf(", (len: ") > -1)
			{
				index = packet.indexOf(", (len: ");
				packet = packet.slice(0, index);
			}
			return packet;
		}

		public function getGame():*
		{
			return this.game;
		}

		public function getExternal():Externalizer
		{
			return this.external;
		}

		private static function getProperties(obj:*):String
		{
			var p:*;
			var res:String = '';
			var val:String;
			var prop:String;
			for (p in obj)
			{
				prop = String(p);
				if (prop && prop !== '' && prop !== ' ')
				{
					val = String(obj[p]);
					res += prop + ': ' + val + ', ';
				}
			}
			res = res.substr(0, res.length - 2);
			return res;
		}

		public static function getGameObject(path:String):String
		{
			var obj:* = _getObjectS(instance.game, path);
			return JSON.stringify(obj);
		}

		public static function getGameObjectS(path:String):String
		{
			if (_gameClass == null)
			{
				_gameClass = instance.gameDomain.getDefinition(getQualifiedClassName(instance.game)) as Class;
			}
			var obj:* = _getObjectS(_gameClass, path);
			return JSON.stringify(obj);
		}

		public static function getGameObjectKey(path:String, key:String):String
		{
			var obj:* = _getObjectS(instance.game, path);
			var obj2:* = obj[key];
			return (JSON.stringify(obj2));
		}

		public static function setGameObject(path:String, value:*):void
		{
			var parts:Array = path.split('.');
			var varName:String = parts.pop();
			var obj:* = _getObjectA(instance.game, parts);
			obj[varName] = value;
		}

		public static function setGameObjectKey(path:String, key:String, value:*):void
		{
			var parts:Array = path.split('.');
			var obj:* = _getObjectA(instance.game, parts);
			obj[key] = value;
		}

		public static function getArrayObject(path:String, index:int):String
		{
			var obj:* = _getObjectS(instance.game, path);
			return JSON.stringify(obj[index]);
		}

		public static function setArrayObject(path:String, index:int, value:*):void
		{
			var obj:* = _getObjectS(instance.game, path);
			obj[index] = value;
		}

		public static function callGameFunction(path:String, ...args):String
		{
			var parts:Array = path.split('.');
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(instance.game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply(null, args));
		}

		public static function callGameFunction0(path:String):String
		{
			var parts:Array = path.split('.');
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(instance.game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply());
		}

		public static function selectArrayObject(path:String, selector:String):String
		{
			var obj:* = _getObjectA(instance.game, instance.game[path]);
			if (!(obj is Array))
			{
				instance.external.debug('selectArrayObject target is not an array');
				return '';
			}
			var array:Array = obj as Array;
			var narray:Array = new Array();
			for (var j:int = 0; j < array.length; j++)
			{
				if (array[j][selector])
					narray.push(array[j]);
			}
			return JSON.stringify(narray);
		}

		public static function selectArrayObjects(path:String, selector:String):String
		{
			var obj:* = _getObjectS(instance.game, path);
			if (!(obj is Array))
			{
				instance.external.debug('selectArrayObjects target is not an array');
				return '';
			}
			var array:Array = obj as Array;
			var narray:Array = new Array();
			for (var j:int = 0; j < array.length; j++)
			{
				narray.push(_getObjectS(array[j], selector));
			}
			return JSON.stringify(narray);
		}

		public static function _getObjectS(root:*, path:String):*
		{
			return _getObjectA(root, path.split('.'));
		}

		public static function _getObjectA(root:*, parts:Array):*
		{
			var obj:* = root;
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
				return (_getObjectS(instance.game, path) == null).toString();
			}
			catch (ex:Error)
			{
			}
			return true.toString();
		}

		public static function catchPackets():void
		{
			instance.game.sfc.addEventListener(SFSEvent.onDebugMessage, packetReceived);
		}

		public static function sendClientPacket(packet:String, type:String):void
		{
			if (_handler == null)
			{
				var cls:Class = Class(instance.gameDomain.getDefinition('it.gotoandplay.smartfoxserver.handlers.ExtHandler'));
				_handler = new cls(instance.game.sfc);
			}

			switch (type)
			{
				case 'xml':
					xmlReceived(packet);
					break;
				case 'json':
					jsonReceived(packet);
					break;
				case 'str':
					strReceived(packet);
					break;
				default:
					instance.external.debug('Invalid packet type.');
			};
		}

		private static function xmlReceived(packet:String):void
		{
			_handler.handleMessage(new XML(packet), 'xml');
		}

		private static function jsonReceived(packet:String):void
		{
			_handler.handleMessage(JSON.parse(packet)['b'], 'json');
		}

		private static function strReceived(packet:String):void
		{
			var array:Array = packet.substr(1, packet.length - 2).split('%');
			_handler.handleMessage(array.splice(1, array.length - 1), 'str');
		}

		public static function packetReceived(packet:*):void
		{
			if (packet.params.message.indexOf('%xt%zm%') > -1)
			{
				instance.external.call('packet', packet.params.message.split(':', 2)[1].trim());
			}
		}
	}
}