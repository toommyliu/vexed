---
outline: deep
---

## Writing Scripts

A script is composed by a series of "commands" that are executed in sequence. Scripts could even be cyclical too.

Each command is a function that can be called with a set of arguments.

> [!TIP]
>
> If you've used Cetera/Grimoire before, commands are implemented exactly the same way.

## Why the commands pattern?

Script lifecycles are difficult to manage internally. Exposing commands for you to execute and letting the lifecycle be managed by the app is easier to maintain, plus it reduces the barrier to entry for creating scripts.

Before we might have had something like this:

```js
await world.join('tercessuinotlim-1e99');
await bot.combat.killForItem('Dark Makai', 'Defeated Makai', 50); // here
console.log('got items');
await bot.world.join('nexus-1e99');
```

Assume we stopped execution mid-task. The remaining code still gets executed when it shouldn't. While we could simply just "add flags" within tasks, it is not a scalable solution. External functions too would need these flags which just bloats the code.

> [!NOTE]
> Feel free to create a PR if you have a better solution.

> Regarding legacy support, you can technically still load previously-compatible scripts. Through `Bot.getInstance()`, you can access all previously available api namespaces. Now, there is no hand-holding (async IIFE, globals, etc). Since you have to manage the lifetime yourself, the UI might be desynced with the script state, which could be technically managed yourself since you can access the DOM.

```js
const bot = Bot.getInstance();

async function start() {
  await world.join('nexus-1e99');
  await combat.kill('frogzard');
}

start().catch(() => {
  console.error('some error occured');
});
```
