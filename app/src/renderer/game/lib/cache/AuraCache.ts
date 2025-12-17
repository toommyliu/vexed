import type { Aura } from "../models/BaseEntity";

type StoredAura = Aura & {
    stack?: number;
};

export class AuraCache {
    static #monAuras: Map<string, StoredAura[]> = new Map(); // monMapId -> auras

    static #playerAuras: Map<number, StoredAura[]> = new Map(); // entID -> auras

    static #playerEntIds: Map<string, number> = new Map(); // username (lowercase) -> entID

    public static get monsterAuras() {
        return this.#monAuras;
    }

    public static get playerAuras() {
        return this.#playerAuras;
    }

    /**
     * Registers a player's entID for aura tracking.
     *
     * @param username - The player's username.
     * @param entId - The player's entity ID.
     */
    public static registerPlayer(username: string, entId: number) {
        this.#playerEntIds.set(username.toLowerCase(), entId);
    }

    /**
     * Checks if a player is registered for aura tracking.
     *
     * @param username - The player's username.
     */
    public static hasPlayer(username: string): boolean {
        return this.#playerEntIds.has(username.toLowerCase());
    }

    /**
     * Unregisters a player from aura tracking.
     *
     * @param username - The player's username.
     */
    public static unregisterPlayer(username: string) {
        const entId = this.#playerEntIds.get(username.toLowerCase());
        if (entId !== undefined) {
            this.#playerAuras.delete(entId);
        }

        this.#playerEntIds.delete(username.toLowerCase());
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

    /**
     * Gets a player's auras by username.
     *
     * @param username - The player's username.
     */
    public static getPlayerAuras(username: string): StoredAura[] {
        const entId = this.#playerEntIds.get(username.toLowerCase());
        if (entId === undefined) return [];
        return this.#playerAuras.get(entId) ?? [];
    }

    /**
     * Adds an aura to a player by entID.
     *
     * @param entId - The player's entity ID.
     * @param aura - The aura to add.
     */
    public static addPlayerAura(entId: number, aura: Aura) {
        if (!this.#playerAuras.has(entId)) {
            this.#playerAuras.set(entId, []);
        }

        const auras = this.#playerAuras.get(entId)!;
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

    /**
     * Refreshes an aura on a player by entID.
     *
     * @param entId - The player's entity ID.
     * @param aura - The aura to refresh.
     */
    public static refreshPlayerAura(entId: number, aura: Aura) {
        if (!this.#playerAuras.has(entId)) {
            this.#playerAuras.set(entId, []);
        }

        const auras = this.#playerAuras.get(entId)!;
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

    /**
     * Removes an aura from a player by entID.
     *
     * @param entId - The player's entity ID.
     * @param auraName - The name of the aura to remove.
     */
    public static removePlayerAura(entId: number, auraName: string) {
        if (!this.#playerAuras.has(entId)) return;

        const updatedAuras = this.#playerAuras
            .get(entId)!
            .filter((a) => a.name !== auraName);
        this.#playerAuras.set(entId, updatedAuras);
    }

    /**
     * Clears all auras for a player by entID.
     *
     * @param entId - The player's entity ID.
     */
    public static clearPlayerAuras(entId: number) {
        this.#playerAuras.delete(entId);
    }

    public static clearMonsterAuras(monMapId: string) {
        this.#monAuras.delete(monMapId);
    }

    public static clear() {
        this.#monAuras.clear();
        this.#playerAuras.clear();
        this.#playerEntIds.clear();
    }

    public static hasPlayerAura(username: string, auraName: string): boolean {
        return this.getPlayerAuras(username).some((a) => a.name === auraName);
    }

    public static hasMonsterAura(monMapId: string, auraName: string): boolean {
        return this.getMonsterAuras(monMapId).some((a) => a.name === auraName);
    }

    public static getPlayerAura(
        username: string,
        auraName: string,
    ): StoredAura | undefined {
        return this.getPlayerAuras(username).find((a) => a.name === auraName);
    }

    public static getMonsterAura(
        monMapId: string,
        auraName: string,
    ): StoredAura | undefined {
        return this.getMonsterAuras(monMapId).find((a) => a.name === auraName);
    }

    /**
     * Gets a player's entID by username.
     *
     * @param username - The player's username.
     * @returns The player's entID, or undefined if not registered.
     */
    public static getPlayerEntId(username: string): number | undefined {
        return this.#playerEntIds.get(username.toLowerCase());
    }
}
