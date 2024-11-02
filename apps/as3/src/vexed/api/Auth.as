package vexed.api
{
    import vexed.Main;

    public class Auth
    {
        private static var game:* = Main.instance.getGame();

        public static function isTemporarilyKicked():Boolean
        {
            return (game.mcLogin != null &&
                    game.mcLogin.btnLogin != null &&
                    game.mcLogin.btnLogin.visible == false);
        }

        public static function login():void
        {
            // TODO:
            if (game.charCount() > 0)
            {
                game.removeAllChildren();
                game.gotoAndPlay("Login");
            }
        }

        public static function logout():void
        {
            game.logout();
        }

        public static function resetServers():Boolean
        {
            try {
                game.serialCmd.servers = [];
                // idk
                game.world.strMapName = "";
                return true;
            } catch (e:Error)
            {
                return false;
            }

            return false;
        }

        public static function connectTo(serverName:String):void
        {
            for each (var server:Object in game.serialCmd.servers)
            {
                if (server.sName.toLowerCase() == serverName.toLowerCase())
                {
                    game.objServerInfo = server;
                    game.chatF.iChat = server.iChat;
                    break;
                }
            }

            game.connectTo(game.objServerInfo.sIP, game.objServerInfo.iPort);
        }
    }
}