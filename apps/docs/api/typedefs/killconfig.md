---
outline: deep
---

# KillConfig

Type: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


## Properties
| Property | Type | Optional | Default | Description |
| -------- | ---- | -------- | ------- | ----------- |
| killPriority | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a>[]</code> | ✅ | [] | An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma. |
| skillSet | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a>[]</code> | ✅ | 1,2,3,4 | The order of skills to use. |
| skillDelay | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | 150 | The delay between each skill cast. |
| skillWait | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | ✅ | false | Whether to wait for the skill to be available. |