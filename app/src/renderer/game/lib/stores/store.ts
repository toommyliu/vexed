import type { Collection } from "@vexed/collection";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Store<K, V, D = V> {
  /**
   * Add an item from data
   */
  add(data: D): void;

  /**
   * Returns the underlying collection
   */
  all(): Collection<K, V>;

  /**
   * Clear all items from the store
   */
  clear(): void;

  /**
   * Find an item using a custom predicate function
   */
  findBy(predicate: (value: V) => boolean): V | undefined;

  /**
   * Get an item by key
   */
  get(key: K): V | undefined;

  /**
   * Get an item by name (case-insensitive)
   */
  getByName(name: string): V | undefined;

  /**
   * Check if an item exists by key
   */
  has(key: K): boolean;

  /**
   * Remove an item by key
   */
  remove(key: K): void;

  /**
   * Update an existing item's data, or add if not present
   */
  set(key: K, data: D): void;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface PlayersStore<K, V, D = V> extends Store<K, V, D> {
  /**
   * Get a player by entity ID
   */
  getById(id: number): V | undefined;

  /**
   * The current player's Avatar (self)
   */
  readonly me: V | undefined;

  /**
   * Register a player by username and entity ID
   */
  register(username: string, entId: number): void;

  /**
   * Set the current player by username
   */
  setMe(username: string): void;
}
