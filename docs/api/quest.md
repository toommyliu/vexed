# quest commands

## accept_quest

```
cmd.accept_quest(questId: number)
```

## complete_quest

```
cmd.complete_quest(questId: number)
```

## register_quest

Adds a quest to the background quest list, which automatically manages accepting and completing the quest when available.

```
cmd.register_quest(questId: number)
```

> [!NOTE]
>
> `questId` should be registered as soon as possible.

## unregister_quest

Removes a quest from the background list.

```
cmd.unregister_quest(questId: number)
```

> [!NOTE]
>
> `questId` should be registered as soon as possible.
