import { Logger } from "@vexed/logger";
import { Bot } from "../Bot";
import { Job } from "./Job";

export class QuestsJob extends Job {
  private readonly bot: Bot;

  private index = 0;

  private snapshot: number[] = [];

  private isRestarting = false;

  private logger = Logger.get("questJob", { precision: 3 });

  public constructor() {
    super("quests", 1);

    this.bot = Bot.getInstance();

    this.snapshot = Array.from(this.bot.environment.questIds);

    this.bot.environment.on("questIdsChanged", () => {
      this.restart();
    });
  }

  public restart(): void {
    this.snapshot = Array.from(this.bot.environment.questIds);
    this.index = 0;
    this.isRestarting = true;
  }

  public async execute(): Promise<void> {
    if (this.snapshot.length === 0) return;
    if (this.isRestarting) {
      this.isRestarting = false;
      return;
    }

    const questId = this.snapshot[this.index] as number;

    if (this.index === 0) await this.bot.sleep(1_000);

    this.logger.info(`quest id this tick: ${questId} (${this.index})`);

    if (!this.bot.quests.get(questId)) {
      this.logger.info(`load quest id ${questId}`);
      void this.bot.quests.load(questId);
    }

    if (
      this.bot.flash.call(() => swf.questsIsInProgress(questId)) &&
      this.bot.flash.call(() => swf.questsCanCompleteQuest(questId))
    ) {
      const maxTurnIns = this.bot.flash.call<string>(
        "world.maximumQuestTurnIns",
        questId,
      );
      const numMaxTurnIns = Number(maxTurnIns);
      this.logger.info(`complete quest id ${questId} with ${maxTurnIns}`);
      await this.bot.quests.complete(questId, numMaxTurnIns);
    }

    if (!this.bot.flash.call(() => swf.questsIsInProgress(questId))) {
      this.logger.info(`accept quest id ${questId}`);
      await this.bot.quests.accept(questId);
    }

    this.index = (this.index + 1) % this.snapshot.length;
    await this.bot.sleep(250);
  }
}
