package vexed.module {
  import vexed.game.Settings;
  import vexed.game.World;

  public class CustomName extends Module {

    public function CustomName() {
      super("CustomName");
    }

    public static var instance:CustomName = new CustomName();

    public var customName:String;

    public var customGuild:String;

    override public function onToggle(game:*):void {
      if (!World.isLoaded()) {
        return;
      }

      Settings._setName(customName);
      Settings._setGuild(customGuild);
    }

    override public function onFrame(game:*):void {
      onToggle(game);
    }
  }

}