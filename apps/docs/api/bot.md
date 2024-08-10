# AbortController



## Properties

### running
<p>Whether the bot is &quot;running&quot;.</p>


Return type: boolean

## Methods

### sleep(ms: number)


Return type: GENERIC

### start()
Raises the running flag. While this does not start a script, it setups various tasks used during a
script's runtime. For example, the auto relogin background task.


Return type: void

### stop()
Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.


Return type: void

### getInstance()
Gets the singleton instance of the Bot class.


Return type: Bot