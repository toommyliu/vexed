<script lang="ts">
  import { Button, Icon } from "@vexed/ui";
  import CombatSection from "./components/CombatSection.svelte";
  import TargetSection from "./components/TargetSection.svelte";
  import { onMount } from "svelte";

  import type { RawFollowerConfig } from "~/shared/follower/types";
  import {
    DEFAULT_FOLLOWER_SAFE_SKILL_HP,
    DEFAULT_FOLLOWER_SKILL_DELAY,
    DEFAULT_FOLLOWER_SKILL_LIST,
  } from "~/shared/follower/constants";
  import { client, handlers } from "~/shared/tipc";

  let playerName = $state("");
  let skillList = $state(DEFAULT_FOLLOWER_SKILL_LIST.join(","));
  let skillWait = $state(false);
  let skillDelay = $state(DEFAULT_FOLLOWER_SKILL_DELAY);
  let isEnabled = $state(false);
  let safeSkillEnabled = $state(false);
  let safeSkill = $state(2);
  let safeSkillHp = $state(DEFAULT_FOLLOWER_SAFE_SKILL_HP);
  let attackPriority = $state("");
  let copyWalk = $state(false);

  function buildStartPayload(): RawFollowerConfig {
    return {
      attackPriority,
      copyWalk,
      name: playerName,
      safeSkill: String(safeSkill),
      safeSkillEnabled,
      safeSkillHp: String(safeSkillHp),
      skillDelay: String(skillDelay),
      skillList,
      skillWait,
    };
  }

  async function fillMe() {
    const me = await client.follower.me();
    if (me) playerName = me;
  }

  function startFollower() {
    if (isEnabled || playerName.trim() === "") return;
    isEnabled = true;
    void client.follower.start(buildStartPayload()).catch((error) => {
      isEnabled = false;
      console.error("Failed to start follower", error);
    });
  }

  function stopFollower() {
    isEnabled = false;
    void client.follower.stop().catch((error) => {
      console.error("Failed to stop follower", error);
    });
  }

  function toggleFollower() {
    if (isEnabled) {
      stopFollower();
    } else {
      startFollower();
    }
  }

  onMount(() => {
    handlers.game.gameReloaded.listen(() => {
      stopFollower();
    });

    return () => {
      if (isEnabled) void client.follower.stop();
    };
  });
</script>

<div class="flex h-screen flex-col bg-background">
  <header
    class="elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-semibold tracking-tight text-foreground">
          Follower
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant={isEnabled ? "destructive" : "default"}
          class="gap-2"
          onclick={toggleFollower}
          disabled={!playerName.trim()}
        >
          {#if isEnabled}
            <Icon icon="pause" size="md" />
            <span class="hidden sm:inline">Stop</span>
          {:else}
            <Icon icon="play" size="md" />
            <span class="hidden sm:inline">Start</span>
          {/if}
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TargetSection
          {playerName}
          {copyWalk}
          {isEnabled}
          onFillMe={fillMe}
          onPlayerNameChange={(value) => (playerName = value)}
          onCopyWalkChange={(checked) => (copyWalk = checked)}
        />

        <CombatSection
          {skillList}
          {skillWait}
          {skillDelay}
          {attackPriority}
          {safeSkillEnabled}
          {safeSkill}
          {safeSkillHp}
          {isEnabled}
          onSkillListChange={(value) => (skillList = value)}
          onSkillWaitChange={(checked) => (skillWait = checked)}
          onSkillDelayChange={(value) => (skillDelay = value)}
          onAttackPriorityChange={(value) => (attackPriority = value)}
          onSafeSkillEnabledChange={(checked) => (safeSkillEnabled = checked)}
          onSafeSkillChange={(value) => (safeSkill = value)}
          onSafeSkillHpChange={(value) => (safeSkillHp = value)}
        />
      </div>
    </div>
  </main>
</div>
