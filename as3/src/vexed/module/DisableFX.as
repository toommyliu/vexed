package vexed.module {
	import flash.display.MovieClip;
	import flash.utils.getQualifiedClassName;

	public class DisableFX extends Module {

		public function DisableFX() {
			super("DisableFX");
		}

		override public function onToggle(game:*):void {
			for (var mid:* in game.world.monsters) {
				var monster:* = game.world.monsters[mid];
				if (monster.dataLeaf && monster.dataLeaf.strFrame == game.world.strFrame && monster.pMC && monster.dataLeaf.intState > 0) {
					var mmc:MovieClip = monster.pMC as MovieClip;
					if (enabled) {
						mmc = mmc.getChildAt(1) as MovieClip;
					}
					toggleAnims(mmc, !enabled);
					if (enabled) {
						mmc.gotoAndStop("Idle");
					}
				}
			}

			for (var aid:* in game.world.avatars) {
				var avatar:* = game.world.avatars[aid];
				if (avatar.objData && avatar.pMC) {
					// mcSkel avatar.pMC.mcChar

					// Weapon
					toggleAnims(avatar.pMC.mcChar.weapon.mcWeapon as MovieClip, !enabled);
					toggleAnims(avatar.pMC.mcChar.weaponOff.getChildAt(0) as MovieClip, !enabled);

					// Head
					toggleAnims(avatar.pMC.mcChar.head as MovieClip, !enabled);
					for (var i:int = 0; i < avatar.pMC.mcChar.head.helm.numChildren; i++) // Seems to work
					{
						var child:* = avatar.pMC.mcChar.head.helm.getChildAt(i);
						if (child is MovieClip && child !== null) {
							toggleAnims(child as MovieClip, !enabled);
						}
					}

					// Cape
					toggleAnims(avatar.pMC.mcChar.cape as MovieClip, !enabled);
					for (var j:int = 0; j < avatar.pMC.mcChar.cape.numChildren; j++) // Seems to work
					{
						child = avatar.pMC.mcChar.cape.getChildAt(j);
						if (child is MovieClip && child !== null) {
							toggleAnims(child as MovieClip, !enabled);
						}
					}

					// Pet
					if (Boolean(avatar.petMC)) {
						toggleAnims(avatar.petMC as MovieClip, !enabled);
					}

					// Ground item
					if (avatar.getItemByEquipSlot('mi')) {
						toggleAnims(avatar.pMC.cShadow as MovieClip, !enabled);
					}
				}
			}
		}

		override public function onFrame(game:*):void {
			onToggle(game);
		}

		private function toggleAnims(root:MovieClip, enabled:Boolean):void {
			toggleAnim(root, enabled);
			for (var i:int = 0; i < root.numChildren; i++) {
				var child:* = root.getChildAt(i);
				if (child is MovieClip) {
					var mc:MovieClip = child as MovieClip;
					if (getQualifiedClassName(mc).indexOf("Display") == -1) {
						try {
							toggleAnims(mc, enabled);
						}
						catch (e:Error) {
						}
					}
				}
			}
		}

		private function toggleAnim(mc:MovieClip, enabled:Boolean):void {
			if (enabled) {
				mc.gotoAndPlay(0);
			}
			else {
				mc.gotoAndStop(0);
			}
		}
	}

}