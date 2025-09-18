import { interval } from "@vexed/utils";
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
  public participantIndex!: number;

  public maxParticipants!: number;

  public target!: string;

  private startListening = false;

  private tauntCount = 0;

  private focusCountThisTick = 0;

  private mainIntervalStop: (() => void) | undefined;

  public override async execute() {
    if (this.participantIndex === 1) {
      this.bot.settings.customName = "TAUNTER 1";
    } else if (this.participantIndex === 2) {
      this.bot.settings.customName = "TAUNTER 2";
    }

    const ref = this.onPacketFromServer.bind(this);

    void interval(async (_, stop) => {
      if (this.startListening || !this.bot.player.isReady()) {
        stop();
        return;
      }

      let combatCount = 0;
      for (const plyrName of this.bot.world.playerNames) {
        const plyr = this.bot.world.players?.get(plyrName);
        if (plyr?.isInCombat()) {
          combatCount++;
        }
      }

      if (combatCount >= this.maxParticipants) {
        console.log("start listening");
        this.startListening = true;

        void interval(async (_, stop) => {
          this.mainIntervalStop = stop;
          if (!this.startListening || !this.bot.player.isReady()) return;
          if (
            this.focusCountThisTick === 0 &&
            this.tauntCount % this.maxParticipants === this.participantIndex - 1
          ) {
            await this.doTaunt();
          }
        }, 1_000);

        stop();
      }
    }, 250);

    this.bot.on("packetFromServer", ref);
    this.ctx.on("end", () => {
      this.bot.off("packetFromServer", ref);
      if (this.mainIntervalStop) this.mainIntervalStop();
    });
  }

  public override toString() {
    return `Loop Taunt [t${this.participantIndex}/t${this.maxParticipants}]`;
  }

  private onPacketFromServer(packet: string) {
    if (!this.startListening) return;
    if (!packet.startsWith("{")) return;

    const msg = JSON.parse(packet);
    const data = msg?.b?.o;
    const cmd = data?.cmd;

    if (cmd !== "ct") return;

    const auras = data?.a as any[] | undefined;
    if (!Array.isArray(auras) || !auras.length) return;

    for (const aItem of auras) {
      const auraList = aItem?.auras as any[] | undefined;

      for (const aura of auraList ?? []) {
        const name = aura?.nam;
        if (name !== FOCUS) continue;

        this.focusCountThisTick = 1;
        setTimeout(() => {
          console.log("reset focus count");
          this.focusCountThisTick = 0;
        }, 10_000);
        console.log("FOCUS");

        this.tauntCount++;
      }
    }
  }

  private async doTaunt() {
    await this.bot.combat.useSkill(5, true, true);
    logWithTimestamp("taunt cast");
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
}
