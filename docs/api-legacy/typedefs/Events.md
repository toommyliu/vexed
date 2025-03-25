# Events



```typescript
type Events = Events
```

## Fields

| Name | Type | Description |
|------|------|-------------|
| `login` | `() => void` | This event is emitted when the player logs in. |
| `logout` | `() => void` | This event is emitted when the player logs out. |
| `monsterDeath` | `(monMapid: number) => void` | This event is emitted when a monster has died. |
| `monsterRespawn` | `(monster: Monster) => void` | This event is emitted when a monster has respawned. |
| `packetFromClient` | `(packet: string) => void` |  |
| `packetFromServer` | `(packet: string) => void` |  |
| `pext` | `(packet: Record<string, unknown>) => void` | OnExtensionResponse event. |
| `playerJoin` | `(playerName: string) => void` | This event is emitted when a player joins the room. |
| `playerLeave` | `(playerName: string) => void` | This event is emitted when a player leaves the room. |
