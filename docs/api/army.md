# army commands

> [!NOTE]
> Army commands are for advanced users only.


## cmd.army_init

```ts
cmd.army_init()
```

> [!NOTE]
> Must be called before any other army commands to load the config file.
> Recommended to call this right after cmd.army_set_config to load the config asap.


## cmd.army_set_config

```ts
cmd.army_set_config(fileName: string)
```

> [!NOTE]
> Sets the config file to use for armying. The file will be searched in:
> 
> - The app's documents folder (Documents/vexed)
> 
> - The app's storage folder (Documents/vexed/storage)
> 
> Just the filename without the path or extension.


## cmd.army_join

```ts
cmd.army_join(map: string, cell: string, pad: string)
```

> [!NOTE]
> Like [World#join](../api-legacy/World.md#join) but waits for all players to join before proceeding to the next command.


## cmd.army_kill

```ts
cmd.army_kill(targetName: string, options: KillOptions)
```

## cmd.army_kill_for

```ts
cmd.army_kill_for(targetName: string, itemName: string, qty: number, isTemp: boolean, options: KillOptions)
```

> [!NOTE]
> Recommended to pass a custom skillAction function to options when you need granular control for skill casting (should be a closure).
> 
> [bot](../api-legacy/Bot.md) is bounded as the **this** context in the skillAction and closure functions. Note the functions, not arrow functions.
> 
> Note that internally, this wraps [Combat#kill](../api-legacy/Combat.md#kill) but with laxed item checks.
> Therefore, the closure can be re-created every call to kill(), so try and avoid storing sensitive state in the closure.
> 
> ```js
> cmd.army_kill_for(
> 	'Ultra Engineer',
> 	'Ultra Engineer Defeated',
> 	1,
> 	true,
> 	{
> 		skillPriority: ['id.1','id.2']
> 		skillAction() {
> 			let a = []
> 			let i = 0
> 			let h
> 
> 			switch (this.bot.player.className) {
> 			case "LEGION REVENANT":
> 				a=[3,1,2,4,5]
> 				break
> 			case "STONECRUSHER":
> 				a=[1,2,3,4,5]
> 				break
> 			case "LORD OF ORDER":
> 				a=[1,3,4,5]
> 				h=2
> 				break
> 			case "ARCHPALADIN":
> 				a=[1,3,4,5]
> 				h=2
> 			}
> 
> 			return async function() {
> 				for (const plyr /* string */ of this.bot.army.players) {
> 					const p = this.bot.world.players.get(plyr)
> 					if (p.isHpPercentageLessThan(70) && h) {
> 						await this.bot.combat.useSkill(h)
> 						return
> 					}
> 				}
> 
> 				await this.bot.combat.useSkill(a[i])
> 				i = (i + 1) % a.length
> 			}
> 		}
> 	}
> )
> ```


## cmd.execute_with_army

```ts
cmd.execute_with_army(fn: () => Promise<void>)
```

> [!NOTE]
> Executes the given function. Once the function resolves, the player will be marked as done.
> 
> The proceeding command cannot proceed until all players are done.
> 
> The function is called with [bot](../api-legacy/Bot.md) as the first argument.


## cmd.army_equip_item

```ts
cmd.army_equip_item(itemName: string)
```

