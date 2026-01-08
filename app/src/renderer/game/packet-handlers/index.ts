// JSON handlers
import "./json/add-gold-exp";
import "./json/clear-auras";
import "./json/ct";
import "./json/drop-item";
import "./json/event";
import "./json/init-user-data";
import "./json/init-user-datas";
import "./json/move-to-area";
import "./json/mtls";

// STR handlers
import "./str/exit-area";
import "./str/respawn-mon";
import "./str/uotls";

export { dispatchJson, dispatchStr } from "./registry";
