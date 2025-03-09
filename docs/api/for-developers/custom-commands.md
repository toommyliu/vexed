# Custom Commands

vexed might not have all scripting commands you might desire. With custom commands, you can register your own with more flexibility than pre-defined commands. Plus, you have full access to utilize internal apis (legacy api) but have to manage some minor details yourself. For example, a command might have a long task that isn't "finished" (like a Promise) and you want to "pause" the script until it's done. You can use a promise and resolve when the task can be marked as done or simply use a non-blocking asynchronous sleep.

Custom commands need to be registered **BEFORE** they can be called. Therefore, you ideally would register them at the beginning of your script.

Custom commands can be overwritten by re-registering under the same name.

Custom commands persist across script lifetimes, so you can register them once and use them across different scripts. To "get rid of them", you can unregister them or refresh the app.

## Registering

```js
// cmd.register_command(name, Command)

cmd.register_command('is_in_bank_or_inventory', (Command) => {
  const command = new Command();

  // Note the unnamed function, so we can properly access "this"
  // Don't use an arrow function!
  //
  // Within each command you can access:
  // bot: Bot (legacy api)
  // ctx: Context (undocumented)
  // args: arguments passed to the command
  command.execute = async function () {
    // this.args -> ['A','B','C']
    const item = this.args[0]; // 'A'

    const isInBank = this.bot.bank.contains(item);
    const isInInventory = this.bot.inventory.contains(item);

    if (!(isInBank || isInInventory)) this.ctx.commandIndex++;
  };

  command.toString = function () {
    return `Item is in bank or inventory: ${this.args[0]}`; // Item is in bank or inventory: A
  };

  // Must return a Command
  return command;
});
```

## Unregistering

```js
// cmd.unregister_command(name)

cmd.unregister_command('is_in_bank_or_inventory');
```

## Usage

```js
// previous "is_in_bank_or_inventory" command is registered

cmd.is_in_bank_or_inventory('Barber');
cmd.goto_label('yes');
cmd.goto_label('no');

cmd.label('yes');
cmd.log('yes to is_in_bank_or_inventory');
cmd.goto_label('stop');

cmd.label('no');
cmd.log('no to is_in_bank_or_inventory');
cmd.goto_label('stop');

cmd.label('stop');
cmd.log('stop!');
cmd.stop();
```
