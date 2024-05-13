class Quests {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		/**
		 * @type {Bot}
		 */
		this.instance = instance;
	}

	get getQuestTree() {
		return this.instance.flash.call(window.swf.GetQuestTree);
	}

	accept(questId) {
		this.instance.flash.call(window.swf.Accept, String(questId));
	}

	complete(questId) {
		this.instance.flash.call(window.swf.Complete, String(questId));
	}

	load(questIdOrIds) {
		if (questIdOrIds.includes(',')) {
			this.instance.flash.call(window.swf.LoadQuests, questIdOrIds);
		} else {
			this.instance.flash.call(window.swf.LoadQuest, questIdOrIds);
		}
	}

	get(questIds) {
		this.instance.flash.call(window.swf.GetQuests, questIds.join(','));
	}

	isInProgress(questId) {
		this.instance.flash.call(window.swf.IsInProgress, String(questId));
	}

	canComplete(questId) {
		this.instance.flash.call(window.swf.CanComplete, String(questId));
	}

	isAvailable(questId) {
		this.instance.flash.call(window.swf.IsAvailable, String(questId));
	}
}
