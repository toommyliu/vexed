export interface ConfigOptions<S = Record<string, any>> {
  /**
   * Name of the config file (without extension).
   * @default 'config'
   */
  configName?: string;

  /**
   * Directory to store the config file.
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Default values for the config.
   */
  defaults?: Partial<S>;
}

type DeepValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepValue<T[K], Rest>
    : any
  : P extends keyof T
    ? T[P]
    : any;

export default class Config<S = Record<string, any>> {
  /**
   * Path to the config file.
   */
  readonly path: string;

  /**
   * Name of the config file.
   */
  readonly configName: string;

  /**
   * Directory where the config file is stored.
   */
  readonly cwd: string;

  /**
   * Default values for the config.
   */
  readonly defaults: Partial<S>;

  constructor(options?: ConfigOptions<S>);

  /**
   * Load configuration from disk.
   */
  load(): Promise<S>;

  /**
   * Persist the in-memory store to disk.
   */
  save(): Promise<void>;

  /**
   * Get a value from the config.
   * @param key - The key to get the value for. Supports dot notation.
   * @param defaultValue - Default value to return if key doesn't exist.
   * @returns The value or default value. If no key is supplied the full store is returned.
   */
  get(): S;
  get<K extends string>(
    key: K,
    defaultValue?: DeepValue<S, K>,
  ): DeepValue<S, K> | undefined;

  /**
   * Set a value in the config.
   * @param key - The key to set or an object with multiple key-value pairs.
   * @param value - The value to set (ignored when key is an object).
   */
  set(key: Partial<S>): void;
  set<K extends string>(key: K, value: DeepValue<S, K>): void;

  /**
   * Check if a key exists in the config.
   */
  has(key: string): boolean;

  /**
   * Delete a key from the config.
   */
  delete(key: string): void;

  /**
   * Clear the config, keeping only default values.
   */
  clear(): void;

  /**
   * Reset the config by clearing the cache. Returns null.
   */
  reset(): null;
}
