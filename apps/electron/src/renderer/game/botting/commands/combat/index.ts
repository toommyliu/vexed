import { ArgsError } from "@botting/ArgsError";
import type { KillOptions } from "@lib/Combat";
import { CommandAttack } from "./CommandAttack";
import { CommandCancelTarget } from "./CommandCancelTarget";
import { CommandExitCombat } from "./CommandExitCombat";
import { CommandKill } from "./CommandKill";
import { CommandKillFor } from "./CommandKillFor";
import { CommandRest } from "./CommandRest";
import { CommandUseSkill } from "./CommandUseSkill";

export const combatCommands = {
  /**
   * Attacks the target.
   *
   * @param target - The name of the target to attack.
   */
  attack(target: string) {
    if (!target || typeof target !== "string") {
      throw new ArgsError("target is required");
    }

    const cmd = new CommandAttack();
    cmd.target = target;
    window.context.addCommand(cmd);
  },
  /**
   * Cancels the target.
   */
  cancel_target() {
    window.context.addCommand(new CommandCancelTarget());
  },
  /**
   * Exits combat.
   */
  exit_combat() {
    window.context.addCommand(new CommandExitCombat());
  },
  /**
   * Kills the target.
   *
   * @param target - The name of the target to kill.
   * @param options - The options for the kill command.
   */
  kill(target: string, options?: Partial<KillOptions>) {
    if (!target || typeof target !== "string") {
      throw new ArgsError("target is required");
    }

    const cmd = new CommandKill();
    cmd.target = target;
    if (options) cmd.options = options;
    window.context.addCommand(cmd);
  },
  /**
   * Kills the target for an inventory item, until the specified quantity is reached.
   *
   * @param target - The name of the target to kill.
   * @param item - The name or ID of the item.
   * @param quantity - The quantity of the item.
   * @param options  - The options for the kill command.
   */
  kill_for_item(
    target: string,
    item: number | string,
    quantity: number,
    options?: Partial<KillOptions>,
  ) {
    if (!target || typeof target !== "string") {
      throw new ArgsError("target is required");
    }

    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      throw new ArgsError("quantity is required");
    }

    const cmd = new CommandKillFor();
    cmd.target = target;
    cmd.item = item;
    cmd.quantity = quantity;
    if (options) cmd.options = options;
    window.context.addCommand(cmd);
  },
  /**
   * Kills the target for a temporary item, until the specified quantity is reached.
   *
   * @param target - The name of the target to kill.
   * @param item - The name or ID of the item.
   * @param quantity - The quantity of the item.
   * @param options - The options for the kill command.
   */
  kill_for_tempitem(
    target: string,
    item: number | string,
    quantity: number,
    options?: Partial<KillOptions>,
  ) {
    if (!target || typeof target !== "string") {
      throw new ArgsError("target is required");
    }

    if (!item || (typeof item !== "number" && typeof item !== "string")) {
      throw new ArgsError("item is required");
    }

    if (!quantity || typeof quantity !== "number") {
      throw new ArgsError("quantity is required");
    }

    const cmd = new CommandKillFor();
    cmd.target = target;
    cmd.item = item;
    cmd.quantity = quantity;
    cmd.isTemp = true;
    if (options) cmd.options = options;
    window.context.addCommand(cmd);
  },
  /**
   * Rests the player.
   *
   * @param full - Whether to rest fully or not.
   */
  rest(full: boolean = false) {
    const cmd = new CommandRest();
    if (typeof full === "boolean") cmd.full = full;
    window.context.addCommand(cmd);
  },
  /**
   * Uses a skill.
   *
   * @param skill - The skill to use.
   * @param wait - Whether to wait for the skill to be available or not.
   */
  use_skill(skill: number | string, wait: boolean = false) {
    if (!skill || (typeof skill !== "number" && typeof skill !== "string")) {
      throw new ArgsError("skill is required");
    }

    const cmd = new CommandUseSkill();
    cmd.skill = skill;
    if (typeof wait === "boolean") cmd.wait = wait;
    cmd.force = false;
    window.context.addCommand(cmd);
  },
  /**
   * Uses a skill, regardless if there's a target or not.
   *
   * @param skill - The skill to use.
   * @param wait - Whether to wait for the skill to be available or not.
   */
  force_use_skill(skill: number | string, wait: boolean = false) {
    if (!skill || (typeof skill !== "number" && typeof skill !== "string")) {
      throw new ArgsError("skill is required");
    }

    const cmd = new CommandUseSkill();
    cmd.skill = skill;
    if (typeof wait === "boolean") cmd.wait = wait;
    cmd.force = true;
    window.context.addCommand(cmd);
  },
};
