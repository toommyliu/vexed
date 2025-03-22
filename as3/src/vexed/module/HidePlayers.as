package vexed.module {
	public class HidePlayers extends Module {
		public function HidePlayers() {
			super("HidePlayers");
		}

		override public function onToggle(game:*):void {
			for (var id:* in game.world.avatars) {
				var player:* = game.world.avatars[id];
				if (!player.isMyAvatar && player.pMC) {
					player.pMC.mcChar.visible = !enabled;
					player.pMC.pname.visible = !enabled;
					player.pMC.shadow.visible = !enabled;

					if (Boolean(player.petMC)) {
						player.petMC.visible = !enabled;
					}

					// Ground item
					// if (Boolean(player.getItemByEquipSlot('mi')))
					if (true) {
						player.pMC.cShadow.visible = !enabled;
						player.pMC.shadow.alpha = enabled ? 0 : 1;
					}
				}
			}
		}

		override public function onFrame(game:*):void {
			onToggle(game);
		}
	}
}