import type { Aura } from "../models/BaseEntity";

type StoredAura = Aura & {
  stack?: number;
};

export class AuraStore {
  static #monAuras: Map<string, StoredAura[]> = new Map(); // monMapId -> auras

  static #playerAuras: Map<string, StoredAura[]> = new Map(); // playerName -> auras

  public static get monsterAuras() {
    return this.#monAuras;
  }

  public static get playerAuras() {
    return this.#playerAuras;
  }

  public static getMonsterAuras(monMapId: string): StoredAura[] {
    return this.#monAuras.get(monMapId) ?? [];
  }

  public static addMonsterAura(monMapId: string, aura: Aura) {
    if (!this.#monAuras.has(monMapId)) {
      this.#monAuras.set(monMapId, []);
    }

    const auras = this.#monAuras.get(monMapId)!;
    const existingAura = auras.find((a) => a.name === aura.name);

    if (existingAura) {
      // If aura already exists, increment stack and update properties
      existingAura.stack = (existingAura.stack ?? 1) + 1;
      if (aura.duration !== undefined) existingAura.duration = aura.duration;
      if (aura.value !== undefined) existingAura.value = aura.value;
    } else {
      // New aura
      const newAura: StoredAura = { ...aura, stack: 1 };
      auras.push(newAura);
    }
  }

  public static refreshMonsterAura(monMapId: string, aura: Aura) {
    if (!this.#monAuras.has(monMapId)) {
      this.#monAuras.set(monMapId, []);
    }

    const auras = this.#monAuras.get(monMapId)!;
    const existingAura = auras.find((a) => a.name === aura.name);

    if (existingAura) {
      // Refresh existing aura duration and value
      if (aura.duration !== undefined) existingAura.duration = aura.duration;
      if (aura.value !== undefined) existingAura.value = aura.value;
    } else {
      // Add as new aura if it doesn't exist
      const newAura: StoredAura = { ...aura, stack: 1 };
      auras.push(newAura);
    }
  }

  public static removeMonsterAura(monMapId: string, auraName: string) {
    if (!this.#monAuras.has(monMapId)) return;

    const updatedAuras = this.#monAuras
      .get(monMapId)!
      .filter((a) => a.name !== auraName);

    this.#monAuras.set(monMapId, updatedAuras);
  }

  public static getPlayerAuras(playerName: string): StoredAura[] {
    return this.#playerAuras.get(playerName) ?? [];
  }

  public static addPlayerAura(playerName: string, aura: Aura) {
    if (!this.#playerAuras.has(playerName)) {
      this.#playerAuras.set(playerName, []);
    }

    const auras = this.#playerAuras.get(playerName)!;
    const existingAura = auras.find((a) => a.name === aura.name);

    if (existingAura) {
      // If aura already exists, increment stack and update properties
      existingAura.stack = (existingAura.stack ?? 1) + 1;
      if (aura.duration !== undefined) existingAura.duration = aura.duration;
      if (aura.value !== undefined) existingAura.value = aura.value;
    } else {
      // New aura
      const newAura: StoredAura = { ...aura, stack: 1 };
      auras.push(newAura);
    }
  }

  public static refreshPlayerAura(playerName: string, aura: Aura) {
    if (!this.#playerAuras.has(playerName)) {
      this.#playerAuras.set(playerName, []);
    }

    const auras = this.#playerAuras.get(playerName)!;
    const existingAura = auras.find((a) => a.name === aura.name);

    if (existingAura) {
      // Refresh existing aura duration and value
      if (aura.duration !== undefined) existingAura.duration = aura.duration;
      if (aura.value !== undefined) existingAura.value = aura.value;
    } else {
      // Add as new aura if it doesn't exist
      const newAura: StoredAura = { ...aura, stack: 1 };
      auras.push(newAura);
    }
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

  public static hasPlayerAura(playerName: string, auraName: string): boolean {
    return this.getPlayerAuras(playerName).some((a) => a.name === auraName);
  }

  public static hasMonsterAura(monMapId: string, auraName: string): boolean {
    return this.getMonsterAuras(monMapId).some((a) => a.name === auraName);
  }

  public static getPlayerAura(
    playerName: string,
    auraName: string,
  ): StoredAura | undefined {
    return this.getPlayerAuras(playerName).find((a) => a.name === auraName);
  }

  public static getMonsterAura(
    monMapId: string,
    auraName: string,
  ): StoredAura | undefined {
    return this.getMonsterAuras(monMapId).find((a) => a.name === auraName);
  }
}
