package vexed {
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.display.MovieClip;
	import flash.display.Stage;
	import flash.events.Event;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.system.ApplicationDomain;
	import flash.system.Security;
	import flash.utils.getQualifiedClassName;

	import vexed.Externalizer;
	import vexed.module.Modules;
	import vexed.util.SFSEvent;
	import flash.events.ProgressEvent;
	import vexed.module.Drops;

	public class Main extends MovieClip {
		private static var _instance:Main;

		private static var _gameClass:Class;
		private static var _fxStore:* = new Object();
		private static var _fxLastOpt:Boolean = false;
		private static var _handler:*;

		private var game:*;
		private var external:Externalizer;

		private var sURL:String = 'https://game.aq.com/game/';
		private var versionUrl:String = (sURL + 'api/data/gameversion');
		private var loginURL:String = (sURL + 'api/login/now');

		private var urlLoader:URLLoader;
		private var loader:Loader;
		private var vars:Object;

		private var stg:Stage;
		private var gameDomain:ApplicationDomain;

		public function Main() {
			Main._instance = this;

			addEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage);
		}

		private function onAddedToStage(ev:Event = null):void {
			removeEventListener(Event.ADDED_TO_STAGE, this.onAddedToStage);

			Security.allowDomain('*');
			this.urlLoader = new URLLoader();
			this.urlLoader.addEventListener(Event.COMPLETE, this.onDataComplete);
			this.urlLoader.load(new URLRequest(this.versionUrl));
		}

		private function onDataComplete(ev:Event):void {
			this.urlLoader.removeEventListener(Event.COMPLETE, this.onDataComplete);
			this.vars = JSON.parse(ev.target.data);

			this.external = new Externalizer();

			this.loader = new Loader();
			this.loader.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS, this.onProgress);
			this.loader.contentLoaderInfo.addEventListener(Event.COMPLETE, this.onComplete);
			this.loader.load(new URLRequest(this.sURL + 'gamefiles/' + ((this.vars.sFile + '?ver=') + Math.random())));
		}

		private function onProgress(event:ProgressEvent):void {
			var percent:int = event.bytesLoaded / event.bytesTotal * 100;
			this.external.call('progress', Math.round(percent));
		}

		private function onComplete(ev:Event):void {
			this.loader.contentLoaderInfo.removeEventListener(ProgressEvent.PROGRESS, this.onProgress);
			this.loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, this.onComplete);

			this.stg = stage;
			this.stg.removeChildAt(0);
			this.game = this.stg.addChild(this.loader.content);

			for (var param:String in root.loaderInfo.parameters) {
				this.game.params[param] = root.loaderInfo.parameters[param];
			}

			this.game.params.vars = this.vars;
			this.game.params.sURL = this.sURL;
			this.game.params.sTitle = this.vars.sTitle;
			this.game.params.sBG = this.vars.sBG;
			this.game.params.isEU = this.vars.isEU;
			this.game.params.loginURL = this.loginURL;

			this.game.sfc.addEventListener(SFSEvent.onDebugMessage, this.onDebugMessage);
			this.game.sfc.addEventListener(SFSEvent.onConnection, function():void {
					Main.getInstance().external.call('connection', 'OnConnection');
				});
			this.game.sfc.addEventListener(SFSEvent.onConnectionLost, function():void {
					Main.getInstance().external.call('connection', 'OnConnectionLost');
				});
			this.game.sfc.addEventListener(SFSEvent.onExtensionResponse, function(packet:*):void {
					Main.getInstance().external.call('pext', JSON.stringify(packet));
				});
			this.gameDomain = LoaderInfo(ev.target).applicationDomain;

			this.external.init(this);

			Modules.init();
			this.stg.addEventListener(Event.ENTER_FRAME, Modules.handleFrame);

			this.external.call('loaded');
		}

		private function onDebugMessage(packet:*):void {
			if (packet.params.message.indexOf("%xt%zm%") > -1) {
				this.external.call("packetFromClient", packet.params.message.replace(/^\s+|\s+$/g, ''));
			}
			else {
				var pkt:String = processPacket(packet.params.message);
				this.external.call("packetFromServer", pkt);

				if (pkt && pkt.indexOf('dropItem') > -1) {
					var pktObj:Object = JSON.parse(pkt);
					if (pktObj && pktObj.b && pktObj.b.o && pktObj.b.o.items) {
						var itemsObj:Object = pktObj.b.o.items;
						for (var itemId:* in itemsObj) {
							var itemData:Object = itemsObj[itemId];
							Drops.saveItemData(itemData);
							Drops.updateDropQty(itemId, itemData.iQty);
						}
					}
				}
			}
		}

		private function processPacket(packet:String):String {
			var index:int = 0;
			if (packet.indexOf("[Sending - STR]: ") > -1) {
				packet = packet.replace("[Sending - STR]: ", "");
			}
			if (packet.indexOf("[ RECEIVED ]: ") > -1) {
				packet = packet.replace("[ RECEIVED ]: ", "");
			}
			if (packet.indexOf("[Sending]: ") > -1) {
				packet = packet.replace("[Sending]: ", "");
			}
			if (packet.indexOf(", (len: ") > -1) {
				index = packet.indexOf(", (len: ");
				packet = packet.slice(0, index);
			}
			return packet;
		}

		public static function getInstance():Main {
			return _instance;
		}

		public function getGame():* {
			return this.game;
		}

		public function getExternal():Externalizer {
			return this.external;
		}

		public function getGameDomain():ApplicationDomain {
			return this.gameDomain;
		}

		public function getStage():Stage {
			return this.stg;
		}

		public static function getGameObject(path:String):String {
			var obj:* = _getObjectS(_instance.game, path);
			return JSON.stringify(obj);
		}

		public static function getGameObjectS(path:String):String {
			if (_gameClass == null) {
				_gameClass = _instance.gameDomain.getDefinition(getQualifiedClassName(_instance.game)) as Class;
			}
			var obj:* = _getObjectS(_gameClass, path);
			return JSON.stringify(obj);
		}

		public static function getGameObjectKey(path:String, key:String):String {
			var obj:* = _getObjectS(_instance.game, path);
			var obj2:* = obj[key];
			return (JSON.stringify(obj2));
		}

		public static function setGameObject(path:String, value:*):void {
			var parts:Array = path.split('.');
			var varName:String = parts.pop();
			var obj:* = _getObjectA(_instance.game, parts);
			obj[varName] = value;
		}

		public static function setGameObjectKey(path:String, key:String, value:*):void {
			var parts:Array = path.split('.');
			var obj:* = _getObjectA(_instance.game, parts);
			obj[key] = value;
		}

		public static function getArrayObject(path:String, index:int):String {
			var obj:* = _getObjectS(_instance.game, path);
			return JSON.stringify(obj[index]);
		}

		public static function setArrayObject(path:String, index:int, value:*):void {
			var obj:* = _getObjectS(_instance.game, path);
			obj[index] = value;
		}

		public static function callGameFunction(path:String, ...args):String {
			var parts:Array = path.split('.');
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(_instance.game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply(null, args));
		}

		public static function callGameFunction0(path:String):String {
			var parts:Array = path.split('.');
			var funcName:String = parts.pop();
			var obj:* = _getObjectA(_instance.game, parts);
			var func:Function = obj[funcName] as Function;
			return JSON.stringify(func.apply());
		}

		public static function selectArrayObjects(path:String, selector:String):String {
			var obj:* = _getObjectS(_instance.game, path);
			if (!(obj is Array)) {
				_instance.external.debug('selectArrayObjects target is not an array');
				return '';
			}
			var array:Array = obj as Array;
			var narray:Array = new Array();
			for (var j:int = 0; j < array.length; j++) {
				narray.push(_getObjectS(array[j], selector));
			}
			return JSON.stringify(narray);
		}

		private static function _getObjectS(root:*, path:String):* {
			return _getObjectA(root, path.split('.'));
		}

		private static function _getObjectA(root:*, parts:Array):* {
			var obj:* = root;
			for (var i:int = 0; i < parts.length; i++) {
				obj = obj[parts[i]];
			}
			return obj;
		}

		public static function isNull(path:String):Boolean {
			try {
				return _getObjectS(_instance.game, path) == null;
			}
			catch (ex:Error) {
			}
			return true;
		}

		public static function sendClientPacket(packet:String, type:String):void {
			if (_handler == null) {
				var cls:Class = Class(_instance.gameDomain.getDefinition('it.gotoandplay.smartfoxserver.handlers.ExtHandler'));
				_handler = new cls(_instance.game.sfc);
			}
			switch (type) {
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
					_instance.external.debug('Invalid packet type.');
			}
		}

		public static function isConnMcBackButtonVisible():Boolean {
			return _instance.game.mcConnDetail.btnBack.visible && _instance.game.mcConnDetail.stage != null;
		}

		public static function getConnMcText():String {
			return _instance.game.mcConnDetail.stage == null ? "null" : _instance.game.mcConnDetail.txtDetail.text;
		}

		public static function hideConnMc():void {
			_instance.game.mcConnDetail.hideConn();
		}

		private static function xmlReceived(packet:String):void {
			_handler.handleMessage(new XML(packet), 'xml');
		}

		private static function jsonReceived(packet:String):void {
			_handler.handleMessage(JSON.parse(packet)['b'], 'json');
		}

		private static function strReceived(packet:String):void {
			var array:Array = packet.substr(1, packet.length - 2).split('%');
			_handler.handleMessage(array.splice(1, array.length - 1), 'str');
		}
	}
}
