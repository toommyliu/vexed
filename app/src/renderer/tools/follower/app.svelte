<script lang="ts">
  import { client, handlers } from "../../../shared/tipc";
  import { cn } from "../../../shared/cn";

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
  let questIds = $state("");
  let dropItems = $state("");
  let rejectElse = $state(false);

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
        quests: questIds,
        drops: dropItems,
        rejectElse,
      });
    } else {
      void client.follower.stop();
    }
  });

  handlers.game.gameReloaded.listen(() => (isEnabled = false));
</script>

<main
  class="m-0 flex min-h-screen flex-col overflow-hidden bg-background-primary text-white focus:outline-none"
>
  <div class="flex flex-1 items-center justify-center p-4">
    <div class="w-full space-y-6 px-2 sm:px-4">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div
          class="rounded-md border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
        >
          <div class="space-y-4">
            <div class="space-y-3">
              <label
                for="input-player"
                class="block text-sm font-medium text-gray-300"
              >
                Player
              </label>
              <div class="flex space-x-2">
                <input
                  type="text"
                  id="input-player"
                  bind:value={playerName}
                  placeholder="Enter player name to follow"
                  class={cn(
                    "flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <button
                  class={cn(
                    "rounded-md border border-gray-700/50 bg-gray-800/50 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-700/50",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  onclick={fillMe}
                  disabled={isEnabled}
                >
                  Me
                </button>
              </div>
            </div>

            <div class="space-y-3">
              <label
                for="skill-list"
                class="block text-sm font-medium text-gray-300"
              >
                Skill List
              </label>
              <div class="flex items-center space-x-3">
                <input
                  type="text"
                  id="skill-list"
                  bind:value={skillList}
                  class={cn(
                    "flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skill-wait"
                    bind:checked={skillWait}
                    class={cn(
                      "rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20",
                      isEnabled &&
                        "pointer-events-none cursor-not-allowed opacity-50",
                    )}
                    disabled={isEnabled}
                  />
                  <label for="skill-wait" class="text-sm text-gray-300"
                    >Wait</label
                  >
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <label
                for="skill-delay"
                class="block text-sm font-medium text-gray-300"
              >
                Skill Delay
              </label>
              <div class="flex items-center space-x-2">
                <input
                  type="number"
                  id="skill-delay"
                  bind:value={skillDelay}
                  min="0"
                  class={cn(
                    "flex-1 rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <span class="text-sm text-gray-400">ms</span>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cb-enable"
                bind:checked={isEnabled}
                class="rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <label for="cb-enable" class="text-sm font-medium text-gray-300">
                Enabled
              </label>
            </div>
          </div>
        </div>

        <div
          class="rounded-md border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
        >
          <div class="space-y-4">
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cb-safe-skill"
                  bind:checked={safeSkillEnabled}
                  class={cn(
                    "rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <label for="cb-safe-skill" class="text-sm text-gray-300">
                  Use safe skill
                </label>
                <input
                  type="number"
                  bind:value={safeSkill}
                  min="1"
                  max="4"
                  class={cn(
                    "w-16 rounded-md border border-gray-700/50 bg-background-secondary px-2 py-1 text-center text-white transition-all duration-200 focus:border-blue-500/50 focus:outline-none",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <span class="text-sm text-gray-400">when HP &lt;</span>
                <input
                  type="number"
                  bind:value={safeSkillHp}
                  min="1"
                  max="100"
                  class={cn(
                    "w-16 rounded-md border border-gray-700/50 bg-background-secondary px-2 py-1 text-center text-white transition-all duration-200 focus:border-blue-500/50 focus:outline-none",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <span class="text-sm text-gray-400">%</span>
              </div>
            </div>

            <div class="space-y-3">
              <label
                for="attack-priority"
                class="block text-sm font-medium text-gray-300"
              >
                Attack Priority
              </label>
              <input
                type="text"
                id="attack-priority"
                bind:value={attackPriority}
                placeholder="Defense Drone, Attack Drone"
                class={cn(
                  "w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  isEnabled &&
                    "pointer-events-none cursor-not-allowed opacity-50",
                )}
                disabled={isEnabled}
              />
            </div>

            <div class="flex flex-wrap space-x-4">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="copy-walk"
                  bind:checked={copyWalk}
                  class={cn(
                    "rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <label for="copy-walk" class="text-sm text-gray-300"
                  >Copy Walk</label
                >
              </div>
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cb-anti-counter"
                  bind:checked={antiCounter}
                  class={cn(
                    "rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <label for="cb-anti-counter" class="text-sm text-gray-300"
                  >Anti Counter</label
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="rounded-md border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
        >
          <div class="space-y-4">
            <h2 class="text-lg font-medium text-white">Quest List</h2>
            <textarea
              bind:value={questIds}
              placeholder="4432, 4433, 4434"
              class={cn(
                "min-h-[120px] w-full resize-y rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                isEnabled &&
                  "pointer-events-none cursor-not-allowed opacity-50",
              )}
              disabled={isEnabled}
            ></textarea>
          </div>
        </div>

        <div
          class="rounded-md border border-gray-800/50 bg-background-secondary p-6 backdrop-blur-sm"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-white">Drops</h2>
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reject-else"
                  bind:checked={rejectElse}
                  class={cn(
                    "rounded border-gray-700/50 bg-gray-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    isEnabled &&
                      "pointer-events-none cursor-not-allowed opacity-50",
                  )}
                  disabled={isEnabled}
                />
                <label for="reject-else" class="text-sm text-gray-300"
                  >Reject Else</label
                >
              </div>
            </div>
            <textarea
              bind:value={dropItems}
              placeholder="Item 1, Item 2, Item 3"
              class={cn(
                "min-h-[120px] w-full resize-y rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                isEnabled &&
                  "pointer-events-none cursor-not-allowed opacity-50",
              )}
              disabled={isEnabled}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
