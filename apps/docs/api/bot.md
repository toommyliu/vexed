---
title: Bot
outline: deep
---
# Bot
## Properties
### auth


### autoRelogin


### bank


### combat


### drops


### flash


### house


### inventory


### packets


### player


### quests


### settings


### shops


### tempInventory


### timerManager


### world


### running
Whether the bot is "running".




## Methods
### sleep
Blocks the current "thread" for the specified number of milliseconds.


### start
Raises the running flag.

This does not start a script, rather merely declares that a script is running.

For example, the auto relogin background task runs if the bot is running.


### stop
Lowers the running flag.

While this does not stop a script, it removes any background tasks that were set up on start.


### waitUntil
Waits until the condition is met.


### getInstance
Gets the singleton instance of the Bot class.

