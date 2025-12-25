/**
 * Context passed to commands during execution.
 */
export type CommandContext = {
    /**
     * Returns true if the command execution is still running (signal not aborted).
     */
    isRunning(): boolean;

    /**
     * The abort signal for this command execution.
     */
    readonly signal: AbortSignal;
};

/**
 * Creates a CommandContext from an AbortSignal.
 */
export function createCommandContext(signal: AbortSignal): CommandContext {
    return {
        isRunning: () => !signal.aborted,
        signal,
    };
}
