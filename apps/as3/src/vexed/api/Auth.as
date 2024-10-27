package vexed.api
{
    import vexed.Main;

    public class Auth
    {
        private static var game:* = Main.instance.getGame();

        public static function connectTo(serverName:String):void
        {
            for each (var server:Object in game.serialCmd.servers)
            {
                Main.instance.getExternal().debug(JSON.stringify(server));
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