/**
 * Custom error for commands with invalid args
 */
export class ArgsError extends Error {
  public constructor(message?: string) {
    super(message);

    // get caller line
    const stackLines = new Error(" ").stack?.split("\n") ?? [];
    const callerLine = stackLines[2]!;

    // extract function name from line
    // eslint-disable-next-line prefer-named-capture-group, unicorn/better-regex
    const functionMatch = /at Object\.([a-zA-Z_$][a-zA-Z0-9_$]*)/.exec(
      callerLine,
    );
    const functionName = functionMatch?.[1] ?? "unknown";

    this.message = `Invalid args;${functionName};${message}`;
    Error.captureStackTrace(this, this.constructor);
  }
}
