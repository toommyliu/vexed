class Packets {
	constructor(bot) {
		/**
		 * @type {import('./Bot')}
		 * @ignore
		 */
		this.bot = bot;
	}

	/**
	 * Sends the specified packet to the client (simulates a response as if the server sent the packet).
	 * @param {string} packet The packet to send.
	 * @param {"str"|"json"|"xml"} [type="str"] The type of packet.
	 * @returns {void}
	 */
	sendClient(packet, type = 'str') {
		this.bot.flash.call(swf.sendClientPacket, packet, type);
	}

	/**
	 * Sends the specified packet to the server.
	 * @param {string} packet The packet to send.
	 * @param {"String"|"Json"} [type="String"] The type of packet.
	 * @returns {void}
	 */
	sendServer(packet, type = 'String') {
		this.bot.flash.call(swf.callGameFunction, `sfc.send${type}`, packet);
	}
}

module.exports = Packets;
