class Packets {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 */
		this.bot = bot;
	}

	/**
	 * Sends the specified packet to the client (simulates a response as if the server sent the packet)
	 * @param {string} packet
	 * @param {"str"|"json"|"xml"} [type="str"]
	 * @returns {void}
	 */
	sendClient(packet, type = 'str') {
		this.bot.flash.call(swf.sendClientPacket, packet, type);
	}

	/**
	 * Sends the specified packet to the server
	 * @param {string} packet
	 * @param {"String"|"Json"} [type="String"]
	 * @returns {void}
	 */
	sendServer(packet, type = 'String') {
		this.bot.flash.call(swf.callGameFunction, `sfc.send${type}`, packet);
	}
}

module.exports = Packets;
