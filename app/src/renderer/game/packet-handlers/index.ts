import "./json/add-gold-exp";
import "./json/add-items";
import "./json/bank-from-inv";
import "./json/bank-swap-inv";
import "./json/bank-to-inv";
import "./json/buy-item";
import "./json/clear-auras";
import "./json/ct";
import "./json/drop-item";
import "./json/enhance-item-local";
import "./json/enhance-item-shop";
import "./json/equip-item";
import "./json/event";
import "./json/get-drop";
import "./json/init-user-data";
import "./json/init-user-datas";
import "./json/load-inventory-big";
import "./json/move-to-area";
import "./json/remove-item";
import "./json/mtls";
import "./json/sell-item";
import "./json/unequip-item";
import "./json/update-class";
import "./json/uotls";

import "./str/move-to-cell";
import "./str/mv";
import "./str/respawn-mon";
import "./str/uotls";

// needed to fix circular dependency
export {
  dispatchClientStr,
  dispatchJson,
  dispatchStr,
  registerClientStrHandler,
} from "./registry";
