import { Command } from "@botting/command";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

const FOCUS = "Focus";

const logWithTimestamp = (...args: any[]) => {
  console.log(`[${new Date().toLocaleTimeString()}]`, ...args);
};

export class CommandLoopTaunt extends Command {
  // the taunt index t1..tN
  // starts from 1 to N
  public participantIndex!: number;

  // how many players are expected to do loop taunt
  public maxParticipants!: number;

  // the target(s) to loop taunt on. use monMapId to be more reliable, especially if multiple instances of monster with the same name exists
  // if target dies or becomes unavailable, loop taunt switches to the next target if available
  public target!: string;

  private tauntCount = 0;

  private gotAura = false;

  private auraTime = 0;

  private auraResetTimer?: NodeJS.Timeout;

  public override async execute() {
    if (this.participantIndex === 1) {
      this.bot.settings.customName = "TAUNTER 1";
    } else if (this.participantIndex === 2) {
      this.bot.settings.customName = "TAUNTER 2";
    }

    this.bot.on("auraAdd", async (mon, aura) => {
      if (
        mon.name.toLowerCase() === this.target.toLowerCase() &&
        aura.name === FOCUS
      ) {
        const timeSinceLastAura = Date.now() - this.auraTime;
        if (!this.gotAura || timeSinceLastAura > 5_000) {
          this.gotAura = true;
          this.auraTime = Date.now();
          logWithTimestamp("got FOCUS at", this.auraTime);
          logWithTimestamp(`focus count: ${++this.tauntCount}`);

          if (this.auraResetTimer) {
            clearTimeout(this.auraResetTimer);
          }

          this.auraResetTimer = setTimeout(() => {
            this.gotAura = false;
            logWithTimestamp("FOCUS expired after timer");
          }, 7_000);

          const shouldWeTaunt =
            (this.participantIndex === 2 && this.tauntCount % 2 === 1) ||
            (this.participantIndex === 1 && this.tauntCount % 2 === 0);

          if (shouldWeTaunt) {
            await this.bot.sleep(10_000); // 6s base active time + 4s buffer
            console.log("TAUNT");
            await this.doTaunt();
          }
        } else {
          logWithTimestamp(
            `Ignoring duplicate FOCUS (${timeSinceLastAura}ms since last), badly timed`,
          );
        }
      }
    });
    this.ctx.on("end", () => {
      this.bot.removeAllListeners("auraAdd");
    });
  }

  public override toString() {
    return `Loop Taunt [t${this.participantIndex}/t${this.maxParticipants}]`;
  }

  // private isScrollEquipped() {
  //   const skills = this.bot.flash.get<
  //     {
  //       id: number;
  //       sArg1: string;
  //       sArg2: string;
  //     }[]
  //   >("world.actions.active", true);
  //   if (Array.isArray(skills) && skills.length === 6) {
  //     const potion = skills[skills.length - 1];
  //     // id and sArg1 are probably sufficient matches
  //     return (
  //       potion?.id === id && potion?.sArg1 === sArg1 && potion?.sArg2 === sArg2
  //     );
  //   }

  //   return false;
  // }

  private async doTaunt() {
    while (!this.gotAura) {
      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(100);
    }
  }
}
