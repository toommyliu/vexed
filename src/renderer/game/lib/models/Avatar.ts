/**
 * Represents a player in the game.
 */
export class Avatar {
	public constructor(
		/**
		 * Data about this player.
		 */
		public data: AvatarData,
	) {}

	public get cell() {
		return this.data.strFrame;
	}

	public get pad() {
		return this.data.strPad;
	}

	/**
	 * A list of auras active on this player.
	 */
	public get auras() {
		return this.data.auras;
	}

	public getAura(name: string) {
		return this.auras?.find(
			(aura) => aura.name.toLowerCase() === name.toLowerCase(),
		);
	}

	public hasAura(name: string, value?: number) {
		const aura = this.getAura(name);
		if (!aura) return false;
		if (typeof value === 'number') return aura.value === value;
		return true;
	}
}

export type AvatarData = {
	afk: boolean;
	auras: Aura[];
	bResting: boolean;
	entID: number;
	entType: string;
	intHP: number;
	intHPMax: number;
	intLevel: number;
	intMP: number;
	intMPMax: number;
	intSP: number;
	intSPMax: number;
	intState: number;
	mvtd: string;
	mvts: string;
	px: string;
	py: string;
	showCloak: boolean;
	showHelm: boolean;
	strFrame: string;
	strPad: string;
};

export type Aura = {
	name: string;
	value: number;
};
