import { Command } from '../command';

export class CommandSetting extends Command {
	public override id = 'settings:enable';

	public key!: string;

	public val!: boolean;

	public override execute() {
		// TODO: walk speed

		switch (this.key) {
			case 'infiniteRange':
				this.bot.settings.infiniteRange = this.val;
				break;
			case 'provokeMap':
				this.bot.settings.provokeMap = this.val;
				break;
			case 'provokeCell':
				this.bot.settings.provokeCell = this.val;
				break;
			case 'enemyMagnet':
				this.bot.settings.enemyMagnet = this.val;
				break;
			case 'lagKiller':
				this.bot.settings.lagKiller = this.val;
				break;
			case 'hidePlayers':
				this.bot.settings.hidePlayers = this.val;
				break;
			case 'skipCutscenes':
				this.bot.settings.skipCutscenes = this.val;
				break;
			case 'disableFx':
				this.bot.settings.disableFx = this.val;
				break;
			case 'disableCollisions':
				this.bot.settings.disableCollisions = this.val;
				break;
		}
	}

	public override toString() {
		return `${this.val ? 'Enable' : 'Disable'} setting: ${this.key}`;
	}
}
