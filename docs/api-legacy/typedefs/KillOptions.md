# KillOptions



```typescript
type KillOptions = KillOptions
```

## Fields

| Name | Type | Description |
|------|------|-------------|
| `killPriority` | `string \| string[]` | An ascending list of monster names or monMapIDs to kill. This can also be a string of monsterResolvables deliminted by a comma. |
| `skillAction` | `(() => () => Promise<void>) \| null` | Custom skill action function. If provided, the skillSet and skillDelay will be ignored.
Recommended to be a closure function. |
| `skillDelay` | `number` | The delay between each skill cast. |
| `skillSet` | `number[]` | The order of skills to use. |
| `skillWait` | `boolean` | Whether to wait for the skill to be available before casting. |
