import type { Aura } from "../models/BaseEntity";

// some notes on Auras I noticed:
// - a client may see auras visually (Class Actives/Auras UI) but may not get serialized properly (this seems like an unfixable issue for us)
// - a client might not see some auras, especially if they were applied BEFORE the client began attacking the monster
// - a client can even not be in the same room as the monster, for the aura+/- packet to be received

// so, what does AuraStore do?
// - keeps track of auras of monsters in the current map
// - keeps track of auras of players in the current map

export class AuraStore {
  static #monAuras: Map<string, Aura[]> = new Map(); // monMapId -> auras

  static #playerAuras: Map<string, Aura[]> = new Map(); // playerName -> auras

  public static get monsterAuras() {
    return this.#monAuras;
  }

  public static get playerAuras() {
    return this.#playerAuras;
  }

  public static getMonsterAuras(monMapId: string): Aura[] {
    return this.#monAuras.get(monMapId) ?? [];
  }

  public static addMonsterAura(monMapId: string, aura: Aura) {
    if (!this.#monAuras.has(monMapId)) {
      this.#monAuras.set(monMapId, []);
    }

    this.#monAuras.get(monMapId)!.push(aura);
  }

  public static removeMonsterAura(monMapId: string, auraName: string) {
    if (!this.#monAuras.has(monMapId)) return;

    const updatedAuras = this.#monAuras
      .get(monMapId)!
      .filter((a) => a.name !== auraName);

    this.#monAuras.set(monMapId, updatedAuras);
  }

  public static getPlayerAuras(playerName: string): Aura[] {
    return this.#playerAuras.get(playerName) ?? [];
  }

  public static addPlayerAura(playerName: string, aura: Aura) {
    if (!this.#playerAuras.has(playerName)) {
      this.#playerAuras.set(playerName, []);
    }

    this.#playerAuras.get(playerName)!.push(aura);
  }

  public static removePlayerAura(playerName: string, auraName: string) {
    if (!this.#playerAuras.has(playerName)) return;

    const updatedAuras = this.#playerAuras
      .get(playerName)!
      .filter((a) => a.name !== auraName);
    this.#playerAuras.set(playerName, updatedAuras);
  }

  public static clearPlayerAuras(playerName: string) {
    this.#playerAuras.delete(playerName);
  }

  public static clearMonsterAuras(monMapId: string) {
    this.#monAuras.delete(monMapId);
  }

  public static clear() {
    this.#monAuras.clear();
    this.#playerAuras.clear();
  }
}
