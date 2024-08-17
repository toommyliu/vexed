package grimoire.game
{
	import grimoire.*;

	public class AutoRelogin 
	{
		public static function IsTemporarilyKicked():String
		{
			return (Root.Game.mcLogin != null && 
					Root.Game.mcLogin.btnLogin != null && 
					Root.Game.mcLogin.btnLogin.visible == false) ? Root.TrueString : Root.FalseString;
		}
		
		public static function Login(): void
		{
			if (Root.Game.charCount() > 0) {
				//Root.Game.removeChild(Root.Game.mcCharSelect);
				Root.Game.removeAllChildren();
				Root.Game.gotoAndPlay("Login");
			}
			Root.Game.login(Root.Username, Root.Password);
		}
		
		public static function FixLogin(username:String, password:String): void
		{
			if (Root.Game.charCount() > 0) {
				//Root.Game.removeChild(Root.Game.mcCharSelect);
				Root.Game.removeAllChildren();
				Root.Game.gotoAndPlay("Login");
			}
			Root.Username = username;
			Root.Password = password;
			Root.Game.login(username, password);
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
					return (Root.Game.serialCmd.servers.length > 0) ? Root.TrueString : Root.FalseString;
				}
			}
			return Root.FalseString;
		}
		
		public static function Connect(name:String):void
		{
			for each (var server:Object in Root.Game.serialCmd.servers)
			{
				if (server.sName == name)
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
