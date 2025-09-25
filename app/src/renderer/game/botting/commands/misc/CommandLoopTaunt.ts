import { interval } from "@vexed/utils";
import { Command } from "@botting/command";
import { isMonsterMapId, extractMonsterMapId } from "@utils/isMonMapId";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

const FOCUS = "Focus";
const DELIM = ",";

const log = (...args: any[]) =>
  console.log(`[${new Date().toLocaleTimeString()}]`, ...args);

type ILoopTaunt = {
  doTaunt(): Promise<void>;
};

function getPotionSlot() {
  return JSON.parse(
    swf.getArrayObject("world.actions.active", 5),
  ) as unknown as {
    cd: number;
    id: number;
    sArg1: string;
    sArg2: string;
    ts: number;
  };
}

function isEquipped() {
  const pot = getPotionSlot();
  return pot?.id === id && pot?.sArg1 === sArg1 && pot?.sArg2 === sArg2;
}

function isOnCooldown() {
  const pot = getPotionSlot();
  const now = Date.now();
  return now < pot?.ts + pot?.cd;
}

export class CommandSimpleLoopTaunt extends Command implements ILoopTaunt {
  public playerIndex!: number; // 1-based index

  public maxPlayers!: number;

  public target!: string;

  private focusLock = false;

  private focusCount = 0;

  private targetMonMapId = -1;

  private stopped = false;

  public override async execute(): Promise<void> {
    if (isMonsterMapId(this.target)) {
      const monMapIdStr = extractMonsterMapId(this.target);
      const monMapId = Number.parseInt(monMapIdStr, 10);
      if (!Number.isNaN(monMapId)) this.targetMonMapId = monMapId;
    } else {
      const mon = this.bot.world.availableMonsters.find(
        (mon) => mon.name.toLowerCase() === this.target.toLowerCase(),
      );
      if (mon) this.targetMonMapId = mon.monMapId;
    }

    if (this.targetMonMapId === -1) {
      return;
    }

    const ref_1 = this.onPacketFromServer.bind(this);
    const ref_2 = this.onMonsterDeath.bind(this);

    this.bot.on("packetFromServer", ref_1);
    this.bot.on("monsterDeath", ref_2);
    this.ctx.once("end", () => {
      this.stopped = true;
      this.bot.off("packetFromServer", ref_1);
      this.bot.off("monsterDeath", ref_2);
    });
  }

  private onPacketFromServer(packet: string) {
    if (!packet.startsWith("{")) return;

    const msg = JSON.parse(packet);
    const data = msg?.b?.o;
    const cmd = data?.cmd;

    if (cmd !== "ct") return;

    const auras = data?.a as any[] | undefined;
    if (!Array.isArray(auras) || !auras?.length) return;

    for (const aItem of auras) {
      if (typeof aItem?.tInf === "string" && !aItem?.tInf.startsWith("m:"))
        continue;

      const monMapId = Number(aItem?.tInf?.split(":")[1]);
      if (monMapId !== this.targetMonMapId) {
        console.log(`skip monMapId: ${monMapId}`);
        continue;
      }

      const auraList = aItem?.auras as any[] | undefined;

      for (const aura of auraList ?? []) {
        if (aura?.nam !== FOCUS) continue;

        if (this.focusLock) {
          log("SKIP");
          return;
        }

        if (this.stopped) {
          return;
        }

        this.focusLock = true;
        setTimeout(async () => {
          log("RESET");
          this.focusLock = false;

          if (
            this.bot.player.isReady() &&
            !this.focusLock &&
            this.focusCount % this.maxPlayers === this.playerIndex - 1
          ) {
            await this.doTaunt();
          }
        }, 10_000 /* 6s + 4s buffer */);

        log("FOCUS");
        this.focusCount += 1;
      }
    }
  }

  private onMonsterDeath(monMapId: number) {
    if (this.targetMonMapId !== monMapId) return;
    this.stopped = true;
  }

  public async doTaunt() {
    if (
      this.ctx.isRunning() &&
      this.bot.player.isReady() &&
      this.bot.player.alive &&
      !this.stopped
    ) {
      this.bot.combat.attack(`id:${this.targetMonMapId}`);
      await this.bot.combat.useSkill(5, true, true);
      log("[SIMPLE] TAUNT");
    }
  }

  public override toString() {
    return `Loop taunt [t${this.playerIndex}/t${this.maxPlayers}]`;
  }
}
