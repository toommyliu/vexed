class Packet {
	constructor(bot) {
		/**
		 * @type {Bot}
		 */
		this.bot = bot;
	}

	/**
	 * Sends the specified packet to the client (simulates a response as if the server sent the packet).
	 * @param {string} packet
	 * @param {"str"|"json"|"xml"} [type="str"]
	 * @returns {void}
	 */
	sendClient(packet, type = "str") {
		this.bot.flash.call(window.swf.sendClientPacket, packet, type);
	}

	/**
	 * Sends the specified packet to the server.
	 * @param {string} packet
	 * @param {"String"|"Json"} [type="String"]
	 * @returns {void}
	 */
	sendServer(packet, type = "String") {
		this.bot.flash.call(window.swf.callGameFunction, `sfc.send${type}`, packet);
	}
}
