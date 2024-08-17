---
title: Flash
outline: deep
---
# Flash

Utilities to make interacting with the Flash api easier.



## Methods

### call
Calls a game function, whether this be an interop function or an internal function. If "fn" is a string, it will be treated as an actionscript path.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| fn | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/function">Function</a></code> | The function to call. |
| args | `...any` | The arguments to pass to the function. |

**Returns:** <code>any | null</code>

If the provided function returned a value, it will be conditionally parsed to a primitive based on its result. Otherwise, null is returned.

### get
Gets an actionscript object at the given location.
| Parameter | Type | Optional | Description |
| --------- | ---- | -------- | ----------- |
| path | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  | The path of the object, relative to Game. |
| parse | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | ✅ | Whether to call JSON.parse on the return value. |

**Returns:** <code>any | null</code>

### getStatic
Gets an actionscript object at the given location
| Parameter | Type | Optional | Description |
| --------- | ---- | -------- | ----------- |
| path | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  | The path of the object, relative to Game. |
| parse | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | ✅ | Whether to call JSON.parse on the return value. |

**Returns:** <code>any | null</code>

### set
Sets an actionscript object at the given location.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| path | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The path of the object, relative to Game. |
| value | `any` | The value to set. |

**Returns:** `void`

### isNull
Determines whether an actionscript path is null.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| path | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The path of the game object. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
