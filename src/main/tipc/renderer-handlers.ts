export type RendererHandlers = {
  /**
   * Enables the start button for the provided username.
   */
  enableButton(username: string): Promise<void>;
};
