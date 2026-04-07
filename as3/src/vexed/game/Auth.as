package vexed.game
{
  import vexed.Main;
  import flash.events.MouseEvent;

  [BridgeNamespace("auth")]
  public class Auth
  {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function isLoggedIn():Boolean
    {
      return game !== null && game.sfc !== null && game.sfc.isConnected;
    }

    [BridgeExport]
    public static function isTemporarilyKicked():Boolean
    {
      var mcLogin:* = game.mcLogin;
      return mcLogin !== null && mcLogin.btnLogin !== null &&
        !mcLogin.btnLogin.visible;
    }

    [BridgeExport]
    public static function login(username:String, password:String):void
    {
      game.removeAllChildren();
      game.gotoAndPlay("Login");
      game.login(username, password);
    }

    [BridgeExport]
    public static function logout():void
    {
      if (game.sfc.isConnected)
      {
        game.sfc.disconnect();
      }
      game.removeAllChildren();
      game.gotoAndPlay("Login");
    }

    [BridgeExport]
    public static function getServers():Array
    {
      if (game.serialCmd != null && game.serialCmd.servers is Array)
      {
        return game.serialCmd.servers;
      }

      return null;
    }

    [BridgeExport]
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
