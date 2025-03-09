# Custom Handlers

Custom handlers can be a powerful supplement for your scripts, depending on your use-case.

Custom handlers can be registered at any point in your script. However,they are only triggered when a json packet is received from the server, and don't run in any particular order, yet. They run automatically in the background of your script.

Custom handlers can be overwritten by re-registering under the same name.

Custom handlers persist across script lifetimes, so you can register them once and use them across different scripts. To "get rid of them", you can unregister them or refresh the app.

Realistically, you could even write a handler such that it handles loop taunting correctly, or other variants of auto zoning that aren't natively supported.

## Registering

```js
// cmd.register_handler(name, Handler)

cmd.register_handler('auto zone ledgermayne', function (packet) {
  // Note the unnamed function, so we can properly access "this"
  // Don't use an arrow function!
  //
  // Within each command you can access:
  // bot: Bot (legacy api)

  // packet -> Json packet from server

  if (packet.b.o.cmd === 'event') {
    const zone = packet.b.o.args.zoneSet;

    switch (zone) {
      case 'A': // left
        this.bot.player.walkTo(196, 355);
        break;
      case 'B': // right
        this.bot.player.walkTo(869, 354);
        break;
      default: // center
        this.bot.player.walkTo(480, 275);
    }
  }
});
```

## Unregistering

```js
// cmd.unregister_handler(name)

cmd.unregister_handler('auto zone ledgermayne');
```

## Usage

```js
// previous "auto zone ledgermayne" handler is registered

cmd.join('ledgermayne-1e99', 'Boss', 'Left');

cmd.kill('*'); // along some point, the handler is triggered and the player moves to the correct zone
cmd.log('dead');
```
