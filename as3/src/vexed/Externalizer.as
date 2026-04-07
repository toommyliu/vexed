package vexed
{
  import flash.external.ExternalInterface;
  import vexed.generated.BridgeRegistryGenerated;

  public class Externalizer
  {
    public function init(root:Main):void
    {
      BridgeRegistryGenerated.register(this);
      debug("Externalizer::init done.");
    }

    public function externalize(name:String, func:Function):void
    {
      ExternalInterface.addCallback(name, func);
    }

    public function call(name:String, ...rest):*
    {
      var args:Array = [name];
      for each (var item:* in rest)
      {
        args.push(item);
      }
      return ExternalInterface.call.apply(null, args);
    }

    public function debug(message:String):void
    {
      this.call("onDebug", message);
    }
  }
}
