import type { KillOptions } from '../../../lib/Combat';
import { ArgsError } from '../../ArgsError';
import { CommandAttack } from './CommandAttack';
import { CommandCancelTarget } from './CommandCancelTarget';
import { CommandExitCombat } from './CommandExitCombat';
import { CommandKill } from './CommandKill';
import { CommandKillFor } from './CommandKillFor';
import { CommandRest } from './CommandRest';
import { CommandUseSkill } from './CommandUseSkill';

export const combatCommands = {
  attack(target: string) {
    if (!target || typeof target !== 'string') {
      throw new ArgsError('target is required');
    }

    const cmd = new CommandAttack();
    cmd.target = target;
    window.context.addCommand(cmd);
  },
  cancel_target() {
    window.context.addCommand(new CommandCancelTarget());
  },
  exit_combat() {
    window.context.addCommand(new CommandExitCombat());
  },
  kill(target: string, options: Partial<KillOptions>) {
    if (!target || typeof target !== 'string') {
      throw new ArgsError('target is required');
    }

    const cmd = new CommandKill();
    cmd.target = target;
    cmd.options = options;
    window.context.addCommand(cmd);
  },
  kill_for_item(
    target: string,
    item: number | string,
    quantity: number,
    options: Partial<KillOptions>,
  ) {
    if (!target || typeof target !== 'string') {
      throw new ArgsError('target is required');
    }

    if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
      throw new ArgsError('item is required');
    }

    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      throw new ArgsError('quantity is required');
    }

    const cmd = new CommandKillFor();
    cmd.target = target;
    cmd.item = item;
    cmd.quantity = quantity;
    cmd.options = options;
    window.context.addCommand(cmd);
  },
  kill_for_temp_item(
    target: string,
    item: number | string,
    quantity: number,
    options: Partial<KillOptions>,
  ) {
    if (!target || typeof target !== 'string') {
      throw new ArgsError('target is required');
    }

    if (!item || (typeof item !== 'number' && typeof item !== 'string')) {
      throw new ArgsError('item is required');
    }

    if (!quantity || typeof quantity !== 'number') {
      throw new ArgsError('quantity is required');
    }

    const cmd = new CommandKillFor();
    cmd.target = target;
    cmd.item = item;
    cmd.quantity = quantity;
    cmd.isTemp = true;
    cmd.options = options;
    window.context.addCommand(cmd);
  },
  rest() {
    window.context.addCommand(new CommandRest());
  },
  use_skill(skill: number | string) {
    if (!skill || (typeof skill !== 'number' && typeof skill !== 'string')) {
      throw new ArgsError('skill is required');
    }

    const cmd = new CommandUseSkill();
    cmd.skill = skill;
    window.context.addCommand(cmd);
  },
};
