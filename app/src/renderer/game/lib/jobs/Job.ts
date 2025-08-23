export abstract class Job {
  /**
   * Whether this job should be allowed to run while the player is not ready.
   */
  public skipReadyCheck: boolean = false;

  public constructor(
    public id: string,
    public priority: number,
  ) {}

  public abstract execute(): Promise<void>;
  public abstract restart(): void;
}
