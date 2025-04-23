// https://github.com/BrenoHenrike/Scripts/blob/Skua/Army/CoreArmyLite.cs#L2316

import { join } from "path";
import { stat } from "fs-extra";
import { FileManager } from "../../../../common/FileManager";

export class ArmyLogging {
  /**
   * The path to the log file.
   */
  private logFilePath: string = "";

  /**
   * The message to be logged.
   */
  public message: string = "";

  /**
   * Sets the log file name.
   *
   * @param fileName - The name of the log file.
   */
  public setLogName(fileName: string) {
    const cleanFileName = fileName.endsWith(".txt")
      ? fileName.slice(0, -4)
      : fileName;
    this.logFilePath = join(FileManager.storagePath, `${cleanFileName}.txt`);
  }

  /**
   * Registers a message to be logged.
   *
   * @param msg - The message to register.
   */
  public registerMessage(msg: string) {
    this.message = msg;
  }

  /**
   * Checks if the log file is empty.
   *
   * @returns True if the log file is empty, false otherwise.
   */
  public async isEmpty() {
    try {
      const stats = await stat(this.logFilePath);
      return stats.size === 0;
    } catch {
      return true;
    }
  }

  /**
   * Checks if the specified players are already in the log.
   *
   * @remarks
   * This method reads the log file and checks if the specified players have already logged the message.
   * @param playersList - The list of players to check.
   * @returns True if all players are already in the log, false otherwise.
   */
  public async isAlreadyInLog(playersList: Set<string> | string[]) {
    try {
      const lines =
        (await FileManager.readFile(this.logFilePath))?.split("\n") ?? [];
      const linesSet = new Set(lines);
      for (const player of playersList) {
        if (!linesSet.has(`${player.toLowerCase()}:done:${this.message}`)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Writes a log message to the log file.
   *
   * @param logMessage - The message to log.
   */
  public async writeLog(logMessage: string) {
    try {
      await FileManager.writeFile(this.logFilePath, `${logMessage}\n`);
    } catch {}
  }

  /**
   * Reads the log file and returns its contents as a string list.
   */
  public async readLog() {
    try {
      return (await FileManager.readFile(this.logFilePath))?.split("\n") ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Clears the log file.
   */
  public async clearLog() {
    try {
      await FileManager.writeFile(this.logFilePath, "");
    } catch {}
  }
}
