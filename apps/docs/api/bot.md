---
outline: deep
---
# Bot



## Properties

### running
*Getter*

Whether the bot is running.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

## Methods

### sleep
Signature: `sleep(ms: number)`



Return type: `Promise<void>`

### waitUntil
Signature: `waitUntil(condition: Function, prerequisite: Function | null, timeout: number)`

Waits until the condition is met. This only blocks in the current context.


Return type: `Promise<void>`

### start
Signature: `start()`

Raises the running flag. While this does not start a script, it setups various tasks used during a script's runtime. For example, the auto relogin background task.


Return type: `void`

### stop
Signature: `stop()`

Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.


Return type: `void`

### getInstance
Signature: `getInstance()`

Gets the singleton instance of the Bot class.


Return type: <code><a href="/api/bot">Bot</a></code>