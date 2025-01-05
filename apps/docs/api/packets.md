---
outline: deep
---

# Packets

---

### Properties

#### bot

Type: [Bot](.Bot.md)

### Methods

#### sendClient

Sends the specified packet to the client (simulates a response as if the server sent the packet).

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `packet` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The packet to send. |
| `type` | "json" \| "str" \| "xml" | ✓ | `"str"` | The type of packet. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### sendServer

Sends the specified packet to the server.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `packet` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The packet to send. |
| `type` | "Json" \| "String" | ✓ | `"String"` | The type of packet. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

