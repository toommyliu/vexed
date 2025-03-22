package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class Auth {
    private static var game:Object = Main.getInstance().getGame();

    public static function isLoggedIn():Boolean {
      return game !== null && game.sfc !== null && game.sfc.isConnected;
    }

    public static function isTemporarilyKicked():Boolean {
      var mcLogin:* = game.mcLogin;
      return mcLogin !== null && mcLogin.btnLogin !== null &&
        !mcLogin.btnLogin.visible;
    }

    public static function login(username:String, password:String):void {
      game.removeAllChildren();
      game.gotoAndPlay('Login');
      game.login(username, password);
    }

    public static function logout():void {
      game.logout();
    }

    public static function getServers():Array {
      if (game.serialCmd != null && game.serialCmd.servers is Array) {
        return game.serialCmd.servers;
      }

      return null;
    }

    public static function connectTo(server:String):void {
      if (!server) {
        return;
      }

      for each (var srv:Object in getServers()) {
        if (srv.sName.toLowerCase() === server.toLowerCase()) {
          game.objServerInfo = srv;
          game.chatF.iChat = srv.iChat;
          Util.killModals();
          game.connectTo(srv.sIP, srv.iPort);
          break;
        }
      }
    }
  }
}