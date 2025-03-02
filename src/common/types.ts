export type Account = {
  password: string;
  username: string;
};

export type AccountWithServer = Account & {
  server: string | null;
};

export type FastTravel = {
  /**
   * The cell to jump to. Defaults to "Enter".
   */
  cell?: string;
  /**
   * The map name to join.
   */
  map: string;
  /**
   * The name of the location.
   */
  name: string;
  /**
   * The pad to jump to. Defaults to "Spawn".
   */
  pad?: string;
};
