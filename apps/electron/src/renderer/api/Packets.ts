import type { Bot } from './Bot';

export class Packets {
	public constructor(public bot: Bot) {}

	/**
	 * Sends the specified packet to the client (simulates a response as if the server sent the packet).
	 *
	 * @param packet - The packet to send.
	 * @param type - The type of packet.
	 */
	public sendClient(
		packet: string,
		type: 'json' | 'str' | 'xml' = 'str',
	): void {
		this.bot.flash.call(() => swf.sendClientPacket(packet, type));
	}

	/**
	 * Sends the specified packet to the server.
	 *
	 * @param packet - The packet to send.
	 * @param type - The type of packet.
	 */
	public sendServer(
		packet: string,
		type: 'Json' | 'String' = 'String',
	): void {
		this.bot.flash.call(() =>
			swf.callGameFunction(`sfc.send${type}`, packet),
		);
	}
}
