---
outline: deep
---

# Config 

---

### Properties

#### data

Type: `Record<string, string>`

The data stored in the config.

#### fileName

Type: `string`

### Methods

#### get

Get a value from the config.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `key` | `string` |  |  | The key to get the value for. |
| `defaultValue` | `string` | ✓ | `""` |  The default value to return if the key doesn't exist. |

**Returns:** `string`

#### getAll

Get all values from the config.

**Returns:** `Record<string, string>`

#### set

Set a value in the config.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | The key to set. |
| `value` | `string` | The value to set. |

**Returns:** `void`

#### save

Save the config file to disk.

**Returns:** `Promise<void>`

#### load

**Returns:** `Promise<void>`

