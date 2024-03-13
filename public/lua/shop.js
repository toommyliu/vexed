const inventory = require('./inventory');

class shop {
	static get_items() {
		try {
			return JSON.parse(window.swf.getGameObject('world.shopinfo.items'));
		} catch {
			return undefined;
		}
	}
	
	static get_name() {
		try {
			return JSON.parse(window.swf.getGameObject('world.shopinfo.sName'));
		} catch {
			return undefined;
		}
	}

	static get_id() {
		try {
			return JSON.parse(window.swf.getGameObject('world.shopinfo.ShopID'));
		} catch {
			return undefined;
		}	
	}

	static is_loaded() {
		try {
			const res = JSON.parse(window.swf.isNull('world.shopinfo'));
			return !res;
		} catch {
			return false;
		}
	}

	static load(id) {
		try {
			window.swf.callGameFunction('world.sendLoadShopRequest', id);
		} catch {}
	}

	static buy_by_name(name, quantity = -1) {
		try {
			window.swf.callGameFunction('buyItemByName', name, quantity);
		} catch {}
	}
	
	static buy_by_id(id, shopItemId = 0, quantity = -1) {
		try {
			window.swf.callGameFunction('buyItemByID', id, shopItemId, quantity);
		} catch {}
	}

	static sell_by_name(name) {
		if (inventory.get_item(name)) {
			// TODO
			// Send.Packet($"%xt%zm%sellItem%{Map.RoomID}%{item!.ID}%{item!.Quantity}%{item!.CharItemID}%");
		}
	}

	static sell_by_id(id) {
		if (inventory.get_item(id)) {
			// TODO
			// Send.Packet($"%xt%zm%sellItem%{Map.RoomID}%{item!.ID}%{item.Quantity}%{item.CharItemID}%");
		}
	}

	static load_hair_shop(id) {
		try {
			window.swf.callGameFunction('world.sendLoadHairShopRequest', id);
		} catch {}
	}

	static open_armor_customize() {
		try {
			window.swf.callGameFunction('openArmorCustomize');
		} catch {}
	}
}

module.exports = shop;
