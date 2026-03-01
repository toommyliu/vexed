<script lang="ts">
  import {
    PillButton,
    Select,
    Icon,
    Button,
    TooltipButton,
  } from "@vexed/ui";
  import { titlecase } from "@vexed/utils/string";

  import { settings } from "../state/settings.svelte";
  import {
    customTheme,
    activeEditScheme,
    setToken,
    clearToken,
    reset,
    queueTokenUpdate,
    setRadius,
    clearRadius,
    liveScheme,
  } from "../state/theme-manager";

  import { COLOR_TOKENS } from "../constants";
  import {
    clearCustomTheme,
    resolveDisplayTokenHex,
  } from "../../../shared/theme";

  const currentSchemeOverrides = $derived(
    $customTheme[$activeEditScheme] ?? {},
  );
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-4">
  <section class="flex flex-col gap-3">
    <div class="flex flex-col gap-0 pb-3">
      <div class="flex items-center justify-between px-2 py-1">
        <div class="flex flex-col">
          <span class="text-[13px] font-medium text-foreground">Theme</span>
        </div>
        <div class="flex w-[140px] justify-end">
          <Select.Root bind:value={settings.theme}>
            <Select.Trigger class="h-8 w-full bg-transparent text-xs" size="sm">
              <Select.Value placeholder="Auto"
                >{titlecase(settings.theme)}</Select.Value
              >
            </Select.Trigger>
            <Select.Content align="end">
              <Select.Item class="text-xs" value="dark">Dark</Select.Item>
              <Select.Item class="text-xs" value="light">Light</Select.Item>
              <Select.Item class="text-xs" value="system">System</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </div>
  </section>

  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-2">
      <div class="flex min-w-0 flex-auto items-center gap-2">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50"
          >Customization</span
        >

        <TooltipButton
          tooltip="Some customizations might not be respected"
          contentClass="p-1"
        >
          <Icon icon="info" class="size-3 text-muted-foreground/40" />
        </TooltipButton>
      </div>
      <div class="flex min-w-max shrink-0 items-center gap-2">
        <div class="flex gap-1">
          <PillButton
            size="sm"
            class="h-6 px-3 text-[11px]"
            variant={$activeEditScheme === "dark" ? "default" : "ghost"}
            onclick={() => activeEditScheme.set("dark")}>Dark</PillButton
          >
          <PillButton
            size="sm"
            class="h-6 px-3 text-[11px]"
            variant={$activeEditScheme === "light" ? "default" : "ghost"}
            onclick={() => activeEditScheme.set("light")}>Light</PillButton
          >
        </div>

        <div class="h-3 w-px bg-border/50"></div>

        <Button
          size="xs"
          variant="destructive"
          onclick={() => {
            reset();
            clearCustomTheme();
          }}
        >
          <Icon icon="rotate_ccw" class="h-3 w-3" />
          <span>Reset all</span>
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-x-12 gap-y-1 sm:grid-cols-2">
      {#each COLOR_TOKENS as token (token.key)}
        {@const hex = currentSchemeOverrides[token.key]}
        {@const displayHex = resolveDisplayTokenHex(
          $customTheme,
          $activeEditScheme,
          token.key,
          $liveScheme,
        )}
        <div
          class="group flex items-center justify-between rounded px-2 py-1.5 transition-colors hover:bg-muted/10"
        >
          <div class="flex items-center gap-2 truncate pr-2">
            <span class="truncate text-[12px] font-medium text-foreground"
              >{token.label}</span
            >
            {#if hex}
              <button
                type="button"
                class="flex shrink-0 items-center gap-0.5 rounded text-[10px] text-muted-foreground/60 opacity-0 transition-colors hover:text-destructive focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive group-hover:opacity-100"
                onclick={() => clearToken($activeEditScheme, token.key)}
                title="Reset to default"
              >
                <Icon icon="x" size="2xs" />
              </button>
            {/if}
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span
              class="w-12 text-right font-mono text-[10px] uppercase text-muted-foreground/60"
            >
              {displayHex}
            </span>
            <label
              class="relative h-5 w-5 cursor-pointer overflow-hidden rounded shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-primary"
              title={displayHex}
            >
              <div
                class="absolute inset-0"
                style="background-color: {displayHex};"
              ></div>
              <input
                type="color"
                class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={displayHex}
                oninput={(event) =>
                  queueTokenUpdate(
                    $activeEditScheme,
                    token.key,
                    event.currentTarget.value,
                  )}
                onchange={(event) =>
                  setToken(
                    $activeEditScheme,
                    token.key,
                    event.currentTarget.value,
                  )}
              />
            </label>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-3">
    <div class="px-2">
      <span
        class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50"
        >Typography &amp; Radius</span
      >
    </div>

    <div class="flex flex-col divide-y divide-border/30">
      <div class="group flex items-center justify-between px-2 py-2.5">
        <div class="flex flex-col gap-0.5">
          <span class="text-[13px] font-medium text-foreground"
            >Interface font</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <input
            type="text"
            spellcheck="false"
            class="h-8 w-44 rounded-md border border-border/50 bg-transparent px-2.5 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Inter Variable"
            value={$customTheme.fontFamily ?? ""}
            oninput={(event) => {
              const value = event.currentTarget.value.trim();
              const { fontFamily: _, ...rest } = $customTheme;
              customTheme.set(value ? { ...rest, fontFamily: value } : rest);
            }}
          />
          {#if $customTheme.fontFamily}
            <button
              type="button"
              class="flex items-center rounded p-1 text-muted-foreground/40 opacity-0 transition-colors hover:text-destructive focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive group-hover:opacity-100"
              onclick={() => {
                const { fontFamily: _, ...rest } = $customTheme;
                customTheme.set(rest);
              }}
              title="Reset to default"
            >
              <Icon icon="rotate_ccw" class="h-3 w-3" />
            </button>
          {:else}
            <span class="w-6"></span>
          {/if}
        </div>
      </div>

      <div class="group flex items-center justify-between px-2 py-2.5">
        <div class="flex flex-col gap-0.5">
          <span class="text-[13px] font-medium text-foreground"
            >Monospace font</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <input
            type="text"
            spellcheck="false"
            class="h-8 w-44 rounded-md border border-border/50 bg-transparent px-2.5 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="JetBrains Mono"
            value={$customTheme.monospaceFontFamily ?? ""}
            oninput={(event) => {
              const value = event.currentTarget.value.trim();
              const { monospaceFontFamily: _, ...rest } = $customTheme;
              customTheme.set(
                value ? { ...rest, monospaceFontFamily: value } : rest,
              );
            }}
          />
          {#if $customTheme.monospaceFontFamily}
            <button
              type="button"
              class="flex items-center rounded p-1 text-muted-foreground/40 opacity-0 transition-colors hover:text-destructive focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive group-hover:opacity-100"
              onclick={() => {
                const { monospaceFontFamily: _, ...rest } = $customTheme;
                customTheme.set(rest);
              }}
              title="Reset to default"
            >
              <Icon icon="rotate_ccw" class="h-3 w-3" />
            </button>
          {:else}
            <span class="w-6"></span>
          {/if}
        </div>
      </div>

      <div class="group flex items-center justify-between px-2 py-2.5">
        <div class="flex flex-col gap-0.5">
          <span class="text-[13px] font-medium text-foreground"
            >Corner radius</span
          >
          <span class="text-[12px] text-muted-foreground/60"
            >Border rounding scale</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <input
            type="text"
            spellcheck="false"
            class="h-8 w-44 rounded-md border border-border/50 bg-transparent px-2.5 text-[12px] text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="0.625rem"
            value={$customTheme.radius ?? ""}
            oninput={(event) => {
              const value = event.currentTarget.value.trim();
              if (value) setRadius(value);
              else clearRadius();
            }}
          />
          {#if $customTheme.radius}
            <button
              type="button"
              class="flex items-center rounded p-1 text-muted-foreground/40 opacity-0 transition-colors hover:text-destructive focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive group-hover:opacity-100"
              onclick={() => clearRadius()}
              title="Reset to default"
            >
              <Icon icon="rotate_ccw" class="h-3 w-3" />
            </button>
          {:else}
            <span class="w-6"></span>
          {/if}
        </div>
      </div>
    </div>
  </section>
</div>
