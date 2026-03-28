<script lang="ts">
  import {
    Card,
    Checkbox,
    Input,
    Label,
    InputGroup,
    NumberField,
  } from "@vexed/ui";

  type CombatSectionProps = {
    attackPriority: string;
    isEnabled: boolean;
    onAttackPriorityChange(value: string): void;
    onSafeSkillChange(value: number): void;
    onSafeSkillEnabledChange(enabled: boolean): void;
    onSafeSkillHpChange(value: number): void;
    onSkillDelayChange(value: number): void;
    onSkillListChange(value: string): void;
    onSkillWaitChange(checked: boolean): void;
    safeSkill: number;
    safeSkillEnabled: boolean;
    safeSkillHp: number;
    skillDelay: number;
    skillList: string;
    skillWait: boolean;
  };

  const props: CombatSectionProps = $props();
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 shadow-none">
  <Card.Header class="gap-0 border-b border-border/10 p-3 pb-2 pt-2.5">
    <Card.Title class="text-xs font-semibold text-foreground/70"
      >Combat</Card.Title
    >
  </Card.Header>

  <Card.Content class="space-y-4 p-3.5">
    <div class="flex flex-col gap-4 sm:flex-row">
      <div class="flex flex-1 flex-col space-y-1">
        <Label for="skill-list" class="text-xs font-semibold text-foreground/80"
          >Skill List</Label
        >
        <div class="flex items-center gap-3">
          <Input
            type="text"
            id="skill-list"
            size="sm"
            value={props.skillList}
            oninput={(event) =>
              props.onSkillListChange(
                (event.currentTarget as HTMLInputElement).value,
              )}
            placeholder="1,2,3,4"
            disabled={props.isEnabled}
            autocomplete="off"
          />
        </div>
      </div>
      <div class="flex flex-col space-y-1">
        <Label
          for="skill-delay"
          class="text-xs font-semibold text-foreground/80">Skill Delay</Label
        >
        <div class="flex items-center gap-2.5">
          <InputGroup.Root class="h-7 w-24">
            <NumberField.Root
              value={props.skillDelay}
              size="sm"
              onValueChange={(value) => {
                if (!Number.isNaN(value)) props.onSkillDelayChange(value);
              }}
              min={0}
            >
              <NumberField.Input
                id="skill-delay"
                class="h-7 border-0"
                disabled={props.isEnabled}
                autocomplete="off"
              />
            </NumberField.Root>
            <InputGroup.Addon align="inline-end">
              <InputGroup.Text
                class="text-[10px] font-medium text-muted-foreground"
              >
                ms
              </InputGroup.Text>
            </InputGroup.Addon>
          </InputGroup.Root>
          <div class="flex items-center gap-1.5 px-0.5">
            <Checkbox
              id="skill-wait"
              checked={props.skillWait}
              onCheckedChange={(details) =>
                props.onSkillWaitChange(details.checked === true)}
              disabled={props.isEnabled}
            />
            <Label
              for="skill-wait"
              class="cursor-pointer text-xs font-medium text-muted-foreground"
            >
              Wait
            </Label>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y-1">
      <Label
        for="attack-priority"
        class="text-xs font-semibold text-foreground/80">Attack Priority</Label
      >
      <Input
        type="text"
        id="attack-priority"
        size="sm"
        value={props.attackPriority}
        oninput={(event) =>
          props.onAttackPriorityChange(
            (event.currentTarget as HTMLInputElement).value,
          )}
        placeholder="Defense Drone, Attack Drone"
        disabled={props.isEnabled}
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-3 px-0.5">
      <Checkbox
        id="cb-safe-skill"
        checked={props.safeSkillEnabled}
        onCheckedChange={(details) =>
          props.onSafeSkillEnabledChange(details.checked === true)}
        disabled={props.isEnabled}
      />
      <Label
        for="cb-safe-skill"
        class="cursor-pointer text-xs font-medium text-muted-foreground"
      >
        Use skill
      </Label>
      <NumberField.Root
        value={props.safeSkill}
        size="sm"
        onValueChange={(value) => {
          if (!Number.isNaN(value)) props.onSafeSkillChange(value);
        }}
        min={1}
        max={4}
        class="w-12"
      >
        <NumberField.Input
          class="h-7 text-center"
          disabled={props.isEnabled}
          autocomplete="off"
        />
      </NumberField.Root>
      <span class="text-xs text-muted-foreground">when HP &lt;</span>
      <NumberField.Root
        value={props.safeSkillHp}
        size="sm"
        onValueChange={(value) => {
          if (!Number.isNaN(value)) props.onSafeSkillHpChange(value);
        }}
        min={1}
        max={100}
        class="w-12"
      >
        <NumberField.Input
          class="h-7 text-center"
          disabled={props.isEnabled}
          autocomplete="off"
        />
      </NumberField.Root>
      <span class="text-xs text-muted-foreground">%</span>
    </div>
  </Card.Content>
</Card.Root>
