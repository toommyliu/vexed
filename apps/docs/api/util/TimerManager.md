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
| `fn` | `Function` | The interval function. |
| `interval` | `number` | The delay between each execution. |

**Returns:** `SetIntervalAsyncTimer<unknown[]>`

#### clearInterval

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `SetIntervalAsyncTimer<unknown[]>` | The interval id. |

**Returns:** `Promise<void>`

#### setTimeout

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | `Function` | The timeout function. |
| `delay` | `number` | The delay before executing the function. |
| `args` | `any[]` | Arguments to pass to the function. |

**Returns:** `number`

#### clearTimeout

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `timeout` | `number` | The timeout id. |

**Returns:** `void`

