/**
 * Represents a player in the game.
 */
class Avatar {
	data: AvatarData;

	constructor(data: AvatarData) {
		/**
		 * Data about this player.
		 * @type {AvatarData}
		 */
		this.data = data;
	}
}

export default Avatar;

/**
 * @typedef {Object} AvatarData
 * @property {boolean} afk
 * @property {boolean} bResting
 * @property {number} entID
 * @property {string} entType
 * @property {number} intHP
 * @property {number} intHPMax
 * @property {number} intLevel
 * @property {number} intMP
 * @property {number} intMPMax
 * @property {number} intSP
 * @property {number} intSPMax
 * @property {number} intState
 * @property {string} mvtd
 * @property {string} mvts
 * @property {string} px
 * @property {string} py
 * @property {boolean} showCloak
 * @property {boolean} showHelm
 * @property {string} strFrame
 * @property {string} strPad
 * @property {string} strUsername
 * @property {number} tx
 * @property {number} ty
 * @property {string} uoName
 */
type AvatarData = {
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
