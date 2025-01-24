package vexed.game
{
  import vexed.Main;
  import flash.display.MovieClip;

  public class Auth
  {
    private static var game:Object = Main.getInstance().getGame();

    // Logout

    private static function killModals():void
    {
      var loc2_:MovieClip = null;
      var loc1_:MovieClip = game.mcLogin.ModalStack;
      var loc3_:int = 0;
      while (loc3_ < loc1_.numChildren)
      {
        loc2_ = loc1_.getChildAt(loc3_) as MovieClip;
        if ("fClose" in loc2_)
        {
          loc2_.fClose();
        }
        loc3_++;
      }
    }

    public static function login(username:String, password:String):void
    {
      if (!username || !password)
      {
        return;
      }

    }
  }
}