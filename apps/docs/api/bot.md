---
outline: deep
---
# Bot





## Properties

### running <Badge text="getter" />
Whether the bot is running.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

## Methods

### sleep
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| ms | number |  |



**Returns:** `Promise<void>` 

### waitUntil
Waits until the condition is met. This only blocks in the current context.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| condition | Function |  |
| prerequisite | Function \| null |  |
| timeout | number |  |



**Returns:** `Promise<void>` 

### start
Raises the running flag. While this does not start a script, it setups various tasks used during a script's runtime. For example, the auto relogin background task.



**Returns:** `void` 

### stop
Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.



**Returns:** `void` 

### getInstance
Gets the singleton instance of the Bot class.



**Returns:** <code><a href="/api/bot">Bot</a></code> 