---
outline: deep
---

# Scripts

## Executing Scripts

To load a script:

1. Click **Scripts** in the top navigation.
2. Select **Load Script** and choose your file.
3. Once you are logged in, then you can click **Start Script**.
4. At any time, you can click **Stop Script** to abort execution.

A "script" is essentially a DOM `<script>` tag embedded into the page, but it's wrapped with:

- Event listener cleanup
- Async IIFE
- Error handling
- Delayed execution until the player is ready
- Auto-enabling recommended settings (infinite range, lag killer, skip cutscenes, low fps)
- Async execution monitoring

## **Important Notes on Script Loading**

Scripts execute asynchronously, which means operations won't necessarily run in the exact order they appear in the code. Here are key behaviors to understand:

### Event Handler Registration

Event handlers must be registered before any code that depends on them. The script loader executes the main code immediately, while event handlers are processed later in the event loop.

Scripts need an active task to keep running. Without any ongoing operations, a script may terminate before important events like 'start' are emitted. When this happens, the script might complete and terminate before events are emitted and handlers are executed.

**Problematic Example**

```js:line-numbers
// Main code runs immediately
while (bot.isRunning()) { /* code */ }

// Event handler registration is deferred - will never execute
bot.on("start", () => {});
```

**Correct Approach**

```js:line-numbers
// Register handlers first
bot.on("start", () => {});

// Then run dependent code
while (bot.isRunning()) { /* code */ }
```

### Blocking Operations

Long-running synchronous operations can block the event loop, preventing other code from executing.

**Problematic Example**

```js:line-numbers
bot.on("start", () => {
    while (bot.isRunning()) { /* code */ }); // Blocks event loop
    console.log('never reached');
});
console.log('bye'); // Executes immediately
```

**Correct Approach**

```js:line-numbers
while (bot.isRunning()) { /* code */ }); // Consider async alternatives
```

Asynchronous API methods should **always** be awaited to ensure proper execution order. Otherwise, the script will continue executing before the async operation completes.

## Logs

Logs are displayed in the devtools console, which can be accessed through Scripts>Toggle Dev Tools. Note that line numbers might be off due to wrapping of the script.

## View Script Loader Source

See [`FIRST_HALF`](https://github.com/toommyliu/vexed/blob/8619694a139220a56674d1916e3f8449bb69e2a0/apps/electron/src/renderer/game/script.ui.ts#L14) and [ `SECOND_HALF`](https://github.com/toommyliu/vexed/blob/8619694a139220a56674d1916e3f8449bb69e2a0/apps/electron/src/renderer/game/script.ui.ts#L138C7-L138C18)

## Writing Scripts

It's recommended to view the [example scripts](/api/examples/) to get a better understanding of how to write your own scripts.

Because we are essentially running code in the browser, you can use any javascript feature supported by the browser.

`electron 11.5.0` / `chrome 87.0.4280.141`

`node 12.18.3`