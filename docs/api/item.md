# item commands

> [!NOTE]
>
> item params that are type `number | string` can be either item name or item id

## add_drop

Adds an item to background drop list, which automatically manages picking up.

```
cmd.add_drop(item: string)
```

## remove_drop

Removes an item from background drop list.

```
cmd.remove_drop(item: string)
```

## buy_item

```

cmd.buy_item(shopId: number, item: number | string, quantity: number)

```

## deposit

```

cmd.deposit(item: number | string)

```

## get_map_item

```

cmd.get_map_item(item: number | string)

```

## pickup

```

cmd.pickup(item: number | string)

```

## reject

```

cmd.reject(item: number | string)

```

## sell_item

```

cmd.sell_item(item: string)

```

## swap

```

cmd.swap(bankItem: number | string, invItem: number | string)

```

## withdraw

```

cmd.withdraw(item: number | string)

```
