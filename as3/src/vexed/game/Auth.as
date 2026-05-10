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

    private static function connectResult(status:String, message:String, serverName:String = null):Object
    {
      var result:Object = {
        status: status,
        message: message
      };

      if (serverName != null)
      {
        result.serverName = serverName;
      }

      return result;
    }

    private static function getPath(root:*, path:Array):*
    {
      try
      {
        var value:* = root;
        for each (var key:String in path)
        {
          if (value == null)
          {
            return null;
          }
          value = value[key];
        }
        return value;
      }
      catch (e:Error)
      {
        return null;
      }
    }

    private static function getServerListSource(currentGame:*):*
    {
      return getPath(currentGame, ["mcLogin", "sl", "iList"]);
    }

    private static function getLoginInfo(currentGame:*):Object
    {
      var login:Object = getPath(currentGame, ["objLogin"]);
      if (login != null)
      {
        return login;
      }

      try
      {
        var gameClass:Class = Class(Main.getInstance().getGameDomain().getDefinition("Game"));
        return gameClass["objLogin"];
      }
      catch (e:Error)
      {
        return null;
      }
    }

    private static function getServerData(row:*):Object
    {
      return getPath(row, ["obj"]);
    }

    private static function getServerName(row:*):String
    {
      var data:Object = getServerData(row);
      if (data != null && data.sName is String)
      {
        return data.sName;
      }

      var label:* = getPath(row, ["tName", "ti", "text"]);
      return label is String ? label : "";
    }

    private static function rowMatches(row:*, normalizedServer:String, exact:Boolean):Boolean
    {
      var rowName:String = getServerName(row).toLowerCase();
      if (rowName == "")
      {
        return false;
      }

      if (exact)
      {
        return rowName == normalizedServer;
      }

      return rowName.indexOf(normalizedServer) > -1;
    }

    private static function findServerRow(source:*, normalizedServer:String, exact:Boolean):*
    {
      for (var i:int = 0; i < source.numChildren; i++)
      {
        var row:* = source.getChildAt(i);
        if (rowMatches(row, normalizedServer, exact))
        {
          return row;
        }
      }

      return null;
    }

    private static function serverSelectionFailure(selected:Object, login:Object, serverName:String):Object
    {
      if (selected.bOnline == 0)
      {
        return connectResult("offline", "server is offline", serverName);
      }

      if (selected.iCount >= selected.iMax)
      {
        return connectResult("full", "server is full", serverName);
      }

      if (login != null && selected.iChat > 0 && login.bCCOnly == 1)
      {
        return connectResult("chat-restricted", "account is restricted to canned-chat servers", serverName);
      }

      if (login != null && selected.iChat > 0 && login.iAge < 13 && login.iUpgDays < 0)
      {
        return connectResult("underage-chat", "account is not authorized for chat-enabled servers", serverName);
      }

      if (login != null && selected.bUpg == 1 && login.iUpgDays < 0)
      {
        return connectResult("member-only", "account is not authorized for member-only servers", serverName);
      }

      if (selected.iMax % 2 > 0)
      {
        return connectResult("test-client-required", "server requires the testing game client", serverName);
      }

      if (login != null && selected.iLevel > 0 && login.iEmailStatus <= 2)
      {
        return connectResult("email-unconfirmed", "server requires a confirmed email address", serverName);
      }

      return null;
    }

    [BridgeExport]
    [BridgeTsReturnType("FlashTypes.ConnectToSelectionResult")]
    public static function connectTo(server:String):Object
    {
      try
      {
        return connectToUnsafe(server);
      }
      catch (e:Error)
      {
        return connectResult("not-ready", "server selection failed");
      }

      return connectResult("not-ready", "server selection failed");
    }

    private static function connectToUnsafe(server:String):Object
    {
      if (!server)
      {
        return connectResult("not-found", "server is required");
      }

      var currentGame:* = Main.getInstance().getGame();
      var source:* = getServerListSource(currentGame);
      if (source == null)
      {
        return connectResult("not-ready", "server selection is not ready");
      }

      server = server.toLowerCase();
      var child:* = findServerRow(source, server, true);
      if (child == null)
      {
        child = findServerRow(source, server, false);
      }

      if (child == null)
      {
        return connectResult("not-found", "server was not found");
      }

      var selected:Object = getServerData(child);
      if (selected == null)
      {
        return connectResult("not-found", "server was not found");
      }

      var serverName:String = getServerName(child);
      var failure:Object = serverSelectionFailure(selected, getLoginInfo(currentGame), serverName);
      if (failure != null)
      {
        return failure;
      }

      child.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
      return connectResult("selected", "server selected", serverName);
    }
  }
}
