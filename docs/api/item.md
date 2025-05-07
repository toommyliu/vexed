# item commands

## cmd.buy_item

```ts
cmd.buy_item(shopId: number, item: number | string, quantity: number)
```

## cmd.deposit

```ts
cmd.deposit(item: number | string)
```

## cmd.get_map_item

```ts
cmd.get_map_item(item: number | string)
```

## cmd.pickup

```ts
cmd.pickup(item: number | string)
```

## cmd.reject

```ts
cmd.reject(item: number | string)
```

## cmd.sell_item

```ts
cmd.sell_item(item: string)
```

## cmd.swap

```ts
cmd.swap(bankItem: number | string, invItem: number | string)
```

## cmd.withdraw

```ts
cmd.withdraw(item: number | string)
```

## cmd.register_drop

```ts
cmd.register_drop(item: string)
```

> [!NOTE]
> drops should be registered as soon as possible and must be the full name of the drop.


## cmd.unregister_drop

```ts
cmd.unregister_drop(item: string)
```

## cmd.register_boost

```ts
cmd.register_boost(item: string)
```

> [!NOTE]
> Boosts should be registered as soon as possible and must be the full name of the boost.


## cmd.unregister_boost

```ts
cmd.unregister_boost(item: string)
```

> [!NOTE]
> Boosts should be registered as soon as possible and must be the full name of the boost.


## cmd.equip_item

```ts
cmd.equip_item(item: string)
```

