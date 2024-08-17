---
title: Settings
outline: deep
---
# Settings

`Provoke Map`: If enabled, tags all monsters in the map.


`Provoke Cell`: If enabled, tags all monsters in the current cell.


`Enemy Magnet`: If enabled, sets the target's position to that of the player.


`Lag Killer`: If enabled, disables rendering of most UI elements.


`Hide Players`: If enabled, hides other players.


`Skip Cutscenes:` If enabled, skips cutscenes as needed.


`Walk Speed`: The player's walk speed.


 Settings are updated in a background interval every 500ms.



## Properties

### infiniteRange<Badge text="getter" /><Badge text="setter" />
The state of "Infinite Range".

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### provokeMap<Badge text="getter" /><Badge text="setter" />
The state of "Provoke Map".

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### provokeCell<Badge text="getter" /><Badge text="setter" />
The state of "Provoke Cell".

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### enemyMagnet<Badge text="getter" /><Badge text="setter" />
The state of "Enemy Magnet".

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### lagKiller<Badge text="getter" /><Badge text="setter" />
Whether "Lag Killer" is enabled.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### hidePlayers<Badge text="getter" /><Badge text="setter" />
Whether "Hide Players" is enabled.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### skipCutscenes<Badge text="getter" /><Badge text="setter" />
Whether "Skip Cutscenes" is enabled.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### walkSpeed<Badge text="getter" /><Badge text="setter" />
The player's walk speed.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

## Methods

### setFPS
Sets the target client FPS.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| fps | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The target fps. |

**Returns:** `void`

### setDeathAds
Sets the visiblity of death ads.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| on | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | If enabled, death ads are shown. |

**Returns:** `void`
