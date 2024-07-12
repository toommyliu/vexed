package grimoire.game
{
	import grimoire.*;

	public class Connection
	{
		public static function isKicked():String
		{
			return (Root.Game.mcLogin != null &&
					Root.Game.mcLogin.btnLogin != null &&
					Root.Game.mcLogin.btnLogin.visible == false) ? Root.TrueString : Root.FalseString;
		}

		public static function isLoggedIn():Boolean
		{
			return Root.Game != null && Root.Game.sfc != null && Root.Game.sfc.isConnected == true;
		}

		public static function login(username:String = null, password:String = null):void
		{
			if (!username)
			{
				username = Root.Username;
			}
			else
			{
				Root.Username = username;
			}

			if (!password)
			{
				password = Root.Password;
			}
			else
			{
				Root.Password = password;
			}

			if (Root.Game.charCount() > 0)
			{
				Root.Game.removeAllChildren();
				Root.Game.gotoAndPlay("Login");
			}

			Root.Game.login(Root.Username, Root.Password);
		}

		public static function logout():void
		{
			Root.Game.logout();
		}

		public static function ResetServers():String
		{
			try
			{
				Root.Game.serialCmd.servers = [];
				Root.Game.world.strMapName = "";
				return Root.TrueString;
			}
			catch (e:*)
			{
				return Root.FalseString;
			}
			return Root.FalseString;
		}

		public static function AreServersLoaded():String
		{
			if (Root.Game.serialCmd != null)
			{
				if (Root.Game.serialCmd.servers != null)
				{
					if (Root.Game.serialCmd.servers.length > 0)
					{
						return Root.TrueString;
					}
				}
			}
			return Root.FalseString;
		}

		public static function Connect(name:String):void
		{
			name = name.toLowerCase();
			for each (var server:Object in Root.Game.serialCmd.servers)
			{
				if (server.sName.toLowerCase() == name)
				{
					server.iMax = 5000;
					Root.Game.objServerInfo = server;
					Root.Game.chatF.iChat = server.iChat;
					break;
				}
			}
			Root.Game.connectTo(Root.Game.objServerInfo.sIP, Root.Game.objServerInfo.iPort);
		}
	}
}
