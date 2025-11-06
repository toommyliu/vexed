package vexed.game
{
  import vexed.Main;
  import flash.events.MouseEvent;

  public class Auth
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function isLoggedIn():Boolean
    {
      return game !== null && game.sfc !== null && game.sfc.isConnected;
    }

    public static function isTemporarilyKicked():Boolean
    {
      var mcLogin:* = game.mcLogin;
      return mcLogin !== null && mcLogin.btnLogin !== null &&
        !mcLogin.btnLogin.visible;
    }

    public static function login(username:String, password:String):void
    {
      game.removeAllChildren();
      game.gotoAndPlay("Login");
      game.login(username, password);
    }

    public static function logout():void
    {
      if (game.sfc.isConnected)
      {
        game.sfc.disconnect();
      }
      game.removeAllChildren();
      game.gotoAndPlay("Login");
    }

    public static function getServers():Array
    {
      if (game.serialCmd != null && game.serialCmd.servers is Array)
      {
        return game.serialCmd.servers;
      }

      return null;
    }

    public static function connectTo(server:String):Boolean
    {
      if (!server)
      {
        return false;
      }
      server = server.toLowerCase();
      var source:* = Main.getInstance().getGame().mcLogin.sl.iList;
      for (var i:int = 0; i < source.numChildren; i++)
      {
        var child:* = source.getChildAt(i);
        if (child.tName.ti.text.toLowerCase().indexOf(server) > -1)
        {
          child.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
          return true;
        }
      }

      return false;
    }
  }
}