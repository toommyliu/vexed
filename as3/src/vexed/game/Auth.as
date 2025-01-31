package vexed.game
{
  import vexed.Main;
  import flash.display.MovieClip;
  import vexed.ExtractedFuncs;

  public class Auth
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function isLoggedIn():Boolean
    {
      return game !== null && game.sfc !== null && game.sfc.isConnected;
    }

    public static function isTemporarilyKicked():Boolean
    {
      var mcLogin:MovieClip = game.mcLogin;
      return mcLogin !== null && mcLogin.btnLogin !== null &&
        !mcLogin.btnLogin.visible;
    }

    public static function login(username:String, password:String):void
    {
      if (!username || !password)
      {
        return;
      }

      game.removeAllChildren();
      game.gotoAndPlay('Login');
      game.login(username, password);
    }

    public static function logout():void
    {
      game.logout();
    }

    public static function getServers():Array
    {
      if (game.serialCmd !== null)
      {
        if (game.serialCmd.servers !== null)
        {
          return game.serialCmd.servers;
        }
      }

      return null;
    }

    public static function connectTo(server:String):void
    {
      if (!server || !(server is String))
        return;

      server = server.toLowerCase();

      for each (var srv:Object in getServers())
      {
        if (srv.sName.toLowerCase() === server)
        {
          game.objServerInfo = srv;
          game.chatF.iChat = srv.iChat;
          ExtractedFuncs.killModals();
          game.connectTo(srv.sIP, srv.iPort);
          break;
        }
      }
    }
  }
}