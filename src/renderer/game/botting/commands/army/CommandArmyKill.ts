import { Command } from "../../command";

export class CommandArmyKill extends Command {
  public override async execute() {
    if (!this.bot.army.isInitialized) {
      console.warn("Army is not initialized");
      return;
    }

    for (const skillId of [1, 2, 3]) {
      await this.bot.combat.useSkill(skillId, true);
      await this.bot.sleep(1_000);
    }
    console.log("Buff done");

    this.bot.settings.infiniteRange = true;
    this.bot.settings.lagKiller = true;
    this.bot.settings.enemyMagnet = true;
    this.bot.settings.counterAttack = true;
    console.log("Settings done");

    if (this.bot.player.className === "ArchPaladin") {
      await this.bot.combat.useSkill(2, true);
    } else {
      await this.bot.sleep(200);
    }

    let killDone = false;

    this.bot.on("monsterDeath", async () => {
      if (!killDone) {
        killDone = true;
        const done = await this.bot.army.sendDone();
        console.log("Army kill done success:", done);
      }
    });

    while (!(await this.bot.army.isAllDone())) {
      await this.bot.combat.kill("*");
    }

    console.log("Kill done");

    this.bot.settings.infiniteRange = false;
    this.bot.settings.lagKiller = false;
    this.bot.settings.enemyMagnet = false;
    this.bot.settings.counterAttack = false;

    console.log("Kill with army done");
  }

  public override toString() {
    return "Army kill";
  }
}
