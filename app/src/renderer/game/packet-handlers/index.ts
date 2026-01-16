import "./json/add-gold-exp";
import "./json/clear-auras";
import "./json/ct";
import "./json/drop-item";
import "./json/equip-item";
import "./json/event";
import "./json/init-user-data";
import "./json/init-user-datas";
import "./json/load-inventory-big";
import "./json/move-to-area";
import "./json/mtls";
import "./json/unequip-item";

import "./str/respawn-mon";
import "./str/uotls";

// needed to fix circular dependency
export { dispatchJson, dispatchStr } from "./registry";
