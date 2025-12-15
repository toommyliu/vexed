import { Command } from "~/botting/command";

export class CommandAbandonQuest extends Command {
    public questId!: number;

    public override executeImpl(): Promise<void> {
        return this.bot.quests.abandon(this.questId);
    }

    public override toString(): string {
        return `Abandon quest: ${this.questId}`;
    }
}