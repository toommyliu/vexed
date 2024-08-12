/**
 * Represents a player in the game.
 */
class Avatar {
	constructor(data) {
		this.data = data;
	}
}

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

module.exports = Avatar;
