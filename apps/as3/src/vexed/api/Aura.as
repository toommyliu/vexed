package vexed.api
{
    import vexed.Main;

    public class Aura
    {
        private static var game:* = Main.instance.getGame();

        public static function compareAuras(target:String, operator:String, auraName:String, auraValue:int):String
        {
            var aura:Object = null;
            var auras:Object = target == 'Self' ? game.world.myAvatar.dataLeaf.auras : game.world.myAvatar.target.dataLeaf.auras;
            for each (aura in auras)
            {
                if (aura.nam.toLowerCase() == auraName.toLowerCase())
                {
                    if (aura.val == null || aura.val == 'undefined' || aura.val == '')
                    {
                        return false.toString();
                    }

                    switch (operator.toLowerCase())
                    {
                        case 'greater':
                            return (aura.val.toFixed(0) > auraValue.toFixed(0)).toString();
                        case 'less':
                            return (aura.val.toFixed(0) < auraValue.toFixed(0)).toString();
                        case 'equal':
                            return (aura.val.toFixed(0) == auraValue.toFixed(0)).toString();
                    }
                }
            }

            return false.toString();
        }

        public static function getSubjectAuras(subject:String):String
        {
            if (!subject)
            {
                return '[]';
            }

            var auras:Object = null;

            try
            {
                switch (subject.toLowerCase())
                {
                    case 'self':
                        auras = game.world.myAvatar.dataLeaf.auras;
                        break;
                    case 'target':
                        if (game.world.myAvatar.target != null &&
                                game.world.myAvatar.target.dataLeaf != null &&
                                game.world.myAvatar.target.dataLeaf.auras != null)
                        {
                            auras = game.world.myAvatar.target.dataLeaf.auras;
                        }
                        else
                        {
                            return '[]';
                        }
                        break;
                }
            }
            catch (e:Error)
            {
                return '[]';
            }

            var ret:Array = new Array();
            for (var i:int = 0; i < auras.length; i++)
            {
                var aura:Object = auras[i];
                ret.push( {'name': aura.nam, 'value': aura.val ? aura.val : 1});
            }
            return JSON.stringify(ret);
        }
    }
}