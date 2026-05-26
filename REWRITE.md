List of capabilities added/removed/modified in the rewrite:

- TODO: Flash Player no longer bundled.

- Scripting:
  - Removed the legacy command DSL (`cmd.*`). Scripts now export a CommonJS generator function and import the script API facade:
    ```js
    const { features, script, api } = require("vexed")

    module.exports = function* run() {
      script.log("started")
      yield* api.player.joinMap("battleon")
    }
    ```
  - Script actions are now grouped under explicit API namespaces such as `api.player`, `api.combat`, `api.inventory`, `api.quests`, `api.army`, `api.settings`, and `api.world`.
  - High-level helpers that used to be convenience commands now live under `api.recipes`, for example `api.recipes.buff()`, `api.recipes.goToHouse()`, `api.recipes.ensureLifeSteal()`, and `api.recipes.ensureScrollOfEnrage()`.
  - Current-script helpers live under `script`, for example `script.log(...)`, `script.sleep(...)`, `script.stop(...)`, and `script.signal`.
  - Feature controls are scriptable through `features` instead of commands, for example `features.autoZone.enable()`, `features.autoZone.setMap(...)`, `features.autoRelogin.enable()`, and `features.autoRelogin.setServer(...)`.
  - Control flow is now plain JavaScript (`if`, `while`, functions, loops) instead of label/goto/conditional command blocks.
  - Custom script logic should be regular JavaScript functions/generators composed with `yield* api...` calls; custom command registration/subclassing is no longer part of the scripting model.

- AutoRelogin: removed fallback server.
- Combine Packet Logger and Spammer windows.
- Follower / auto attack: introduce Combat Profiles.
- Account Manager: introduce Groups.
- 
