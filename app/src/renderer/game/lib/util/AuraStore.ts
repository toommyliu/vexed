import type { Bot } from "../Bot";
import type { Aura } from "../models/BaseEntity";

// some notes on Auras I noticed:
// - a client may see auras visually (Class Actives/Auras UI) but may not get serialized properly (this seems like an unfixable issue for us)
// - a client might not see some auras, especially if they were applied BEFORE the client began attacking the monster
// - a client can even not be in the same room as the monster, for the aura+/- packet to be received

// so, what does AuraStore do?
// - keeps track of auras of monsters in the current map
// - keeps track of auras of players in the current map

export class AuraStore {
  static #mapName: string;

  static #monAuras: Map<string, Aura[]> = new Map(); // monMapId -> auras

  static #playerAuras: Map<string, Aura[]> = new Map(); // playerName -> auras

  public static get mapName() {
    return this.#mapName;
  }

  public static set mapName(value: string) {
    this.#mapName = value;
  }

  public static getMonsterAuras(monMapid: string): Aura[] {
    return this.#monAuras.get(monMapid) ?? [];
  }

  public static addMonsterAura(monMapid: string, aura: Aura) {
    if (!this.#monAuras.has(monMapid)) {
      this.#monAuras.set(monMapid, []);
    }

    this.#monAuras.get(monMapid)!.push(aura);
  }

  public static removeMonsterAura(monMapid: string, auraName: string) {
    if (!this.#monAuras.has(monMapid)) return;

    const updatedAuras = this.#monAuras
      .get(monMapid)!
      .filter((a) => a.name !== auraName);

    this.#monAuras.set(monMapid, updatedAuras);
  }

  public static clear() {
    this.#monAuras.clear();
    this.#playerAuras.clear();
  }

  public static handlePacket(bot: Bot, dataObj: object) {
    console.log("dataObj", dataObj);
  }
}
