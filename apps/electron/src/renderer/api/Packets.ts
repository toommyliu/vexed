import type Bot from './Bot';

class Packets {
	bot: Bot;

	constructor(bot: Bot) {
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
	sendClient(packet: string, type: 'xml' | 'json' | 'str' = 'str'): void {
		this.bot.flash.call(swf.sendClientPacket, packet, type);
	}

	/**
	 * Sends the specified packet to the server.
	 * @param {string} packet The packet to send.
	 * @param {"String"|"Json"} [type="String"] The type of packet.
	 * @returns {void}
	 */
	sendServer(packet: string, type: 'String' | 'Json' = 'String'): void {
		this.bot.flash.call(swf.callGameFunction, `sfc.send${type}`, packet);
	}
}

export default Packets;
