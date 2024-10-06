package skua.api
{
    import skua.Main;
    import flash.events.MouseEvent;
    import flash.utils.getQualifiedClassName;

    public class Drops
    {
        private static var game:* = Main.instance.getGame();

        private static function parseDrop(name:*):*
        {
            var ret:* = new Object();
            ret.name = name.toLowerCase().trim();
            ret.count = 1;
            var regex:RegExp = /(.*)\s+x\s*(\d*)/g;
            var result:Object = regex.exec(name.toLowerCase().trim());
            if (result == null)
            {
                return ret;
            }
            else
            {
                ret.name = result[1];
                ret.count = int(result[2]);
                return ret;
            }
        }

        public static function isUsingCustomDropsUI():Boolean
        {
            return game.litePreference.data.bCustomDrops;
        }

        public static function isCustomDropsOpen():Boolean
        {
            if (isUsingCustomDropsUI())
            {
                return game.cDropsUI.isMenuOpen();
            }
            else
            {
                return false;
            }
        }

        public static function openCustomDropsUI():void
        {
            if (isUsingCustomDropsUI() && !isCustomDropsOpen())
            {
                game.cDropsUI.onShow();
            }
        }

        public static function getDropStack():String
        {
            var ret:Object = {};
            if (isUsingCustomDropsUI())
            {
                var source:* = game.cDropsUI.mcDraggable ? game.cDropsUI.mcDraggable.menu : game.cDropsUI;
                for (var i:int = 0; i < source.numChildren; i++)
                {
                    var child:* = source.getChildAt(i);
                    if (child.itemObj)
                    {
                        var name:String = child.itemObj.sName.toLowerCase();
                        if (!ret[name])
                        {

                        }
                    }
                }
            }
            else
            {
                var children:int = game.ui.dropStack.numChildren;
                for (i = 0; i < children; i++)
                {
                    child = game.ui.dropStack.getChildAt(i);
                    var type:String = getQualifiedClassName(child);
                    if (type == 'DFrame2MC')
                    {
                        var drop:* = parseDrop(child.cnt.strName.text);
                        name = drop.name;
                        var count:int = drop.count;

                        if (!ret[drop.name])
                        {
                            ret[drop.name] = 0;
                        }

                        ret[drop.name] += drop.count;
                    }
                }
            }

            return JSON.stringify(ret);
        }

        public static function pickupDrops(whitelist:String):void
        {
            var all:Boolean = whitelist == "*";
            var pickup:Array = whitelist.split(",");
            var accepted:* = [];
            if (isUsingCustomDropsUI())
            {
                var source:* = game.cDropsUI.mcDraggable ? game.cDropsUI.mcDraggable.menu : game.cDropsUI;
                for (var i:int = 0; i < source.numChildren; i++)
                {
                    var child:* = source.getChildAt(i);
                    if (child.itemObj)
                    {
                        var itemName:String = child.itemObj.sName.toLowerCase();
                        if ((all || pickup.indexOf(itemName) > -1) && accepted.indexOf(itemName) == -1)
                        {
                            child.btYes.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
                            accepted.push(itemName);
                        }
                    }
                }
            }
            else
            {
                var children:int = game.ui.dropStack.numChildren;
                for (i = 0; i < children; i++)
                {
                    child = game.ui.dropStack.getChildAt(i);
                    var type:String = getQualifiedClassName(child);
                    if (type.indexOf("DFrame2MC") != -1)
                    {
                        var drop:* = parseDrop(child.cnt.strName.text);
                        var name:* = drop.name;
                        if ((all || pickup.indexOf(name) > -1) && accepted.indexOf(name) == -1)
                        {
                            child.cnt.ybtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
                            accepted.push(name);
                        }
                    }
                }
            }
        }

        public static function rejectExcept(whitelist:String):void
        {
            var pickup:Array = whitelist.split(',');
            if (isUsingCustomDropsUI())
            {
                var source:* = game.cDropsUI.mcDraggable ? game.cDropsUI.mcDraggable.menu : game.cDropsUI;
                for (var i:int = 0; i < source.numChildren; i++)
                {
                    var child:* = source.getChildAt(i);
                    if (child.itemObj)
                    {
                        var itemName:String = child.itemObj.sName.toLowerCase();
                        if (pickup.indexOf(itemName) == -1)
                        {
                            child.btNo.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
                        }
                    }
                }
            }
            else
            {
                var children:int = game.ui.dropStack.numChildren;
                for (i = 0; i < children; i++)
                {
                    child = game.ui.dropStack.getChildAt(i);
                    var type:String = getQualifiedClassName(child);
                    if (type.indexOf('DFrame2MC') != -1)
                    {
                        var drop:* = parseDrop(child.cnt.strName.text);
                        var name:* = drop.name;
                        if (pickup.indexOf(name) == -1)
                        {
                            child.cnt.nbtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
                        }
                    }
                }
            }
        }
    }
}