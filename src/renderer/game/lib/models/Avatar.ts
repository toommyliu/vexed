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
}

export type AvatarData = {
	afk: boolean;
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
