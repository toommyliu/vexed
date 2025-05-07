# army commands

## cmd.army_init

```ts
cmd.army_init()
```

## cmd.army_set_config

```ts
cmd.army_set_config(fileName: string)
```

## cmd.army_join

```ts
cmd.army_join(map: string, cell: string, pad: string)
```

## cmd.army_kill

```ts
cmd.army_kill(targetName: string, options: Partial<KillOptions>)
```

## cmd.army_kill_for

```ts
cmd.army_kill_for(targetName: string, itemName: string, qty: number, isTemp: boolean, options: Partial<KillOptions>)
```

## cmd.execute_with_army

```ts
cmd.execute_with_army(fn: () => Promise<void>)
```

## cmd.army_equip_item

```ts
cmd.army_equip_item(itemName: string)
```

