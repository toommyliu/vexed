import { interval } from "@vexed/utils";
import { Command } from "@botting/command";
import { isMonsterMapId, extractMonsterMapId } from "@utils/isMonMapId";
import { log } from "winston";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

const FOCUS = "Focus";
const DELIM = ",";

const logWithTimestamp = (...args: any[]) => {
  console.log(`[${new Date().toLocaleTimeString()}]`, ...args);
};

export class CommandLoopTaunt extends Command {
  public playerIndex!: number; // 1-based index

  public maxPlayers!: number; // total participants

  public target!: string;

  private targetMonMapId!: number; // monMapId of the target monster

  private startListening = false;

  private tauntCount = 0;

  private focusCountThisTick = 0;

  private stopFn: (() => void) | undefined;

  public override async execute() {
    if (!this.isScrollEquipped()) {
      await this.bot.inventory.equip("Scroll of Enrage");
    }

    const ref_1 = this.onPacketFromServer.bind(this);
    const ref_2 = this.onMonsterDeath.bind(this);

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
      if (combatCount >= this.maxPlayers) {
        // console.log("start listening");
        this.startListening = true;
        stop();
      }
    }, 250);

    void interval(async (_, stop) => {
      this.stopFn ??= stop;

      if (!this.startListening) return;
      if (!this.bot.player.isReady()) {
        stop();
        return;
      }

      if (!this.hasTargetLock) {
        const tgt = this.getTauntTarget();
        if (!tgt) {
          logWithTimestamp("NO VALID TARGET, STOP");
          stop();
          return;
        }

        this.bot.combat.attack(tgt);
      }

      if (
        this.focusCountThisTick === 0 /* no one has taunted recently */ &&
        this.tauntCount % this.maxPlayers ===
          this.playerIndex - 1 /* our turn to taunt */
      ) {
        await this.doTaunt();
      }
    }, 1_000);

    this.bot.on("packetFromServer", ref_1);
    this.bot.on("monsterDeath", ref_2);
    this.ctx.on("end", () => {
      this.bot.off("packetFromServer", ref_1);
      this.bot.off("monsterDeath", ref_2);
      this.stopFn?.();
    });
  }

  public override toString() {
    return `Loop Taunt [t${this.playerIndex}/t${this.maxPlayers}]`;
  }

  private onMonsterDeath(monMapId: number) {
    if (!this.startListening) return;

    if (this.targetMonMapId === monMapId) {
      logWithTimestamp("TARGET DIED");

      const newTgt = this.getTauntTarget();
      if (newTgt) {
        const newMonMapId = extractMonsterMapId(newTgt);
        this.targetMonMapId = Number.parseInt(newMonMapId, 10);
        this.bot.combat.attack(newTgt);
        logWithTimestamp(`NEW TARGET: ${newTgt}`);
      } else {
        this.targetMonMapId = 0;
        logWithTimestamp("NO NEW TARGET?");
      }
    }
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

      const monMapId = Number.parseInt(aItem?.tInf?.split(":")[1], 10); // the monMapId that the aura is applied to
      if (monMapId !== this.targetMonMapId) continue;

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
        }, 10_000); // 6s duration + 4s buffer

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

  /**
   * Whether we have a target locked.
   */
  private get hasTargetLock() {
    return Boolean(this.targetMonMapId);
  }

  /**
   * Get the target to taunt.
   */
  private getTauntTarget() {
    const parts = this.target!.split(DELIM).map((part) => part.trim());

    for (const tgt of parts) {
      if (isMonsterMapId(tgt)) {
        const monMapIdStr = extractMonsterMapId(tgt);
        const monMapId = Number.parseInt(monMapIdStr, 10);
        if (Number.isNaN(monMapId)) continue;

        const mon = this.bot.world.availableMonsters.find(
          (mon) => mon.monMapId === monMapId,
        );
        if (mon) {
          this.targetMonMapId = mon.monMapId;
          return tgt; // return the original monMapId string
        }
      } else {
        // find() will match first found and if multiple monsters have the same name,
        // they should've specified monMapId format instead
        const mon = this.bot.world.availableMonsters.find(
          (mon) => mon.data?.strMonName.toLowerCase() === tgt.toLowerCase(),
        );
        if (mon) {
          this.targetMonMapId = mon.monMapId;
          return `id:${mon.monMapId}`;
        }
      }
    }

    return null;
  }

  private isScrollEquipped() {
    const skills = this.bot.flash.get<
      {
        id: number;
        sArg1: string;
        sArg2: string;
      }[]
    >("world.actions.active", true);
    if (Array.isArray(skills) && skills.length === 6) {
      const potion = skills[skills.length - 1];
      // id and sArg1 are probably sufficient matches
      return (
        potion?.id === id && potion?.sArg1 === sArg1 && potion?.sArg2 === sArg2
      );
    }

    return false;
  }
}

export class CommandMsgLoopTaunt extends Command {
  public playerIndex!: number; // 1-based index

  public maxPlayers!: number; // total participants

  public target!: string;

  public msg!: string; // the message text to look for (substring match)

  private targetMonMapId!: number; // monMapId of the target monster

  private tauntCount = 0;

  public override async execute() {
    logWithTimestamp("NEW EXECUTE");

    if (!this.isScrollEquipped()) {
      await this.bot.inventory.equip("Scroll of Enrage");
    }

    const tgt = this.getTauntTarget();
    if (tgt) {
      logWithTimestamp(`INITIAL TARGET: ${tgt}`);
      this.bot.combat.attack(tgt);
    } else {
      logWithTimestamp("NO VALID TARGET, STOP");
      return;
    }

    const ref_1 = this.onCtMessage.bind(this);
    const ref_2 = this.onMonsterDeath.bind(this);

    this.bot.on("ctMessage", ref_1);
    this.bot.on("monsterDeath", ref_2);
    this.ctx.on("end", () => {
      this.bot.off("ctMessage", ref_1);
      this.bot.off("monsterDeath", ref_2);
    });
  }

  public override toString() {
    return `Msg Loop Taunt: ${this.msg} [t${this.playerIndex}/t${this.maxPlayers}]`;
  }

  private onMonsterDeath(monMapId: number) {
    if (this.targetMonMapId === monMapId) {
      logWithTimestamp("TARGET DIED");

      const newTgt = this.getTauntTarget();
      if (newTgt) {
        const newMonMapId = extractMonsterMapId(newTgt);
        this.targetMonMapId = Number(newMonMapId);
        this.bot.combat.attack(newTgt);
        logWithTimestamp(`NEW TARGET: ${newTgt}`);
      } else {
        this.targetMonMapId = 0;
        logWithTimestamp("NO NEW TARGET?");
      }
    }
  }

  private async onCtMessage(packet: string, obj: Record<string, string>) {
    if (typeof packet !== "string") {
      console.warn("onCtMessage received non-string packet:", packet);
      return;
    }

    if (!packet.toLowerCase().includes(this.msg.toLowerCase())) return;

    if (
      "tInf" in obj &&
      typeof obj?.["tInf"] === "string" &&
      String(obj?.["tInf"].split(":")[1]) !== String(this.targetMonMapId)
    )
      return;

    // logWithTimestamp(`MSG DETECTED ON OUR TARGET: ${this.targetMonMapId}`);

    if (this.tauntCount % this.maxPlayers === this.playerIndex - 1) {
      logWithTimestamp("TAUNT", obj);
      await this.doTaunt();
    }

    this.tauntCount++;
  }

  private async doTaunt() {
    while (
      this.ctx.isRunning() &&
      this.bot.player.alive &&
      !this.isOnCooldown()
    ) {
      // we might've switched targets, so don't bother taunting
      if (
        this.bot.combat?.target?.isMonster() &&
        this.bot.combat?.target.monMapId !== this.targetMonMapId
      )
        return;

      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(50);
    }
  }

  /**
   * Get the target to taunt.
   */
  private getTauntTarget() {
    const parts = this.target!.split(DELIM).map((part) => part.trim());

    for (const tgt of parts) {
      if (isMonsterMapId(tgt)) {
        const monMapIdStr = extractMonsterMapId(tgt);
        const monMapId = Number.parseInt(monMapIdStr, 10);
        if (Number.isNaN(monMapId)) continue;

        const mon = this.bot.world.availableMonsters.find(
          (mon) => mon.monMapId === monMapId,
        );
        if (mon) {
          this.targetMonMapId = mon.monMapId;
          return tgt; // return the original monMapId string
        }
      } else {
        // find() will match first found and if multiple monsters have the same name,
        // they should've specified monMapId format instead
        const mon = this.bot.world.availableMonsters.find(
          (mon) => mon.data?.strMonName.toLowerCase() === tgt.toLowerCase(),
        );
        if (mon) {
          this.targetMonMapId = mon.monMapId;
          return `id:${mon.monMapId}`;
        }
      }
    }

    return null;
  }

  private isScrollEquipped() {
    const skills = this.bot.flash.get<
      {
        id: number;
        sArg1: string;
        sArg2: string;
      }[]
    >("world.actions.active", true);
    if (Array.isArray(skills) && skills.length === 6) {
      const potion = skills[skills.length - 1];
      // id and sArg1 are probably sufficient matches
      return (
        potion?.id === id && potion?.sArg1 === sArg1 && potion?.sArg2 === sArg2
      );
    }

    return false;
  }

  private isOnCooldown() {
    const skills = this.bot.flash.get<
      {
        cd: number;
        id: number;
        sArg1: string;
        sArg2: string;
        ts: number;
      }[]
    >("world.actions.active", true);
    if (Array.isArray(skills) && skills.length === 6) {
      const potion = skills[skills.length - 1];
      const cd = potion?.cd as number | undefined;
      const ts = potion?.ts as number | undefined;
      if (typeof cd === "number" && typeof ts === "number") {
        const now = Date.now();
        return now < ts + cd;
      }
    }

    return false;
  }
}
