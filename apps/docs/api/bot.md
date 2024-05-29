---
outline: deep
---

# Bot

The bot instance. 

There isn't anything special about the class, it's really only used to manage control flow across the API. The class follows the singleton pattern, you should never be constructing an instance whatsoever.

## Static methods

### Bot#getInstance()

```js
/**
 * Returns the bot singleton.
 * @returns {Bot}
*/
Bot.getInstance();
```

## Instance methods

### Bot#sleep

```js
/**
 * Pauses execution for a certain period of time.
 * @param {number} ms The time to wait for
 * @returns {Promise<void>}
*/
await bot.sleep(ms)
```

### Bot#waitUntil
```js
/**
 * Pauses execution until the predicate is truthy.
 * This is guaranteed to yield atleast 1 second.
 * @param {() => bool} predicate The function to check against.
 * @returns {Promise<void>}
*/
await bot.waitUntil(predicate);
```