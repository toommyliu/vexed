# conditions commands

Conditions check if the statement is truthy or falsy. Given the command, it will skip past the next command if it is not met.

For example:

```
cmd.is_equipped('Radiant Goddess Of War')
cmd.goto_label('is equipped') // block to run if rgow is equipped
cmd.goto_label('is not equipped') // block to run if rgow is not equipped
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

## is_health_greater_than

```
cmd.is_health_greater_than(hp: number)
```

## is_health_less_than

```
cmd.is_health_less_than(hp: number)
```

## is_in_bank

```
cmd.is_in_bank(item: string, quantity?: number)
```

## is_in_combat

```
cmd.is_in_combat()
```

## is_in_house

```
cmd.is_in_house(item: string, quantity?: number)
```

## not_equipped

```
cmd.not_equipped(item: string)
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
