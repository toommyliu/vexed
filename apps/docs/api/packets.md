---
outline: deep
---

# Packets

---

### Properties

#### bot

Type: `Bot`

### Methods

#### sendClient

Sends the specified packet to the client (simulates a response as if the server sent the packet).

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `packet` | `string` |  |  | The packet to send. |
| `type` | `"json" \| "str" \| "xml"` | ✓ | `"str"` | The type of packet. |

**Returns:** `void`

#### sendServer

Sends the specified packet to the server.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `packet` | `string` |  |  | The packet to send. |
| `type` | `"Json" \| "String"` | ✓ | `"String"` | The type of packet. |

**Returns:** `void`

