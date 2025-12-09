<script lang="ts">
  import { Button, Input, Checkbox, Label } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import { cn } from "@vexed/ui/util";
  import UserRoundSearch from "lucide-svelte/icons/user-round-search";
  import Swords from "lucide-svelte/icons/swords";
  import Shield from "lucide-svelte/icons/shield";
  import Play from "lucide-svelte/icons/play";
  import Pause from "lucide-svelte/icons/pause";
  import Target from "lucide-svelte/icons/target";
  import Footprints from "lucide-svelte/icons/footprints";
  import Timer from "lucide-svelte/icons/timer";

  import { client, handlers } from "@shared/tipc";

  let playerName = $state("");
  let skillList = $state("1,2,3,4");
  let skillWait = $state(false);
  let skillDelay = $state(150);
  let isEnabled = $state(false);
  let safeSkillEnabled = $state(false);
  let safeSkill = $state(2);
  let safeSkillHp = $state(60);
  let attackPriority = $state("");
  let copyWalk = $state(false);
  let antiCounter = $state(false);

  async function fillMe() {
    const me = await client.follower.me();
    if (me) playerName = me;
  }

  $effect(() => {
    if (isEnabled) {
      void client.follower.start({
        name: playerName,
        safeSkill: String(safeSkill),
        skillList: skillList,
        skillWait,
        skillDelay: String(skillDelay),
        safeSkillEnabled,
        safeSkillHp: String(safeSkillHp),
        attackPriority,
        copyWalk,
        antiCounter,
      });
    } else {
      void client.follower.stop();
    }
  });

  handlers.game.gameReloaded.listen(() => (isEnabled = false));
</script>

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Follower
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant={isEnabled ? "destructive" : "default"}
          class="gap-2"
          onclick={() => (isEnabled = !isEnabled)}
          disabled={!playerName}
        >
          {#if isEnabled}
            <Pause class="h-4 w-4" />
            <span class="hidden sm:inline">Stop</span>
          {:else}
            <Play class="h-4 w-4" />
            <span class="hidden sm:inline">Start</span>
          {/if}
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <UserRoundSearch class="h-4 w-4 text-muted-foreground" />
            <h2 class="text-sm font-medium text-foreground">Target</h2>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label for="input-player" class="text-muted-foreground">Player Name</Label>
              <div class="flex gap-2">
                <Input
                  type="text"
                  id="input-player"
                  bind:value={playerName}
                  placeholder="Enter player name to follow"
                  class={cn(
                    "bg-secondary/50 border-border/50 focus:bg-background transition-colors",
                    isEnabled && "pointer-events-none opacity-50"
                  )}
                  disabled={isEnabled}
                  autocomplete="off"
                />
                <Button
                  variant="outline"
                  size="default"
                  class="shrink-0 border-border/50"
                  onclick={fillMe}
                  disabled={isEnabled}
                >
                  Me
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <Swords class="h-4 w-4 text-muted-foreground" />
            <h2 class="text-sm font-medium text-foreground">Combat</h2>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label for="skill-list" class="text-muted-foreground">Skill List</Label>
              <div class="flex items-center gap-3">
                <Input
                  type="text"
                  id="skill-list"
                  bind:value={skillList}
                  placeholder="1,2,3,4"
                  class={cn(
                    "bg-secondary/50 border-border/50 focus:bg-background transition-colors",
                    isEnabled && "pointer-events-none opacity-50"
                  )}
                  disabled={isEnabled}
                  autocomplete="off"
                />
                <div class="flex items-center gap-2">
                  <Checkbox
                    id="skill-wait"
                    bind:checked={skillWait}
                    disabled={isEnabled}
                  />
                  <Label for="skill-wait" class="text-sm text-muted-foreground cursor-pointer">
                    Wait
                  </Label>
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <Label for="skill-delay" class="text-muted-foreground">Skill Delay</Label>
              <InputGroup.Root class="bg-secondary/50 border-border/50 focus-within:bg-background transition-colors">
                <InputGroup.Addon>
                  <Timer class="h-4 w-4 text-muted-foreground" />
                </InputGroup.Addon>
                <Input
                  type="number"
                  id="skill-delay"
                  bind:value={skillDelay}
                  min={0}
                  class={cn(isEnabled && "pointer-events-none opacity-50")}
                  disabled={isEnabled}
                  autocomplete="off"
                />
                <InputGroup.Addon>
                  <InputGroup.Text class="text-xs font-medium text-muted-foreground">
                    ms
                  </InputGroup.Text>
                </InputGroup.Addon>
              </InputGroup.Root>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <Shield class="h-4 w-4 text-muted-foreground" />
            <h2 class="text-sm font-medium text-foreground">Safe Skill</h2>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <Checkbox
                id="cb-safe-skill"
                bind:checked={safeSkillEnabled}
                disabled={isEnabled}
              />
              <Label for="cb-safe-skill" class="text-sm text-muted-foreground cursor-pointer">
                Use skill 
              </Label>
              <Input
                type="number"
                bind:value={safeSkill}
                min={1}
                max={4}
                class={cn(
                  "w-16 bg-secondary/50 border-border/50 text-center focus:bg-background transition-colors",
                  isEnabled && "pointer-events-none opacity-50"
                )}
                disabled={isEnabled}
                autocomplete="off"
              />
              <span class="text-sm text-muted-foreground">when HP &lt;</span>
              <Input
                type="number"
                bind:value={safeSkillHp}
                min={1}
                max={100}
                class={cn(
                  "w-16 bg-secondary/50 border-border/50 text-center focus:bg-background transition-colors",
                  isEnabled && "pointer-events-none opacity-50"
                )}
                disabled={isEnabled}
                autocomplete="off"
              />
              <span class="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-border/50 bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <Target class="h-4 w-4 text-muted-foreground" />
            <h2 class="text-sm font-medium text-foreground">Options</h2>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <Label for="attack-priority" class="text-muted-foreground">Attack Priority</Label>
              <Input
                type="text"
                id="attack-priority"
                bind:value={attackPriority}
                placeholder="Defense Drone, Attack Drone"
                class={cn(
                  "bg-secondary/50 border-border/50 focus:bg-background transition-colors",
                  isEnabled && "pointer-events-none opacity-50"
                )}
                disabled={isEnabled}
                autocomplete="off"
              />
            </div>

            <div class="flex flex-wrap gap-x-6 gap-y-3">
              <div class="flex items-center gap-2">
                <Checkbox
                  id="copy-walk"
                  bind:checked={copyWalk}
                  disabled={isEnabled}
                />
                <Label for="copy-walk" class="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5">
                  <Footprints class="h-3.5 w-3.5" />
                  Copy Walk
                </Label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox
                  id="cb-anti-counter"
                  bind:checked={antiCounter}
                  disabled={isEnabled}
                />
                <Label for="cb-anti-counter" class="text-sm text-muted-foreground cursor-pointer">
                  Anti Counter
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
