export abstract class Job {
  public constructor(
    public id: string,
    public priority: number,
  ) {}

  public abstract execute(): Promise<void>;
}
