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
  // index of this participant, 1-based
  public participantIndex!: number;

  // total number of participants
  public maxParticipants!: number;

  // name of the target monster to taunt
  public target!: string;

  private startListening = false;

  private tauntCount = 0;

  private focusCountThisTick = 0;

  private stopFn: (() => void) | undefined;

  public override async execute() {
    const ref = this.onPacketFromServer.bind(this);

    void interval(async (_, stop) => {
      if (this.startListening || !this.bot.player.isReady()) {
        stop();
        return;
      }

      let combatCount = 0;
      for (const plyrName of this.bot.world.playerNames) {
        const plyr = this.bot.world.players?.get(plyrName);
        if (plyr?.isInCombat()) combatCount++;
      }

      // Since loop taunting is only used in armying scenarios, we can
      // simply wait for all to be in combat for reliability.
      if (combatCount >= this.maxParticipants) {
        // console.log("start listening");
        this.startListening = true;

        void interval(async (_, stop) => {
          this.stopFn ??= stop;
          if (!this.startListening || !this.bot.player.isReady()) return;

          if (
            this.focusCountThisTick === 0 /* no one has taunted recently */ &&
            this.tauntCount % this.maxParticipants ===
              this.participantIndex - 1 /* our turn to taunt */ &&
            this.bot.combat?.target?.isMonster() &&
            this.bot.combat?.target?.data?.strMonName.toLowerCase() ===
              this.target.toLowerCase() /* target matches */
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
      this.stopFn?.();
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
      if (typeof aItem?.tInf === "string" && !aItem?.tInf?.startsWith("m:"))
        continue;

      const monMapId = Number.parseInt(aItem?.tInf?.split(":")[1], 10);
      if (
        this.bot.combat?.target?.isMonster() &&
        this.bot.combat?.target?.monMapId !== monMapId
      )
        continue;

      const auraList = aItem?.auras as any[] | undefined;

      for (const aura of auraList ?? []) {
        const name = aura?.nam;
        if (name !== FOCUS) continue;

        // if someone else taunted but we've already
        // processed a taunt this tick, skip
        if (this.focusCountThisTick > 0) {
          logWithTimestamp("SKIP");
          return;
        }

        this.focusCountThisTick = 1;
        setTimeout(() => {
          logWithTimestamp("RESET");
          this.focusCountThisTick = 0;
        }, 10_000);

        logWithTimestamp("FOCUS");
        this.tauntCount++;
      }
    }
  }

  private async doTaunt() {
    while (
      this.ctx.isRunning() &&
      this.bot.player.alive &&
      this.focusCountThisTick === 0
    ) {
      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(50);
    }

    logWithTimestamp("TAUNT");
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
