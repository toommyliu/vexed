import { interval } from "@vexed/utils";
import { Command } from "@botting/command";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

export class CommandLoopTaunt extends Command {
  // simple: taunt when available
  // message: taunt on server message
  public mode: "message" | "simple" = "simple";

  // the message to taunt on
  public message?: string;

  // the taunt index t1..tN
  public participantIndex!: number;

  // how many players are expected to do loop taunt
  public maxParticipants!: number;

  // the target(s) to loop taunt on
  // if target dies or becomes unavailable, loop taunt switches to the next target if available
  public target?: string;

  // the map name, acts as a validation check for the server message
  public mapName?: string;

  public override async execute() {
    switch (this.mode) {
      case "simple":
        await this.doSimpleLoopTaunt();
        break;
      case "message":
        await this.doMessageLoopTaunt();
        break;
    }
  }

  public override toString() {
    if (this.mode === "simple") {
      return `Loop Taunt [t${this.participantIndex}/t${this.maxParticipants}]`;
    }

    return `Loop Taunt "${this.message}" [t${this.participantIndex}/t${this.maxParticipants}]`;
  }

  private async doSimpleLoopTaunt() {
    let tauntIndex = 1;
    let lastTauntTime = 0;

    let warmupStartTime = Date.now();
    let isWarmedUp = false;
    const warmupDuration = 3_000; // 3 seconds warmup grace period

    console.log(
      `starting loop taunt as participant ${this.participantIndex}/${this.maxParticipants}`,
    );

    void interval(async (_iteration, stop) => {
      if (!this.bot.player.isReady() || !this.ctx.isRunning()) {
        stop();
        return;
      }

      // make sure we're attacking the target so auras are tracked ASAP
      if (this.target) this.bot.combat.attack(this.target);

      // don't use reference to target, as auras don't get synced
      if (
        !this.bot.combat.target?.isMonster() ||
        this.bot.combat.target?.isDead()
      ) {
        // reset warmup if target changes
        isWarmedUp = false;
        warmupStartTime = Date.now();
        return;
      }

      // solution: warmup period to ensure all players have attacked atleast once
      if (!isWarmedUp) {
        const elapsedWarmup = Date.now() - warmupStartTime;
        if (elapsedWarmup >= warmupDuration) {
          isWarmedUp = true;
          console.log("warmup complete!");
        } else {
          return; // do nothing until warmup completes
        }
      }

      // Calculate whose turn it is based on the taunt index
      // tauntIndex cycles through 1, 2, 3, ..., maxParticipants, 1, 2, 3, ...
      const currentTurnParticipant =
        ((tauntIndex - 1) % this.maxParticipants) + 1;
      const isMyTurn = currentTurnParticipant === this.participantIndex;

      // TODO: as t1 this works fine, but as t2 it fails to detect focus
      // const hasFocus = this.bot.combat.target?.hasAura("Focus") ?? false;

      console.log(
        `turn check - player ${this.participantIndex}, current turn: ${currentTurnParticipant}, my turn: ${isMyTurn}, has Focus: ${this.bot.combat.target?.hasAura("Focus") ?? false}, taunt index: ${tauntIndex}`,
      );

      if (isMyTurn && !this.bot.combat.target?.hasAura("Focus")) {
        const currentTime = Date.now();
        const timeSinceLastTaunt = currentTime - lastTauntTime;

        if (timeSinceLastTaunt > 1_000) {
          console.log(
            `Player ${this.participantIndex} taunting (taunt #${tauntIndex})`,
          );
          lastTauntTime = currentTime;
          await this.doTaunt();
          tauntIndex++;
          console.log(
            `Taunt completed, next turn: player ${((tauntIndex - 1) % this.maxParticipants) + 1}`,
          );
        }
      } else if (this.bot.combat.target?.hasAura("Focus") && isMyTurn) {
        // Someone else taunted while it was supposed to be our turn, advance the index
        tauntIndex++;
        console.log(
          `Focus detected, advancing to next turn: player ${((tauntIndex - 1) % this.maxParticipants) + 1}`,
        );
      }

      // // Fallback timeout mechanism - if it's been too long since last taunt, advance rotation
      // // This helps if aura detection fails or gets out of sync
      // const currentTime = Date.now();
      // const timeSinceLastTaunt = currentTime - lastTauntTime;

      // if (timeSinceLastTaunt > 15_000 && lastTauntTime > 0) {
      //   console.log(
      //     `Taunt timeout detected (${Math.round(timeSinceLastTaunt / 1_000)}s), advancing rotation`,
      //   );
      //   tauntIndex++;
      //   lastTauntTime = currentTime;
      // }
    }, 250);
  }

  private async doMessageLoopTaunt() {}

  // whether Scroll of Enrage is equipped
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

  private async doTaunt() {
    if (!this.isScrollEquipped()) {
      console.log("Not using Scroll of Enrage, cannot taunt");
      return;
    }

    if (!this.bot.combat.target) {
      console.log("No target available for taunting");
      return;
    }

    // Check if target already has Focus aura
    const hadFocusBefore = this.bot.combat.target?.hasAura("Focus") ?? false;
    console.log(`Target has Focus before taunt: ${hadFocusBefore}`);

    // Attempt to taunt
    console.log("Attempting to use taunt skill...");
    void this.bot.combat.useSkill(5, true, false);

    // Wait a moment for the skill to apply
    await this.bot.sleep(100);

    // Check if Focus aura was applied
    let hasFocusAfter = this.bot.combat.target?.hasAura("Focus") ?? false;
    console.log(`Target has Focus after taunt: ${hasFocusAfter}`);

    // If taunt didn't apply and we didn't have it before, try a few more times
    let attempts = 0;

    while (!hasFocusAfter && this.isScrollEquipped()) {
      attempts++;
      console.log(
        `Taunt attempt ${attempts} - Focus not detected, retrying...`,
      );
      void this.bot.combat.useSkill(5, true, false);
      await this.bot.sleep(100);

      hasFocusAfter = this.bot.combat.target?.hasAura("Focus") ?? false;
      if (hasFocusAfter) {
        console.log(`Focus aura applied on attempt ${attempts}`);
        break;
      }
    }
  }

  // handle auras through packets since aura checks are not consistent
  // plus, existing aura serialization is not applicable to Focus aura
  // private packetfromserver(packet: string) {
  //   const pkt = JSON.parse(packet);

  // }

  // private isValidPacket(packet: object) {
  //   return 't' in packet && packet.t === 'xt' &&
  //     'cmd' in packet?.b?.o
  // }
}
