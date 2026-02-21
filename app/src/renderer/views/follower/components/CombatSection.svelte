<script lang="ts">
  import { Card, Checkbox, Input, Label } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import * as NumberField from "@vexed/ui/NumberField";
  import { cn } from "@vexed/ui/util";

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

<Card.Root class="border-border/40 gap-0 overflow-hidden py-0">
  <Card.Header
    class="border-border/20 relative flex flex-row items-center space-y-0 border-b px-4 py-2"
  >
    <div
      class="bg-primary/50 absolute bottom-3 left-0 top-3 w-0.5 rounded-full"
    ></div>
    <h2 class="text-foreground/80 text-sm font-medium">Combat</h2>
  </Card.Header>
  <Card.Content class="space-y-4 p-5">
    <div class="flex gap-4">
      <div class="flex flex-1 flex-col space-y-1.5">
        <Label for="skill-list" class="text-muted-foreground">Skill List</Label>
        <div class="flex items-center gap-3">
          <Input
            type="text"
            id="skill-list"
            value={props.skillList}
            oninput={(event) =>
              props.onSkillListChange((event.currentTarget as HTMLInputElement).value)}
            placeholder="1,2,3,4"
            class={cn(
              "bg-secondary/50 border-border/50 focus:bg-background w-auto min-w-0 flex-1 transition-colors",
              props.isEnabled && "pointer-events-none opacity-50",
            )}
            disabled={props.isEnabled}
            autocomplete="off"
          />
        </div>
      </div>
      <div class="flex flex-col space-y-1.5">
        <Label for="skill-delay" class="text-muted-foreground">Skill Delay</Label>
        <div class="flex items-center gap-3">
          <InputGroup.Root
            class="bg-secondary/50 border-border/50 focus-within:bg-background h-8 w-28 transition-colors"
          >
            <NumberField.Root
              value={props.skillDelay}
              onValueChange={(value) => {
                if (!Number.isNaN(value)) props.onSkillDelayChange(value);
              }}
              min={0}
            >
              <NumberField.Input
                id="skill-delay"
                class={cn(
                  "h-8 border-0 bg-transparent",
                  props.isEnabled && "pointer-events-none opacity-50",
                )}
                disabled={props.isEnabled}
                autocomplete="off"
              />
            </NumberField.Root>
            <InputGroup.Addon align="inline-end">
              <InputGroup.Text class="text-muted-foreground text-xs font-medium">
                ms
              </InputGroup.Text>
            </InputGroup.Addon>
          </InputGroup.Root>
          <div class="flex items-center gap-2">
            <Checkbox
              id="skill-wait"
              checked={props.skillWait}
              onCheckedChange={(checked) => props.onSkillWaitChange(checked === true)}
              disabled={props.isEnabled}
            />
            <Label for="skill-wait" class="text-muted-foreground cursor-pointer text-sm">
              Wait
            </Label>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y-1.5">
      <Label for="attack-priority" class="text-muted-foreground">Attack Priority</Label>
      <Input
        type="text"
        id="attack-priority"
        value={props.attackPriority}
        oninput={(event) =>
          props.onAttackPriorityChange((event.currentTarget as HTMLInputElement).value)}
        placeholder="Defense Drone, Attack Drone"
        class={cn(
          "bg-secondary/50 border-border/50 focus:bg-background transition-colors",
          props.isEnabled && "pointer-events-none opacity-50",
        )}
        disabled={props.isEnabled}
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-3">
      <Checkbox
        id="cb-safe-skill"
        checked={props.safeSkillEnabled}
        onCheckedChange={(checked) => props.onSafeSkillEnabledChange(checked === true)}
        disabled={props.isEnabled}
      />
      <Label for="cb-safe-skill" class="text-muted-foreground cursor-pointer text-sm">
        Use skill
      </Label>
      <NumberField.Root
        value={props.safeSkill}
        onValueChange={(value) => {
          if (!Number.isNaN(value)) props.onSafeSkillChange(value);
        }}
        min={1}
        max={4}
        class="w-14"
      >
        <NumberField.Input
          class={cn(
            "bg-secondary/50 border-border/50 focus:bg-background h-8 text-center transition-colors",
            props.isEnabled && "pointer-events-none opacity-50",
          )}
          disabled={props.isEnabled}
          autocomplete="off"
        />
      </NumberField.Root>
      <span class="text-muted-foreground text-sm">when HP &lt;</span>
      <NumberField.Root
        value={props.safeSkillHp}
        onValueChange={(value) => {
          if (!Number.isNaN(value)) props.onSafeSkillHpChange(value);
        }}
        min={1}
        max={100}
        class="w-14"
      >
        <NumberField.Input
          class={cn(
            "bg-secondary/50 border-border/50 focus:bg-background h-8 text-center transition-colors",
            props.isEnabled && "pointer-events-none opacity-50",
          )}
          disabled={props.isEnabled}
          autocomplete="off"
        />
      </NumberField.Root>
      <span class="text-muted-foreground text-sm">%</span>
    </div>
  </Card.Content>
</Card.Root>
