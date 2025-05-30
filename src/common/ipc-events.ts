export const IPC_EVENTS = {
  MSGBROKER: "ipc-broker" as const,
  /**
   * The window refreshed, need to sync state
   */
  REFRESHED: "refreshed" as const,

  // #region game
  LOADED: "game:loaded" as const,
  LOAD_SCRIPT: "game:load-script" as const,
  SCRIPT_LOADED: "game:script-loaded" as const,
  TOGGLE_DEV_TOOLS: "root:toggle-dev-tools" as const,
  LOGIN_SUCCESS: "root:login-success" as const,
  ACTIVATE_WINDOW: "root:activate-window" as const,

  /**
   * Read fast travels from file
   */
  READ_FAST_TRAVELS: "root:read-fast-travels" as const,
  /**
   * Fast travel to a location
   */
  FAST_TRAVEL: "fast-travel:fast-travel" as const,

  LOADER_GRABBER_LOAD: "loader-grabber:load" as const,
  LOADER_GRABBER_GRAB: "loader-grabber:grab" as const,

  /**
   * Get the player username
   */
  FOLLOWER_ME: "follower:me" as const,
  /**
   * Start follower
   */
  FOLLOWER_START: "follower:start" as const,
  /**
   * Stop follower
   */
  FOLLOWER_STOP: "follower:stop" as const,

  PACKET_LOGGER_START: "packet-logger:start" as const,
  PACKET_LOGGER_STOP: "packet-logger:stop" as const,
  PACKET_LOGGER_PACKET: "packet-logger:packet" as const,
  PACKET_LOGGER_PACKET_CLIENT: "packet-logger:packet-client" as const,
  PACKET_LOGGER_PACKET_SERVER: "packet-logger:packet-server" as const,
  PACKET_LOGGER_PACKET_PEXT: "packet-logger:packet-pext" as const,

  PACKET_SPAMMER_START: "packet-spammer:start" as const,
  PACKET_SPAMMER_STOP: "packet-spammer:stop" as const,

  ARMY_INIT: "army:init" as const,
  ARMY_JOIN: "army:join" as const,
  ARMY_START_JOB: "army:start_job" as const, // i am ready
  ARMY_FINISH_JOB: "army:finish_job" as const, // i am done
  ARMY_READY: "army:ready" as const, // all are done
  // #endregion
} as const;
