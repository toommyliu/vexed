class Packet {
	/**
	 * Sends the specified packet to the client (simulates a response as if the server sent the packet).
	 * @param {string} packet
	 * @param {string} [type="str"] xml, json, str
	 * @returns {void}
	 */
	static send_client(packet, type = 'str') {
		if (!['xml', 'json', 'str'].includes(type)) throw new Error('packet type must be "xml", "json", or "str"');
		if (typeof packet !== 'string') throw new Error('packet must be a string');

		Flash.call(window.swf.sendClientPacket, packet, type);
	}

	/**
	 * Sends the specified packet to the server.
	 * @param {string} packet
	 * @param {string} [type="String"] String, Json
	 * @returns {void}
	 */
	static send_server(packet, type = 'String') {
		if (!['String', 'Json'].includes(type)) throw new Error('packet type must be "String" or "Json"');
		if (typeof packet !== 'string') throw new Error('packet must be a string');

		Flash.call(window.swf.callGameFunction, `sfc.send${type}`, packet);
	}
}
