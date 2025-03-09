# combat commands

> [!NOTE]
>
> - `target` refers to monster name or in the format "id:monMapId" (where `:` can be replaced with any of these delimiters: `'` `.` `-` )
> - Example formats: `id.1` (left orb) | `id:3` (right orb)

## attack

```
cmd.attack(target: string)
```

## cancel_target

```
cmd.cancel_target()
```

## exit_combat

```
cmd.exit_combat()
```

## kill

```
cmd.kill(target: string, options?: KillOptions)
```

> [!NOTE]
>
> [KillOptions](../../api-legacy/typedefs/KillOptions)

## kill_for_item

```
cmd.kill_for_item(target: string, item: number | string, quantity: number, options?: KillOptions)
```

> [!NOTE]
> item can be item name or id
>
> [KillOptions](../../api-legacy/typedefs/KillOptions)

## kill_for_temp_item

```
cmd.kill_for_temp_item(target: string, item: number | string, quantity: number, options?: KillOptions)
```

> [!NOTE]
> item can be item name or id
>
> [KillOptions](../../api-legacy/typedefs/KillOptions)

## rest

```
cmd.rest()
```

## use_skill

```
cmd.use_skill(skill: number | string)
```

> [!TIP]
> skill index as a string or number (0-5)
