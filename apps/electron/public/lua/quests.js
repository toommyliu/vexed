class quests {
	static get() {
		try {
			return JSON.parse(window.swf.getGameObject('world.questTree'));
		} catch {
			return undefined;
		}
	}

	static get_active() {
		try {
			return Object.values(quests.get())?.filter((quest) => Boolean(quest.status));
		} catch {
			return undefined;
		}
	}

	static accept(id) {
		try {
			window.swf.callGameFunction('world.questAccept', id);
		} catch {}
	}

	static complete(id, item_id, special = false) {
		try {
			window.swf.callGameFunction('world.tryQuestComplete', id, item_id, special);
		} catch {}
	}

	static is_in_progress(id) {
		try {
			return JSON.parse(window.swf.callGameFunction('world.isQuestInProgress', id));
		} catch {
			return false;
		}
	}
}

module.exports = quests;
