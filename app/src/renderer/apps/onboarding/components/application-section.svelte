<script lang="ts">
  import { Label, Switch } from "@vexed/ui";
  import { settings } from "../state/settings.svelte";
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-10">
  <section class="flex flex-col gap-3">
    <div class="flex flex-col gap-0 divide-y divide-border/30">
      <Label
        class="group flex cursor-pointer items-center justify-between px-2 py-4 transition-colors hover:bg-muted/5"
      >
        <div class="flex flex-col gap-1">
          <span class="text-[13px] font-medium text-foreground"
            >Check for Updates</span
          >
          <span class="text-xs text-muted-foreground/80"
            >Automatic update checks on startup</span
          >
        </div>
        <Switch bind:checked={settings.checkForUpdates} size="sm" />
      </Label>

      <Label
        class="group flex cursor-pointer items-center justify-between px-2 py-4 transition-colors hover:bg-muted/5"
      >
        <div class="flex flex-col gap-1">
          <span class="text-[13px] font-medium text-foreground"
            >Debug Logging</span
          >
          <span class="text-xs text-muted-foreground/80"
            >Logs are written to Log.txt for troubleshooting</span
          >
        </div>
        <Switch bind:checked={settings.debug} size="sm" />
      </Label>
    </div>
  </section>
</div>
