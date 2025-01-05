---
outline: deep
---

# SetIntervalAsyncTimer

---

# TimerManager

Manager for timers and intervals.

---

### Methods

#### setInterval

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | Function | The interval function. |
| `interval` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The delay between each execution. |

**Returns:** SetIntervalAsyncTimer<unknown[]>

#### clearInterval

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | SetIntervalAsyncTimer<unknown[]> | The interval id. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### setTimeout

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | Function | The timeout function. |
| `delay` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The delay before executing the function. |
| `args` | any[] | Arguments to pass to the function. |

**Returns:** [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### clearTimeout

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `timeout` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The timeout id. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

