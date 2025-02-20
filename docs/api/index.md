---
outline: deep
---

## Writing Scripts

A script is composed by a series of "commands" that are executed in sequence. Scripts could even be cyclical too.

Each command is a function that can be called with a set of arguments.

> [!TIP]
>
> If you've used Grimoire before, commands are implemented exactly the same way.

## Why the commands pattern?

Internally, I found it easier and better maintainable for the app to manage script lifecycles. Other clients like Skua utilize C#, which has better threading capabilities compared to JS and I continuously found it cumbersome to try replicating the same behaviors. For example, we might have a script such as:

```js
await world.join('tercessuinotlim-1e99');
await bot.combat.killForItem('Dark Makai', 'Defeated Makai', 50); // stop here
console.log('got items');
await bot.world.join('nexus-1e99');
```

If we stopped execution somewhere inbetween a task, the rest of the tasks can execute. This can create undesired behavior and makes scripts difficult to manage. While we could simply just "add flags" within tasks, I don't think it's a good scalable solution. We might have our own external functions defined in a script, those would also need to be managed.

Implementation-wise, I am satisfied with the pattern. I think it simplifies most of the abstraction of writing scripts similar to Grimoire. I am still interested in potentially re-evaluating how a scripting api could be implemented, but for now, this is what we have. Feel free to create a PR if you'd like to work on it.

Regarding legacy support, you can technically still load previously-compatible scripts. Through `Bot.getInstance()`, you can access all previously-available api namespaces. Now, there is no hand-holding (async IIFE, globals, etc). Since you have to manage the lifetime yourself, the UI might be desynced with the script state, which could be technically managed yourself since you can access the DOM.

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
