class Bank {
	/**
	 * @returns {BankItem[]}
	 */
	static get items() {
		return Flash.call(window.swf.GetBankItems);
	}

	/**
	 * @returns {number|null}
	 */
	static get availableSlots() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.BankSlots);
	}

	/**
	 * @returns {number|null}
	 */
	static get usedSlots() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.UsedBankSlots);
	}

	/**
	 * @returns {number|null}
	 */
	static get totalSlots() {
		if (!Auth.loggedIn) return null;
		return Bank.availableSlots - Bank.usedSlots;
	}

	/**
	 * @param {string} name
	 */
	static deposit(name) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof name !== 'string') throw new Error('name must be a string');

		Flash.call(window.swf.TransferToBank, name);
	}

	/**
	 * @param {string} name
	 */
	static withdraw(name) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof name !== 'string') throw new Error('name must be a string');

		Flash.call(window.swf.TransferToInventory, name);
	}

	/**
	 * @param {string} out_item
	 * @param {string} in_item
	 */
	static swap(out_item, in_item) {
		if (!Auth.loggedIn) throw new Error('not logged in');
		if (typeof out_item !== 'string') throw new Error('out_item must be a string');
		if (typeof in_item !== 'string') throw new Error('in_item must be a string');

		Flash.call(window.swf.BankSwap, in_item, out_item);
	}

	/**
	 * @returns {void}
	 */
	static open() {
		if (!Auth.loggedIn) throw new Error('not logged in');

		Flash.call(window.swf.ShowBank);
	}
}

/**
 * @typedef {Object} BankItem
 * @property {number} CharID
 * @property {number} CharItemID
 * @property {number} EnhDPS
 * @property {number} EnhID
 * @property {number} EnhLvl
 * @property {number} EnhPatternID
 * @property {number} EnhRng
 * @property {number} EnhRty
 * @property {number} ItemID
 * @property {number} bBank
 * @property {number} bCoins
 * @property {number} bEquip
 * @property {number} bStaff
 * @property {number} bTemp
 * @property {number} bUpg
 * @property {string} dPurchase
 * @property {number} iCost
 * @property {number} iDPS
 * @property {number} iHrs
 * @property {number} iLvl
 * @property {number} iQty
 * @property {number} iRng
 * @property {number} iRty
 * @property {number} iStk
 * @property {number} iType
 * @property {string} sDesc
 * @property {string} sES
 * @property {string} sElmt
 * @property {string} sFile
 * @property {string} sIcon
 * @property {string} sLink
 * @property {string} sName
 * @property {string} sType
 */
