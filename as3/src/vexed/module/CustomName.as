package vexed.module {
  import vexed.game.World;

  public class CustomName extends Module {

    public function CustomName() {
      super("CustomName");
    }

    public static var instance:CustomName = new CustomName();

    public var customName:* = null;

    public var customGuild:* = null;

    override public function onToggle(game:*):void {
      if (!World.isLoaded()) {
        return;
      }

      if (customName !== null) {
        game.world.myAvatar.pMC.pname.ti.text = customName;
        game.ui.mcPortrait.strName.text = customName;
        game.world.myAvatar.objData.strUsername = customName;
        game.world.myAvatar.pMC.pAV.objData.strUsername = customName;
      }

      if (customGuild !== null) {
        if (game.world.myAvatar.objData.guild == null) {
          game.world.myAvatar.objData.guild = new Object();
        }

        game.world.myAvatar.pMC.pname.tg.text = customGuild;
        game.world.myAvatar.objData.guild.Name = customGuild;
        game.world.myAvatar.pMC.pAV.objData.guild.Name = customGuild;
      }
    }

    override public function onFrame(game:*):void {
      onToggle(game);
    }
  }

}