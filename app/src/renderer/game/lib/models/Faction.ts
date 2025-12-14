import { number } from "@shared/number";

/**
 * Represents a game faction.
 */
export class Faction {
  public constructor(
    /**
     * Data about this faction.
     */ public data: FactionData,
  ) { }

  /**
   * The ID of the faction.
   */
  public get id(): number {
    return number(this.data.FactionID, -1);
  }

  /**
   * The in-game name of the faction.
   */
  public get name(): string {
    return this.data.sName;
  }

  /**
   * The rank that the player has achieved in this faction.
   */
  public get rank(): number {
    return this.data.iRank;
  }

  /**
   * The total amount of rep the player has for this faction.
   */
  public get totalRep(): number {
    return this.data.iRep;
  }

  /**
   * The amount of rep the player has for their current rank.
   */
  public get rep(): number {
    return this.data.iSpillRep;
  }

  /**
   * The total required rep for the player to rank up.
   */
  public get requiredRep(): number {
    return this.data.iRepToRank;
  }

  /**
   * The remaining amount of rep required for the player to rank up.
   */
  public get remainingRep(): number {
    return this.requiredRep - this.rep;
  }
}

export type FactionData = {
  CharFactionID: string;
  /**
   * The ID of the faction.
   */
  FactionID: string;
  /**
   * The rank that the player has achieved in this faction.
   */
  iRank: number;
  /**
   * The total amount of rep the player has for this faction.
   */
  iRep: number;
  /**
   * The total required rep for the player to rank up.
   */
  iRepToRank: number;
  /**
   * The amount of rep the player has for their current rank.
   */
  iSpillRep: number;
  /**
   * The name of the faction.
   */
  sName: string;
};
