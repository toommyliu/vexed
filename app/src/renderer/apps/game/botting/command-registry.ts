// In this case, a "command" is a function such that it adds
// a new Command to the context.
export class CommandRegistry {
  /**
   * The commands this registry holds.
   */
  private _commands: Map<string, (...args: unknown[]) => void> = new Map();

  /**
   * Custom commands that shouldn't be registered.
   */
  private _customCommands: Map<string, (...args: unknown[]) => void> =
    new Map();

  public static _instance: CommandRegistry | null = null;

  public get commands(): Map<string, (...args: unknown[]) => void> {
    return this._commands;
  }

  public get customCommands(): Map<string, (...args: unknown[]) => void> {
    return this._customCommands;
  }

  /**
   * Registers a command.
   *
   * @param name - The name of the command.
   * @param command - The command function to register.
   */
  public registerCommand(
    name: string,
    command: (...args: unknown[]) => void,
  ): void {
    this._commands.set(name, command);
  }

  /**
   * Registers a custom command.
   *
   * @param name - The name of the custom command.
   * @param command - The custom command function to register.
   */
  public registerCustomCommand(
    name: string,
    command: (...args: unknown[]) => void,
  ): void {
    this._customCommands.set(name, command);
  }

  /**
   * Unregisters a command.
   *
   * @param name - The name of the command to unregister.
   */
  public unregisterCommand(name: string): void {
    this._commands.delete(name);
  }

  /**
   * Unregisters a custom command.
   *
   * @param name - The name of the custom command to unregister.
   */
  public unregisterCustomCommand(name: string): void {
    this._customCommands.delete(name);
  }

  /**
   * Retrieves a command by name.
   *
   * @param name - The name of the command.
   * @returns The command function, or undefined if not found.
   */
  public getCommand(name: string): ((...args: unknown[]) => void) | undefined {
    return this._commands.get(name);
  }

  /**
   * Retrieves a custom command by name.
   *
   * @param name - The name of the custom command.
   * @returns The custom command function, or undefined if not found.
   */
  public getCustomCommand(
    name: string,
  ): ((...args: unknown[]) => void) | undefined {
    return this._customCommands.get(name);
  }

  public static getInstance(): CommandRegistry {
    this._instance ??= new CommandRegistry();
    return this._instance;
  }
}
