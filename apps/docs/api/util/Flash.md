---
outline: deep
---

# Flash

Utilities to make interacting with the Flash api easier.

---

### Methods

#### call

Calls a game function, whether this be an interop function or an internal function. If "fn" is a string, it will be treated as an actionscript path.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| Function | The function to call. |
| `args` | any[] | The arguments to pass to the function. |

**Returns:** T

#### get

Gets an actionscript object at the given location.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `path` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The path of the object, relative to Game. |
| `parse` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to call JSON.parse on the return value. |

**Returns:** T | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### getStatic

Gets an actionscript object at the given location.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `path` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The path of the object, relative to Game. |
| `parse` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` |  Whether to call JSON.parse on the return value. |
| `defaultValue` | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) | ✓ | `null` |  |

**Returns:** T | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### set

Sets an actionscript object at the given location.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `path` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The path of the object, relative to Game. |
| `value` | any | The value to set. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### isNull

Determines whether an actionscript path is null.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `path` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The path of the game object. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

