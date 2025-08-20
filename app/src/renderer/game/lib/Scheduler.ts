import type { Bot } from "./Bot";

export class Scheduler {
  private tasks: Map<string, Task> = new Map();

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
   * Adds a task to the scheduler.
   *
   * @param task - The task to add.
   */
  public addTask(task: Task) {
    this.tasks.set(task.id, task);
  }

  /**
   * Removes a task from the scheduler.
   *
   * @param task - The task to remove.
   */
  public removeTask(task: Task) {
    this.tasks.delete(task.id);
  }

  /**
   * Starts the scheduler, executing tasks in order of priority.
   * Tasks with higher priority (larger number) are executed first.
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

      const sortedTasks = Array.from(this.tasks.values()).sort(
        (currTask, nextTask) => nextTask.priority - currTask.priority,
      );

      for (const task of sortedTasks) {
        if (this.ac?.signal.aborted) break;

        try {
          await task.execute();
        } catch (error) {
          console.error(`Error executing task ${task.id}:`, error);
        }

        await this.bot.sleep(50);
      }

      await this.bot.sleep(100);
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
   * Gets the number of tasks in the scheduler.
   *
   * @returns The number of tasks.
   */
  public get size() {
    return this.tasks.size;
  }
}

type Task = {
  execute(): Promise<void>;
  id: string;
  priority: number;
};
