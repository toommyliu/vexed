import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyDivideOnCells extends ArmyCommand {
  public cells!: string[];

  public priorityCell?: string;

  public override async execute() {
    await this.executeWithArmy(async () => {
      const playerNumber = this.bot.army.getPlayerNumber();
      if (playerNumber === -1) return;

      const players = Array.from(this.bot.army.players);
      const currentUsername = this.bot.auth.username.toLowerCase();

      let targetCell: string | undefined;

      if (this.priorityCell) {
        // Distribution with priority cell
        for (const [playerIndex, player] of players.entries()) {
          const cell =
            this.cells.length > 0 && playerIndex < this.cells.length
              ? this.cells[playerIndex]
              : this.priorityCell;

          if (currentUsername === player.toLowerCase()) {
            targetCell = cell;
            break;
          }
        }
      } else {
        // Round-robin distribution
        let cellIndex = 0;
        for (const player of players) {
          const cell = this.cells[cellIndex];
          if (currentUsername === player.toLowerCase()) {
            targetCell = cell;
            break;
          }

          cellIndex = cellIndex === this.cells.length - 1 ? 0 : cellIndex + 1;
        }
      }

      if (targetCell) {
        await this.bot.world.jump(targetCell, "Left");
      }
    });
  }

  public override toString() {
    return `Army divide on cells: ${this.cells.join(", ")} ${
      this.priorityCell ? `[${this.priorityCell}]` : ""
    }`;
  }
}
