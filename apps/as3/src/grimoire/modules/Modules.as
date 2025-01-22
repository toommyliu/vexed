package grimoire.modules
{
  import flash.events.Event;
  import grimoire.Root;
  import grimoire.Module;

  public class Modules
  {
    private static var _modules:* = new Object();

    public static function getModule(name:String):Module
    {
      return _modules[name];
    }

    public static function registerModule(m:Module):void
    {
      _modules[m.name] = m;
    }

    public static function enable(name:String):void
    {
      var module:Module = getModule(name);
      if (module != null)
      {
        var toggle:Boolean = !module.enabled;
        module.enabled = true;
        if (toggle)
        {
          module.onToggle(Root.Game);
        }
      }
    }

    public static function disable(name:String):void
    {
      var module:Module = getModule(name);
      if (module != null)
      {
        var toggle:Boolean = module.enabled;
        module.enabled = false;
        if (toggle)
        {
          module.onToggle(Root.Game);
        }
      }
    }

    public static function handleFrame(e:Event):void
    {
      for (var name:String in _modules)
      {
        var module:Module = _modules[name];
        if (module.enabled)
        {
          module.onFrame(Root.Game);
        }
      }
    }

    public static function init():void
    {
      registerModule(new HidePlayers());
      registerModule(new DisableCollisions());
      registerModule(new DisableFx());
    }
  }
}