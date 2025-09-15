import { interval } from "@vexed/utils";
import { Mutex } from "async-mutex";
import { Command } from "@botting/command";

const id = 517;
const sArg1 = "12917"; // sArg1
const sArg2 =
  "This spell forces your target to focus their attacks on you and causes them to attack recklessly lowering their damage for 10 seconds. (Taunt effects do not work on players.)"; // sArg2

export class CommandLoopTaunt extends Command {
  #mutex = new Mutex();

  // simple: taunt when available
  // message: taunt on server message
  public mode: "message" | "simple" = "simple";

  // the message to taunt on
  public message?: string;

  // the taunt index t1..tN
  public participantIndex!: number;

  // how many players are expected to do loop taunt
  public maxParticipants!: number;

  // the target(s) to loop taunt on. use monMapId to be more reliable, especially if multiple instances of monster with the same name exists
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
    let lastFocusEndTime = 0;
    let waitingForMyTurn = false;

    // First participant starts immediately
    let shouldTaunt = this.participantIndex === 1;

    void setInterval(async () => {
      await this.#mutex.runExclusive(async () => {
        const currentTime = Date.now();

        if (!this.bot.combat?.target) return;

        const hasFocus = this.bot.combat.target.hasAura("Focus");

        // If focus just ended, start the rotation timer
        if (!hasFocus && lastFocusEndTime > 0 && waitingForMyTurn) {
          const timeSinceFocusEnd = currentTime - lastFocusEndTime;

          // After focus ends, wait for the participant's turn based on their index
          // Each participant waits (participantIndex - 1) * delay seconds
          const myTurnDelay = (this.participantIndex - 1) * 1_000; // 1 second stagger

          if (timeSinceFocusEnd >= myTurnDelay) {
            shouldTaunt = true;
            waitingForMyTurn = false;
            console.log(
              `My turn delay (${myTurnDelay}ms) has passed, setting shouldTaunt = true`,
            );
          }
        }

        // Taunt if it's my turn and no focus is active
        if (shouldTaunt && !hasFocus) {
          console.log(
            `It's my turn to taunt (t${this.participantIndex}/t${this.maxParticipants})`,
          );
          await this.doTaunt();
          shouldTaunt = false;
          lastFocusEndTime = 0; // reset the timer
        }

        // If focus appears, wait for it to end
        if (hasFocus) {
          await this.bot.waitUntil(
            () => !this.bot.combat?.target?.hasAura("Focus"),
            null,
            -1,
          );

          lastFocusEndTime = Date.now();
          waitingForMyTurn = true;
          console.log(
            `Focus ended, waiting for turn. My delay: ${this.participantIndex - 1}000ms`,
          );
        }
      });
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
    await interval(async (iterations, stop) => {
      if (!this.isScrollEquipped()) return;
      if (!this.bot.combat.hasTarget()) return;

      await this.bot.combat.useSkill(5, true, true);
      await this.bot.sleep(100);
      if (this.bot.combat?.target?.hasAura("Focus")) {
        console.log(`doTaunt - success, took ${iterations} iterations`);
        stop();
      }
    }, 100);
  }
}
