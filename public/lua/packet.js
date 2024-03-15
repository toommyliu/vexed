class packet {
	static send(packet, type = 'String') {
		try {
			window.swf.callGameFunction(`sfc.send${type}`, packet);
		} catch {}
	}

	static send_client(packet, type = 'str') {
		try {
			window.swf.sendClientPacket(packet, type);
		} catch {}
	}

	static send_msg(msg, sent_by, type) {
		try {
			packet.send_client(`%xt%chatm%0%${type}~${msg}%${sent_by}%`, 'str');
		} catch {}
	}

	static whisper(name, msg) {
		try {
			packet.send(`%xt%zm%whisper%1%${msg}%${name}%`);
		} catch {}
	}

	static send_server(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'server');
	}

	static send_moderator(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'moderator');
	}

	static send_warning(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'warning');
	}

	static send_event(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'event');
	}

	static send_guild(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'guild');
	}

	static send_whisper(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'whisper');
	}

	static send_zone(msg, sent_by = 'arcana') {
		packet.send_msg(msg, sent_by, 'zone');
	}
}

module.exports = packet;
