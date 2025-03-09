# conditions commands

Conditions check if some condition is not satisifed.
If so, the command preceding the condition is ran, otherwise it will skip past the next command.

For example:

```
cmd.is_equipped('Radiant Goddess Of War')
cmd.goto_label('is equipped') // go to this label if item is equipped
cmd.goto_label('is not equipped') // goto this label if item is not equipped
cmd.label('is equipped')
cmd.log('Radiant Goddess Of War is equipped')
cmd.goto_label('end')
cmd.label('is not equipped')
cmd.log('Radiant Goddess Of War is not equipped')
cmd.label('end')
cmd.stop()
```

## is_cell

```
cmd.is_cell(cell: string)
```

GitHub Copilot: Below is a markdown summary of each command with its usage signature:

## is_cell

```
cmd.is_cell(cell: string)
```

## is_not_cell

```
cmd.is_not_cell(cell: string)
```

## is_equipped

```
cmd.is_equipped(item: string)
```

## is_faction_rank_greater_than

```
cmd.is_faction_rank_greater_than(faction: string, rank: number)
```

## is_faction_rank_less_than

```
cmd.is_faction_rank_less_than(faction: string, rank: number)
```

## is_gold_greater_than

```
cmd.is_gold_greater_than(gold: number)
```

## is_gold_less_than

```
cmd.is_gold_less_than(gold: number)
```

## has_target

```
cmd.has_target()
```

## not_has_target

```
cmd.not_has_target()
```

## is_health_greater_than

```
cmd.is_health_greater_than(hp: number)
```

## is_health_less_than

```
cmd.is_health_less_than(hp: number)
```

## is_in_inventory

```
cmd.is_in_inventory(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_not_in_inventory

```
cmd.is_not_in_inventory(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_in_tempinventory

```
cmd.is_in_tempinventory(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_not_in_tempinventory

```
cmd.is_not_in_tempinventory(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_in_bank

```
cmd.is_in_bank(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_not_in_bank

```
cmd.is_not_in_bank(item: string, quantity?: number)
```

> [!NOTE]
>
> quantity defaults to 1 if not provided.

## is_in_combat

```
cmd.is_in_combat()
```

## is_not_in_combat

```
cmd.is_not_in_combat()
```

## is_in_house

```
cmd.is_in_house(item: string, quantity?: number)
```

## is_not_in_house

```
cmd.is_not_in_house(item: string, quantity?: number)
```

## is_not_equipped

```
cmd.is_not_equipped(item: string)
```

## player_auras_greater_than

```
cmd.player_auras_greater_than(aura: string, value: number)
```

## player_auras_less_than

```
cmd.player_auras_less_than(aura: string, value: number)
```

## player_aura_equals

```
cmd.player_aura_equals(aura: string, value: number)
```

## player_count_greater_than

```
cmd.player_count_greater_than(count: number)
```

## player_count_less_than

```
cmd.player_count_less_than(count: number)
```

## is_player_in_map

```
cmd.is_player_in_map(map: string)
```

## is_player_in_cell

```
cmd.is_player_in_cell(cell: string)
```

## is_player_not_in_map

```
cmd.is_player_not_in_map(name: string)
```

## is_player_not_in_cell

```
cmd.is_player_not_in_cell(cell: string)
```

## can_complete_quest

```
cmd.can_complete_quest(questId: number)
```

## cannot_complete_quest

```
cmd.cannot_complete_quest(questId: number)
```

## is_quest_in_progress

```
cmd.is_quest_in_progress(questId: number)
```

## is_quest_available

```
cmd.is_quest_available(questId: number)
```

## is_quest_not_available

```
cmd.is_quest_not_available(questId: number)
```

## is_quest_not_in_progress

```
cmd.is_quest_not_in_progress(questId: number)
```

## target_health_greater_than

```
cmd.target_health_greater_than(hp: number)
```

## target_health_less_than

```
cmd.target_health_less_than(hp: number)
```

## is_maxed

```
cmd.is_maxed(item: string)
```

## is_not_maxed

```
cmd.is_not_maxed(item: string)
```

## cell_player_count_greater_than

```
cmd.cell_player_count_greater_than(count: number, cell?: string)
```

> [!NOTE]
>
> If no cell is provided, it will default to the player's current cell.

## cell_player_count_less_than

```
cmd.cell_player_count_less_than(count: number, cell?: string)
```

> [!NOTE]
>
> If no cell is provided, it will default to the player's current cell.

## is_member

```
cmd.is_member()
```

## is_not_member

```
cmd.is_not_member()
```

## item_has_dropped

```
cmd.item_has_dropped(item: string)
```

## item_has_not_dropped

```
cmd.item_has_not_dropped(item: string)
```

## is_level

```
cmd.is_level(level: number)
```

## is_level_greater_than

```
cmd.is_level_greater_than(level: number)
```

## is_level_less_than

```
cmd.is_level_less_than(level: number)
```

## is_mana_greater_than

```
cmd.is_mana_greater_than(mana: number)
```

## is_mana_less_than

```
cmd.is_mana_less_than(mana: number)
```

## is_map

```
cmd.is_map(map: string)
```

## is_map_not

```
cmd.is_map_not(map: string)
```

## is_monster_health_greater_than

```
cmd.is_monster_health_greater_than(monster: string, hp: number)
```

## is_monster_health_less_than

```
cmd.is_monster_health_less_than(monster: string, hp: number)
```

## is_monster_in_room

```
cmd.is_monster_in_room(monster: string)
```

## is_monster_not_in_room

```
cmd.is_monster_not_in_room(monster: string)
```

## is_player_name

```
cmd.is_player_name(name: string)
```
