import { Command } from '../../command';

export class CommandStop extends Command {
  public override async execute() {
    await this.ctx.stop();
  }

  public override toString(): string {
    return 'Stop bot';
  }
}
