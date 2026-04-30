export type Aura = {
  duration?: number;
  isNew?: boolean;
  name: string;
  /**
   * Number of active instances tracked for this aura name.
   */
  stack?: number;
  /**
   * The aura's value, if applicable.
   * Can be an integer or float.
   */
  value?: number;
};
