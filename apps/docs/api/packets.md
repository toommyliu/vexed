---
title: Packets
outline: deep
---
# Packets





## Methods

### sendClient
Sends the specified packet to the client (simulates a response as if the server sent the packet).
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| packet | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |  | The packet to send. |
| type | `"str"`\|`"json"`\|`"xml"` | ✅ | str | The type of packet. |

**Returns:** `void`

### sendServer
Sends the specified packet to the server.
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| packet | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |  | The packet to send. |
| type | `"String"`\|`"Json"` | ✅ | String | The type of packet. |

**Returns:** `void`
