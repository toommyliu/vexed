# combat commands

> [!NOTE]
> - `target` refers to monster name or in the format "id:monMapId" (where `:` can be replaced with any of these delimiters: `'` `.` `-` )
>    - Example formats: `id.1` (left orb) | `id:3` (right orb)
> - `item` can be name or id


## cmd.attack

```ts
cmd.attack(target: string)
```

## cmd.cancel_target

```ts
cmd.cancel_target()
```

## cmd.exit_combat

```ts
cmd.exit_combat()
```

## cmd.kill

```ts
cmd.kill(target: string, options?: KillOptions)
```

> [!NOTE]
> [KillOptions](/api-legacy/typedefs/KillOptions)


## cmd.kill_for_item

```ts
cmd.kill_for_item(target: string, item: number | string, quantity: number, options?: KillOptions)
```

> [!NOTE]
> [KillOptions](/api-legacy/typedefs/KillOptions)


## cmd.kill_for_temp_item

```ts
cmd.kill_for_temp_item(target: string, item: number | string, quantity: number, options?: KillOptions)
```

> [!NOTE]
> [KillOptions](/api-legacy/typedefs/KillOptions)


## cmd.rest

```ts
cmd.rest(full?: boolean = false)
```

## cmd.use_skill

```ts
cmd.use_skill(skill: number | string, wait?: boolean = false)
```

## cmd.force_use_skill

```ts
cmd.force_use_skill(skill: number | string, wait?: boolean = false)
```

---

