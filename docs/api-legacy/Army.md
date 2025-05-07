---
outline: deep
---

# Army 

---

### Properties

#### config

Type: `Config`

The config file for this group.

#### players

Type: `Set<string>`

The players in this group.

#### roomNumber

Type: `string`

The room number to join.

#### isInitialized

Type: `boolean`

Whether the army is initialized.

#### bot

Type: `Bot`

### Methods

#### setConfigName

Sets the config file name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fileName` | `string` | The name of the config file. |

**Returns:** `void`

#### init

Initializes everything needed to begin armying.

**Returns:** `Promise<void>`

#### isLeader

Whether this player is the leader of the army.

**Returns:** `boolean`

#### waitForAll

Waits for all players in the army in the map.

**Returns:** `Promise<void>`

#### getPlayerNumber

Gets the player number position in the army.

**Returns:** `number`

