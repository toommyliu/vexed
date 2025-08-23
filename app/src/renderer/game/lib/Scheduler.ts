import type { Bot } from "./Bot";
import type { Job } from "./jobs/Job";

export class Scheduler {
  private jobs: Map<string, Job> = new Map();

  private _isRunning = false;

  private ac: AbortController | null = null;

  public constructor(public bot: Bot) {}

  /**
   * Whether the scheduler is currently running.
   *
   * @returns True if the scheduler is running, false otherwise.
   */
  public isRunning() {
    return this._isRunning;
  }

  /**
   * Adds a job to the scheduler.
   *
   * @param job - The job to add.
   */
  public addJob(job: Job) {
    this.jobs.set(job.id, job);
  }

  /**
   * Removes a job from the scheduler.
   *
   * @param job - The job to remove.
   */
  public removeJob(job: Job) {
    this.jobs.delete(job.id);
  }

  public hasJob(jobId: string): boolean {
    return this.jobs.has(jobId);
  }

  /**
   * Starts the scheduler, executing jobs in order of priority.
   * Jobs with higher priority (larger number) are executed first.
   */
  public async start() {
    if (this._isRunning) return;

    this._isRunning = true;
    this.ac = new AbortController();

    while (!this.ac.signal.aborted) {
      if (!this.bot.player.isReady()) {
        await this.bot.sleep(100);
        continue;
      }

      const sortedJobs = Array.from(this.jobs.values()).sort(
        (currJob, nextJob) => nextJob.priority - currJob.priority,
      );

      for (const job of sortedJobs) {
        if (this.ac?.signal.aborted) break;

        try {
          console.log(`executing job: ${job.id}`);
          await job.execute();
        } catch (error) {
          console.error(`Error executing job ${job.id}:`, error);
        }

        await this.bot.sleep(250);
      }

      await this.bot.sleep(250);
    }

    this.stop();
  }

  /**
   * Stops the scheduler.
   */
  public stop() {
    this.ac?.abort();
    this._isRunning = false;
  }

  /**
   * Gets the number of jobs in the scheduler.
   *
   * @returns The number of jobs.
   */
  public get size() {
    return this.jobs.size;
  }
}
