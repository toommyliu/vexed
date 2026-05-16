List of capabilities added/removed/modified in the rewrite:

- TODO: Flash Player no longer bundled.

- Scripting:
  - Removed the legacy command DSL (`cmd.*`). Scripts now export a CommonJS generator function and receive a script context:
    ```js
    module.exports = function* run({ api, script, autoZone, autoRelogin }) {
      script.log("started")
      yield* api.player.joinMap("battleon")
    }
    ```
  - Script actions are now grouped under explicit API namespaces such as `api.player`, `api.combat`, `api.inventory`, `api.quests`, `api.army`, `api.settings`, and `api.world`.
  - High-level helpers that used to be convenience commands now live under `api.recipes`, for example `api.recipes.buff()`, `api.recipes.goToHouse()`, `api.recipes.ensureLifeSteal()`, and `api.recipes.ensureScrollOfEnrage()`.
  - Current-script helpers live under `script`, for example `script.log(...)`, `script.sleep(...)`, `script.stop(...)`, and `script.signal`.
  - Feature controls are scriptable through context objects instead of commands, for example `autoZone.enable()`, `autoZone.setMap(...)`, `autoRelogin.enable()`, and `autoRelogin.setServer(...)`.
  - Control flow is now plain JavaScript (`if`, `while`, functions, loops) instead of label/goto/conditional command blocks.
  - Custom script logic should be regular JavaScript functions/generators composed with `yield* api...` calls; custom command registration/subclassing is no longer part of the scripting model.

- AutoRelogin: removed fallback server.
