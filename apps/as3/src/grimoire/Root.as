package grimoire
{
	import adobe.utils.ProductManager;
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.display.MovieClip;
	import flash.display.Stage;
	import flash.display.StageScaleMode;
	import flash.display.StageAlign;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.events.KeyboardEvent;
	import flash.events.TimerEvent;
	import flash.events.ProgressEvent;
	import flash.ui.Keyboard;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.system.ApplicationDomain;
	import flash.system.Security;
	import flash.utils.Timer;
	import grimoire.game.*;
	import grimoire.tools.*;

	public class Root extends MovieClip
	{
		private var sTitle:String = "Grimlite Li";
		private const sURL:String = "https://game.aq.com/game/";
		private const versionURL:String = sURL + "api/data/gameversion";
		private const LoginURL:String = sURL + "api/login/now";
		private var urlLoader:URLLoader;
		private var loader:Loader;
		private var loaderVars:Object;
		private var external:Externalizer;
		private var sFile:String;
		private var sBG:String;
		private var isEU:Boolean;
		private var isWeb:Boolean;
		private var doSignup:Boolean;
		private var stg:Object;
		private var vars:URLVariables;
		private var serversLoader:URLLoader = new URLLoader();

		public static var GameDomain:ApplicationDomain;
		public static var Game:*;
		public static const TrueString:String = "\"True\"";
		public static const FalseString:String = "\"False\"";
		public static var Username:String;
		public static var Password:String;
		public var mcLoading:MovieClip;

		public function Root()
		{
			addEventListener(Event.ADDED_TO_STAGE, this.OnAddedToStage);
		}

		private function OnAddedToStage(event:Event):void
		{
			removeEventListener(Event.ADDED_TO_STAGE, this.OnAddedToStage);
			Security.allowDomain("*");
			this.urlLoader = new URLLoader();
			this.urlLoader.addEventListener(Event.COMPLETE, this.OnDataComplete);
			this.urlLoader.load(new URLRequest(this.versionURL));
		}

		private function OnDataComplete(event:Event):void
		{
			this.urlLoader.removeEventListener(Event.COMPLETE, this.OnDataComplete);
			var vars:Object = JSON.parse(event.target.data);
			this.sFile = vars.sFile + "?ver=" + vars.sVersion;
			this.sTitle = vars.sTitle;
			this.isEU = vars.isEU == "true";
			this.isWeb = false;
			this.doSignup = false;
			this.sBG = vars.sBG;
			this.loaderVars = vars;
			this.LoadGame();
		}

		private function LoadGame():void
		{
			this.external = new Externalizer();
			this.external.init(this);
			this.loader = new Loader();
			this.loader.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS, this.OnProgress);
			this.loader.contentLoaderInfo.addEventListener(Event.COMPLETE, this.OnComplete);
			this.loader.load(new URLRequest(this.sURL + "gamefiles/" + this.sFile));
			this.mcLoading.strLoad.text = "Loading 0%";
		}

		private function OnProgress(event:ProgressEvent):void
		{
			this.external.call("progress", Math.round(Number(event.currentTarget.bytesLoaded / event.currentTarget.bytesTotal) * 100));
			var percent:int = event.currentTarget.bytesLoaded / event.currentTarget.bytesTotal * 100;
			this.mcLoading.strLoad.text = "Loading " + percent + "%";
		}

		private function OnComplete(event:Event):void
		{
			this.loader.contentLoaderInfo.removeEventListener(ProgressEvent.PROGRESS, OnProgress);
			this.loader.contentLoaderInfo.removeEventListener(Event.COMPLETE, OnComplete);

			this.stg = stage;
			this.stg.removeChildAt(0);
			Game = this.stg.addChildAt(event.currentTarget.content, 0);
			// Game = this.stg.addChild(this.loader.content);

			for (var param:String in root.loaderInfo.parameters)
			{
				Game.params[param] = root.loaderInfo.parameters[param];
			}
			Game.params.vars = this.loaderVars;
			Game.params.sURL = this.sURL;
			Game.params.sBG = this.sBG;
			Game.params.sTitle = this.sTitle;
			Game.params.loginURL = this.LoginURL;
			Game.params.isEU = this.isEU;
			Game.params.isWeb = this.isWeb;
			Game.params.doSignup = this.doSignup;
			Game.params.test = false;

			Game.sfc.addEventListener(SFSEvent.onExtensionResponse, this.OnExtensionResponse);
			GameDomain = LoaderInfo(event.target).applicationDomain;

			Game.sfc.addEventListener(SFSEvent.onConnectionLost, this.OnConnectionLost);
			Game.sfc.addEventListener(SFSEvent.onConnection, this.OnConnection);
			Game.sfc.addEventListener(SFSEvent.onJoinRoomError, this.OnJoinRoomError);
			Game.sfc.addEventListener(SFSEvent.onDebugMessage, this.PacketReceived);
			Game.loginLoader.addEventListener(Event.COMPLETE, this.OnLoginComplete);
			// getServers();
			addEventListener(Event.ENTER_FRAME, this.EnterFrame);
			trace("OnComplete Stage");
		}

		private function getServers():void
		{
			var urlServers:String = "https://game.aq.com/game/api/data/servers";
			var request:URLRequest = new URLRequest(urlServers);
			request.method = URLRequestMethod.GET;
			serversLoader.addEventListener(Event.COMPLETE, this.OnServersLoaded);
			try
			{
				serversLoader.load(request);
			}
			catch (e:Error)
			{
				trace("Failed to getting servers info.");
			}
		}

		private function OnServersLoaded(event:Event):void
		{
			var vars:Object = JSON.parse(event.target.data);
			this.external.call("getServers2", JSON.stringify(vars));
			serversLoader.removeEventListener(Event.COMPLETE, this.OnServersLoaded);
		}

		private function OnConnectionLost(param1:Event):void
		{
			this.external.call("connection", "OnConnectionLost");
			Game.gotoAndPlay(Game.litePreference.data.bCharSelect ? "Select" : "Login");
		}

		private function OnConnection(param1:Event):void
		{
			this.external.call("connection", "OnConnection");
			RemoveCharSelectUI();
		}

		private function OnJoinRoomError(param1:Event):void
		{
			this.external.debug("OnJoinRoomError");
		}

		private function OnLoginComplete(event:Event):void
		{
			// event.target.data = String(ExternalInterface.call("modifyServers", event.target.data));
			var vars:Object = JSON.parse(event.target.data);
			this.external.call("getServers", JSON.stringify(vars));
			// vars.login.iAccess = 70;
			vars.login.iUpg = 10;
			vars.login.iUpgDays = 999;
			for (var s:* in vars.servers)
			{
				vars.servers[s].sName = vars.servers[s].sName;
			}
			event.target.data = JSON.stringify(vars);
			if (Game.mcCharSelect)
				Game.mcCharSelect.Game.objLogin = vars;
		}

		private function EnterFrame(event:Event):void
		{
			if (Game.mcLogin != null && Game.mcLogin.ni != null && Game.mcLogin.pi != null && Game.mcLogin.btnLogin != null)
			{
				// removeEventListener(Event.ENTER_FRAME, EnterFrame); NO NEED TO REMOVE THE LISTENER
				Game.mcLogin.btnLogin.removeEventListener(MouseEvent.CLICK, this.onLoginClick);
				Game.mcLogin.btnLogin.addEventListener(MouseEvent.CLICK, this.onLoginClick);

				Game.mcLogin.removeEventListener(KeyboardEvent.KEY_DOWN, this.onLoginKeyEnter);
				Game.mcLogin.addEventListener(KeyboardEvent.KEY_DOWN, this.onLoginKeyEnter);
			}

			if (Game.mcCharSelect != null)
			{
				Game.mcCharSelect.btnLogin.removeEventListener(MouseEvent.CLICK, Game.mcCharSelect.onBtnLogin);
				Game.mcCharSelect.btnLogin.addEventListener(MouseEvent.CLICK, this.onBtnLogin);

				Game.mcCharSelect.btnServer.removeEventListener(MouseEvent.CLICK, Game.mcCharSelect.onBtnServer);
				Game.mcCharSelect.btnServer.addEventListener(MouseEvent.CLICK, this.onBtnServer);

				Game.mcCharSelect.passwordui.txtPassword.removeEventListener(KeyboardEvent.KEY_DOWN, Game.mcCharSelect.passwordui.onPasswordEnter);
				Game.mcCharSelect.passwordui.txtPassword.addEventListener(KeyboardEvent.KEY_DOWN, this.onPasswordEnter);
			}
		}

		private function AddedStageConnDetail(event:Event):void
		{
			Game.mcConnDetail.removeEventListener(Event.ADDED_TO_STAGE, AddedStageConnDetail);
			var o:Object = {
					text: Game.mcConnDetail.txtDetail.text,
					btnBack: Game.mcConnDetail.btnBack.visible
				};
			this.external.call("currentConnDetail", JSON.stringify(o));
			trace("Added Conn Detail : " + JSON.stringify(o));
			if (Game.mcConnDetail.btnBack.visible)
				HideConnMC();
		}

		private function onLoginClick(event:MouseEvent):void
		{
			Username = Game.mcLogin.ni.text;
			Password = Game.mcLogin.pi.text;
		}

		private function onLoginKeyEnter(event:KeyboardEvent):void
		{
			if (event.keyCode == Keyboard.ENTER)
			{
				Username = Game.mcLogin.ni.text;
				Password = Game.mcLogin.pi.text;
			}
		}

		public function onBtnServer(event:MouseEvent):void
		{
			Game.mcCharSelect.skipServers = false;
			var loginData:* = Game.mcCharSelect.mngr.displayAvts[Game.mcCharSelect.pos].loginInfo;
			if (loginData.bAsk)
			{
				Game.mcCharSelect.utl.close(1);
				Game.mcCharSelect.passwordui.pos = Game.mcCharSelect.pos;
				Game.mcCharSelect.passwordui.bCharOpts = false;
				Game.mcCharSelect.passwordui.visible = true;
			}
			else
			{
				Login();
				RemoveCharSelectUI();
			}
		}

		private function onBtnLogin(event:MouseEvent):void
		{
			Game.mcCharSelect.skipServers = true;
			Login();
			myTimer.addEventListener(TimerEvent.TIMER, this.WaitServersLoad);
			myTimer.start();
			RemoveCharSelectUI();
		}

		private function onPasswordEnter(event:KeyboardEvent):void
		{
			if (event.keyCode == Keyboard.ENTER)
			{
				var relPass:* = Game.mcCharSelect.mngr.displayAvts[Game.mcCharSelect.pos].loginInfo;
				if (relPass.strPassword != Game.mcCharSelect.passwordui.txtPassword.text)
				{
					Game.mcCharSelect.passwordui.txtWarning.visible = true;
				}
				else if (Game.mcCharSelect.passwordui.bCharOpts)
				{
					Game.mcCharSelect.charoptionsui.setOff();
				}
				else
				{
					Login();
					RemoveCharSelectUI();
				}
			}
		}

		private var myTimer:Timer = new Timer(200);
		private function WaitServersLoad(event:TimerEvent):void
		{
			if (AutoRelogin.AreServersLoaded() == Root.TrueString)
			{
				myTimer.removeEventListener(TimerEvent.TIMER, this.WaitServersLoad);
				myTimer.stop();
				var server:String = Game.mcCharSelect.mngr.displayAvts[Game.mcCharSelect.pos].server;
				AutoRelogin.Connect(server);
			}
		}

		private function RemoveCharSelectUI():void
		{
			if (Game.mcCharSelect != null)
			{
				if (Game.mcCharSelect.parent != null)
				{
					MovieClip(Game.mcCharSelect.parent).removeChild(Game.mcCharSelect);
					this.external.debug("mcCharSelect cleared");
				}
			}
		}

		private function Login():void
		{
			Username = Game.mcCharSelect.mngr.displayAvts[Game.mcCharSelect.pos].loginInfo.strUsername;
			Password = Game.mcCharSelect.mngr.displayAvts[Game.mcCharSelect.pos].loginInfo.strPassword;
			AutoRelogin.Login();
		}

		private function OnExtensionResponse(packet:*):void
		{
			this.external.call("pext", JSON.stringify(packet));
		}

		private function PacketReceived(packet:*):void
		{
			if (packet.params.message.indexOf("%xt%zm%") > -1)
			{
				this.external.call("packetFromClient", packet.params.message.replace(/^\s+|\s+$/g, ''));
			}
			else
			{
				this.external.call("packetFromServer", ProcessPacket(packet.params.message));
			}
		}

		private function ProcessPacket(packet:String):String
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

		public function ServerName():String
		{
			return "\"" + Game.objServerInfo.sName + "\"";
		}

		public function RealAddress():String
		{
			return "\"" + Game.objServerInfo.RealAddress + "\"";
		}

		public function RealPort():String
		{
			return "\"" + Game.objServerInfo.RealPort + "\"";
		}

		public function GetUsername():String
		{
			return "\"" + Username + "\"";
		}

		public function GetPassword():String
		{
			return "\"" + Password + "\"";
		}

		public function SetFPS(fps:String):void
		{
			this.stg.frameRate = parseInt(fps);
		}

		public function SetTitle(title:String):void
		{
			Game.mcLogin.mcLogo.txtTitle.htmlText = "<font color=\"#FFB231\">New Release:</font> " + title;
			Game.params.sTitle.htmlText = "<font color=\"#FFB231\">New Release:</font> " + title;
		}

		public function SendMessage(msg:String):void
		{
			Game.chatF.pushMsg("server", msg, "SERVER", "", 0);
		}

		public function IsConnMCBackButtonVisible():String
		{
			return Game.mcConnDetail.btnBack.visible && Game.mcConnDetail.stage != null ? TrueString : FalseString;
		}

		public function GetConnMC():String
		{
			return Game.mcConnDetail.stage == null ? "" : Game.mcConnDetail.txtDetail.text;
		}

		public function HideConnMC():void
		{
			Game.mcConnDetail.hideConn();
		}
	}
}
