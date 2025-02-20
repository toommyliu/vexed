import { Command } from '../../command';

export class CommandSetting extends Command {
	public key!: string;

	public state!: boolean;

	public override execute() {
		// TODO: walk speed

		switch (this.key) {
			case 'infiniteRange':
				this.bot.settings.infiniteRange = this.state;
				break;
			case 'provokeMap':
				this.bot.settings.provokeMap = this.state;
				break;
			case 'provokeCell':
				this.bot.settings.provokeCell = this.state;
				break;
			case 'enemyMagnet':
				this.bot.settings.enemyMagnet = this.state;
				break;
			case 'lagKiller':
				this.bot.settings.lagKiller = this.state;
				break;
			case 'hidePlayers':
				this.bot.settings.hidePlayers = this.state;
				break;
			case 'skipCutscenes':
				this.bot.settings.skipCutscenes = this.state;
				break;
			case 'disableFx':
				this.bot.settings.disableFx = this.state;
				break;
			case 'disableCollisions':
				this.bot.settings.disableCollisions = this.state;
				break;
		}
	}

	public override toString() {
		return `${this.state ? 'Enable' : 'Disable'} setting: ${this.key}`;
	}
}
