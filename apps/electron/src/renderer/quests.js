class Quests {
	static get getQuestTree() {
		return Flash.call(window.swf.QuestTree);
	}

	static accept(questId) {
		Flash.call(window.swf.Accept, String(questId));
	}

	static complete(questId) {
		Flash.call(window.swf.Complete, String(questId));
	}

	static load(questIdOrIds) {
		if (questIdOrIds.includes(',')) {
			Flash.call(window.swf.LoadQuests, questIdOrIds);
		} else {
			Flash.call(window.swf.LoadQuest, questIdOrIds);
		}
	}

	static get(questIds) {
		Flash.call(window.swf.GetQuests, questIds.join(','));
	}

	static isInProgress(questId) {
		Flash.call(window.swf.IsInProgress, String(questId));
	}

	static canComplete(questId) {
		Flash.call(window.swf.CanComplete, String(questId));
	}

	static isAvailable(questId) {
		Flash.call(window.swf.IsAvailable, String(questId));
	}
}
