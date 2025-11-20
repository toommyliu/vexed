<script>
  /** @type {string} */
  export let title;

  /** @type {boolean} */
  export let collapsible = false;

  /** @type {boolean} */
  export let defaultExpanded = true;

  /** @type {string} */
  let className = "";
  export { className as class };

  /** @type {string} */
  export let headerClass = "";

  /** @type {string} */
  export let contentClass = "";

  let isExpanded = defaultExpanded;

  function toggleExpanded() {
    if (collapsible) {
      isExpanded = !isExpanded;
    }
  }
</script>

<div
  class="rounded-md border border-border bg-card shadow-lg backdrop-blur-sm {className}"
  {...$$restProps}
>
  <div
    class="border-b border-border px-4 py-3 {collapsible
      ? 'cursor-pointer'
      : ''} {headerClass}"
    on:click={toggleExpanded}
    on:keydown={(ev) => ev.key === "Enter" && toggleExpanded()}
    role={collapsible ? "button" : undefined}
    tabindex={collapsible ? 0 : undefined}
  >
    <div class="flex items-center space-x-3">
      {#if $$slots.icon}
        <div class="rounded-md bg-primary/10 p-2 text-primary">
          <slot name="icon" />
        </div>
      {/if}
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-card-foreground">{title}</h2>
      </div>
      {#if collapsible}
        <svg
          class="h-5 w-5 text-muted-foreground transition-transform duration-200 {isExpanded
            ? 'rotate-180'
            : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      {/if}
    </div>
  </div>

  {#if isExpanded}
    <div class="p-4 {contentClass}">
      <slot />
    </div>
  {/if}
</div>
