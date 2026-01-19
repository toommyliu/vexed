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
