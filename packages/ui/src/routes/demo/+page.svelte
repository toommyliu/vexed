<script lang="ts">
  import "core-js/stable"; // used to test the electron app
  import "$lib/styles.css";
  import {
    Tabs,
    Menu,
    Alert,
    Switch,
    NumberField,
    Button,
    PillButton,
    Input,
    Checkbox,
    Select,
    Badge,
    Kbd,
    Label,
    Card,
    Dialog,
    Combobox,
    Command,
    Dropdown,
    InputGroup,
    Textarea,
    Separator,
    Icon,
    AlertDialog,
    Tooltip,
  } from "$lib";
  import { icons, type IconName } from "$lib/components/core/icons";
  import { onMount } from "svelte";

  import type {
    ButtonVariant,
    ButtonSize,
  } from "$lib/components/core/button.svelte";

  let menuAutoSave = $state(false);
  let menuSortBy = $state("");
  let switchChecked = $state(false);
  let switchUnchecked = $state(false);
  let switchCheckedOn = $state(true);
  let numberValue = $state(10);
  let tabValue = $state("account");
  let isDark = $state(false);
  let inputValue = $state("");
  let textareaValue = $state("");
  let selectValueSm = $state<string[]>([]);
  let selectValue = $state<string[]>([]);
  let selectValueDef = $state<string[]>([]);
  let selectValueLg = $state<string[]>([]);
  let frameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
  ];

  let selectedFramework = $state("");
  let comboboxSearchValue = $state("");
  let filteredFrameworks = $derived(
    comboboxSearchValue === ""
      ? frameworks
      : frameworks.filter((f) =>
          f.label.toLowerCase().includes(comboboxSearchValue.toLowerCase()),
        ),
  );

  const frontendFrameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
  ];
  const backendFrameworks = [
    { value: "express", label: "Express" },
    { value: "fastify", label: "Fastify" },
    { value: "nestjs", label: "NestJS" },
  ];
  let selectedGrouped = $state("");
  let comboboxGroupedSearch = $state("");
  let filteredFrontend = $derived(
    comboboxGroupedSearch === ""
      ? frontendFrameworks
      : frontendFrameworks.filter((f) =>
          f.label.toLowerCase().includes(comboboxGroupedSearch.toLowerCase()),
        ),
  );
  let filteredBackend = $derived(
    comboboxGroupedSearch === ""
      ? backendFrameworks
      : backendFrameworks.filter((f) =>
          f.label.toLowerCase().includes(comboboxGroupedSearch.toLowerCase()),
        ),
  );

  const longList = [
    { value: "afghanistan", label: "Afghanistan" },
    { value: "albania", label: "Albania" },
    { value: "algeria", label: "Algeria" },
    { value: "argentina", label: "Argentina" },
    { value: "australia", label: "Australia" },
    { value: "austria", label: "Austria" },
    { value: "brazil", label: "Brazil" },
    { value: "canada", label: "Canada" },
    { value: "chile", label: "Chile" },
    { value: "china", label: "China" },
    { value: "colombia", label: "Colombia" },
    { value: "denmark", label: "Denmark" },
    { value: "egypt", label: "Egypt" },
    { value: "finland", label: "Finland" },
    { value: "france", label: "France" },
    { value: "germany", label: "Germany" },
    { value: "greece", label: "Greece" },
    { value: "india", label: "India" },
    { value: "indonesia", label: "Indonesia" },
    { value: "ireland", label: "Ireland" },
    { value: "italy", label: "Italy" },
    { value: "japan", label: "Japan" },
    { value: "mexico", label: "Mexico" },
    { value: "netherlands", label: "Netherlands" },
    { value: "new-zealand", label: "New Zealand" },
    { value: "norway", label: "Norway" },
    { value: "poland", label: "Poland" },
    { value: "portugal", label: "Portugal" },
    { value: "south-korea", label: "South Korea" },
    { value: "spain", label: "Spain" },
    { value: "sweden", label: "Sweden" },
    { value: "switzerland", label: "Switzerland" },
    { value: "uk", label: "United Kingdom" },
    { value: "usa", label: "United States" },
  ];
  let selectedLong = $state("");
  let comboboxLongSearch = $state("");
  let filteredLong = $derived(
    comboboxLongSearch === ""
      ? longList
      : longList.filter((c) =>
          c.label.toLowerCase().includes(comboboxLongSearch.toLowerCase()),
        ),
  );

  let selectedClear = $state("");
  let comboboxClearSearch = $state("");
  let filteredClear = $derived(
    comboboxClearSearch === ""
      ? frameworks
      : frameworks.filter((f) =>
          f.label.toLowerCase().includes(comboboxClearSearch.toLowerCase()),
        ),
  );

  let selectedNoTrigger = $state("");
  let comboboxNoTriggerSearch = $state("");
  let filteredNoTrigger = $derived(
    comboboxNoTriggerSearch === ""
      ? frameworks
      : frameworks.filter((f) =>
          f.label.toLowerCase().includes(comboboxNoTriggerSearch.toLowerCase()),
        ),
  );

  let dropdownValue = $state("apple");
  let dialogControlledOpen = $state(false);

  // Command demos
  let commandDialogOpen = $state(false);
  let commandValue = $state("");
  let commandCustomSearch = $state("");
  const commandItems = [
    { value: "linear", label: "Linear", group: "Applications" },
    { value: "figma", label: "Figma", group: "Applications" },
    { value: "notion", label: "Notion", group: "Applications" },
    { value: "slack", label: "Slack", group: "Applications" },
    { value: "new-file", label: "New File", group: "Actions" },
    { value: "new-window", label: "New Window", group: "Actions" },
    { value: "preferences", label: "Preferences", group: "Actions" },
    { value: "downloads", label: "Downloads", group: "Actions" },
  ];
  const commandApplications = commandItems.filter(
    (i) => i.group === "Applications",
  );
  const commandActions = commandItems.filter((i) => i.group === "Actions");
  let commandCustomFiltered = $derived(
    commandCustomSearch === ""
      ? commandItems
      : commandItems.filter((i) =>
          i.label.toLowerCase().startsWith(commandCustomSearch.toLowerCase()),
        ),
  );

  $effect(() => {
    function handleCommandK(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        commandDialogOpen = !commandDialogOpen;
      }
    }
    window.addEventListener("keydown", handleCommandK);
    return () => window.removeEventListener("keydown", handleCommandK);
  });

  function toggleDarkMode() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  onMount(() => {
    const theme = localStorage.getItem("theme");
    if (
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      isDark = true;
      document.documentElement.classList.add("dark");
    }
  });

  // Detect the currently active section based on scroll position
  let activeSection = $state("icons");
  let indicatorStyle = $state({ top: 0, height: 0, opacity: 0 });
  const iconNames = Object.keys(icons)
    .filter((k) => k !== "_unknown")
    .sort();
  const sections = [
    { id: "icons", label: "Icons" },
    { id: "button", label: "Button" },
    { id: "pill-button", label: "PillButton" },
    { id: "badge", label: "Badge" },
    { id: "alert", label: "Alert" },
    { id: "input-label", label: "Input & Label" },
    { id: "textarea", label: "Textarea" },
    { id: "checkbox", label: "Checkbox" },
    { id: "select", label: "Select" },
    { id: "combobox", label: "Combobox" },
    { id: "dropdown", label: "Dropdown" },
    { id: "switch", label: "Switch" },
    { id: "numberfield", label: "NumberField" },
    { id: "tabs", label: "Tabs" },
    { id: "menu", label: "Menu" },
    { id: "kbd", label: "Kbd" },
    { id: "card", label: "Card" },
    { id: "dialog", label: "Dialog" },
    { id: "inputgroup", label: "InputGroup" },
    { id: "separator", label: "Separator" },
    { id: "tooltip", label: "Tooltip" },
    { id: "command", label: "Command" },
  ];

  $effect(() => {
    if (activeSection) {
      const activeLink = document.querySelector(
        `.toc-link[href="#${activeSection}"]`,
      );
      if (activeLink instanceof HTMLElement) {
        indicatorStyle = {
          top: activeLink.offsetTop,
          height: activeLink.offsetHeight,
          opacity: 1,
        };
      }
    } else {
      indicatorStyle = { ...indicatorStyle, opacity: 0 };
    }
  });

  function handleNavClick(id: string) {
    activeSection = id;
    // We let the native anchor behavior handle the scroll,
    // but the activeSection is updated immediately for the indicator.
  }

  onMount(() => {
    const visibleSections = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        }

        // Handle case where we scroll to the bottom
        const isAtBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 50;

        if (isAtBottom) {
          activeSection = sections[sections.length - 1].id;
          return;
        }

        if (visibleSections.size > 0) {
          // Sort visible sections by their appearance in the 'sections' array
          // to always pick the "highest" one in the DOM among visible ones.
          const visibleList = Array.from(visibleSections);
          const highest = sections.find((s) => visibleList.includes(s.id));
          if (highest) activeSection = highest.id;
        }
      },
      {
        // Use a much wider margin to detect small sections,
        // but the logic above picks the first one.
        rootMargin: "-5% 0px -75% 0px",
      },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    const handleScroll = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;
      if (isAtBottom) {
        activeSection = sections[sections.length - 1].id;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<nav
  class="fixed left-0 top-0 h-screen w-56 p-4 bg-background/80 backdrop-blur-sm border-r border-border overflow-y-auto z-40 hidden lg:block"
>
  <h3 class="text-xs font-semibold uppercase text-muted-foreground mb-3 px-2">
    Components
  </h3>
  <div class="relative">
    <!-- Sliding Indicator -->
    <div
      class="pointer-events-none absolute left-0 right-0 rounded-md bg-accent/50 transition-all duration-300"
      style="top: {indicatorStyle.top}px; height: {indicatorStyle.height}px; opacity: {indicatorStyle.opacity}; transition-timing-function: cubic-bezier(0.2, 0, 0, 1)"
    >
      <div
        class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
      ></div>
    </div>

    <ul class="relative space-y-1">
      {#each sections as section}
        <li>
          <a
            href="#{section.id}"
            class="toc-link"
            class:toc-active={activeSection === section.id}
            onclick={() => handleNavClick(section.id)}
          >
            {section.label}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<div
  class="p-8 space-y-12 min-h-screen bg-background text-foreground transition-colors duration-300 lg:ml-56"
>
  <div class="space-y-12 max-w-4xl mx-auto scroll-smooth">
    <!-- Icons -->
    <section id="icons" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Icons</h2>
      <div class="grid grid-cols-5 md:grid-cols-8 gap-4">
        {#each iconNames as name}
          <div
            class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
          >
            <Icon icon={name as IconName} size="lg" />
            <span class="text-xs text-muted-foreground">{name}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Button -->
    <section id="button" class="space-y-6">
      <h2 class="text-2xl font-semibold border-b pb-2">Button</h2>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Text sizes (variant × size)
        </h3>
        <div class="overflow-x-auto">
          <table class="text-sm border-collapse">
            <thead>
              <tr>
                <th
                  class="text-left pr-4 pb-2 text-muted-foreground font-medium w-36"
                  >Variant</th
                >
                {#each ["xs", "sm", "default", "lg", "xl"] as sz}
                  <th
                    class="pb-2 px-2 text-muted-foreground font-medium text-center"
                    >{sz}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody class="space-y-2">
              {#each [{ v: "default", label: "Default" }, { v: "destructive", label: "Destructive" }, { v: "destructive-outline", label: "Destr. Outline" }, { v: "success", label: "Success" }, { v: "outline", label: "Outline" }, { v: "secondary", label: "Secondary" }, { v: "ghost", label: "Ghost" }, { v: "link", label: "Link" }] as row}
                <tr>
                  <td class="pr-4 py-1.5 text-muted-foreground text-xs"
                    >{row.label}</td
                  >
                  {#each ["xs", "sm", "default", "lg", "xl"] as sz}
                    <td class="px-2 py-1.5 text-center">
                      <Button
                        variant={row.v as ButtonVariant}
                        size={sz as ButtonSize}>{sz}</Button
                      >
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Icon sizes (variant × size)
        </h3>
        <div class="overflow-x-auto">
          <table class="text-sm border-collapse">
            <thead>
              <tr>
                <th
                  class="text-left pr-4 pb-2 text-muted-foreground font-medium w-36"
                  >Variant</th
                >
                {#each ["icon-xs", "icon-sm", "icon", "icon-lg", "icon-xl"] as sz}
                  <th
                    class="pb-2 px-2 text-muted-foreground font-medium text-center"
                    >{sz}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each [{ v: "default", label: "Default" }, { v: "destructive", label: "Destructive" }, { v: "destructive-outline", label: "Destr. Outline" }, { v: "success", label: "Success" }, { v: "outline", label: "Outline" }, { v: "secondary", label: "Secondary" }, { v: "ghost", label: "Ghost" }, { v: "link", label: "Link" }] as row}
                <tr>
                  <td class="pr-4 py-1.5 text-muted-foreground text-xs"
                    >{row.label}</td
                  >
                  {#each ["icon-xs", "icon-sm", "icon", "icon-lg", "icon-xl"] as sz}
                    <td class="px-2 py-1.5 text-center">
                      <Button
                        variant={row.v as ButtonVariant}
                        size={sz as ButtonSize}
                      >
                        <Icon icon="plus" />
                      </Button>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Disabled state (all variants)
        </h3>
        <div class="flex gap-2 flex-wrap items-center">
          <Button variant="default" disabled>Default</Button>
          <Button variant="destructive" disabled>Destructive</Button>
          <Button variant="destructive-outline" disabled>Destr. Outline</Button>
          <Button variant="success" disabled>Success</Button>
          <Button variant="outline" disabled>Outline</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="ghost" disabled>Ghost</Button>
          <Button variant="link" disabled>Link</Button>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Anchor (href prop → renders as &lt;a&gt;)
        </h3>
        <div class="flex gap-2 flex-wrap items-center">
          <Button href="#">Default link</Button>
          <Button href="#" variant="outline">Outline link</Button>
          <Button href="#" variant="ghost">Ghost link</Button>
          <Button href="#" variant="secondary">Secondary link</Button>
          <Button href="#" variant="link">Link link</Button>
        </div>
      </div>
    </section>

    <!-- PillButton -->
    <section id="pill-button" class="space-y-6">
      <h2 class="text-2xl font-semibold border-b pb-2">PillButton</h2>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Variants</h3>
        <div class="flex gap-2 flex-wrap items-center">
          <PillButton variant="default">Default</PillButton>
          <PillButton variant="destructive">Destructive</PillButton>
          <PillButton variant="destructive-outline">Destr. Outline</PillButton>
          <PillButton variant="success">Success</PillButton>
          <PillButton variant="outline">Outline</PillButton>
          <PillButton variant="secondary">Secondary</PillButton>
          <PillButton variant="ghost">Ghost</PillButton>
          <PillButton variant="link">Link</PillButton>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Sizes</h3>
        <div class="flex gap-2 flex-wrap items-center">
          <PillButton size="xs" variant="default">XS</PillButton>
          <PillButton size="sm" variant="default">SM</PillButton>
          <PillButton size="default" variant="default">Default</PillButton>
          <PillButton size="lg" variant="default">LG</PillButton>
          <PillButton size="xl" variant="default">XL</PillButton>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">With Icons</h3>
        <div class="flex gap-2 flex-wrap items-center">
          <PillButton variant="default"
            ><Icon icon="plus" size="xs" />New</PillButton
          >
          <PillButton variant="outline"
            ><Icon icon="check" size="xs" />Done</PillButton
          >
          <PillButton variant="ghost"
            ><Icon icon="settings" size="xs" />Settings</PillButton
          >
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Disabled</h3>
        <div class="flex gap-2 flex-wrap items-center">
          <PillButton variant="default" disabled>Default</PillButton>
          <PillButton variant="outline" disabled>Outline</PillButton>
          <PillButton variant="ghost" disabled>Ghost</PillButton>
        </div>
      </div>
    </section>

    <!-- Badge -->
    <section id="badge" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Badge</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Variants</h3>
          <div class="flex gap-2 flex-wrap">
            <Badge variant="default"
              ><Icon icon="check" size="xs" />Default</Badge
            >
            <Badge variant="secondary"
              ><Icon icon="check" size="xs" />Secondary</Badge
            >
            <Badge variant="outline"
              ><Icon icon="check" size="xs" />Outline</Badge
            >
            <Badge variant="destructive"
              ><Icon icon="check" size="xs" />Destructive</Badge
            >
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Sizes</h3>
          <div class="flex gap-2 flex-wrap items-center">
            <Badge size="sm">Small</Badge>
            <Badge size="default">Default</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Variant × Size Combinations
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <p class="text-xs text-muted-foreground">Default</p>
              <div class="flex gap-2 items-center">
                <Badge variant="default" size="sm">Small</Badge>
                <Badge variant="default" size="default">Default</Badge>
                <Badge variant="default" size="lg">Large</Badge>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-xs text-muted-foreground">Secondary</p>
              <div class="flex gap-2 items-center">
                <Badge variant="secondary" size="sm">Small</Badge>
                <Badge variant="secondary" size="default">Default</Badge>
                <Badge variant="secondary" size="lg">Large</Badge>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-xs text-muted-foreground">Outline</p>
              <div class="flex gap-2 items-center">
                <Badge variant="outline" size="sm">Small</Badge>
                <Badge variant="outline" size="default">Default</Badge>
                <Badge variant="outline" size="lg">Large</Badge>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-xs text-muted-foreground">Destructive</p>
              <div class="flex gap-2 items-center">
                <Badge variant="destructive" size="sm">Small</Badge>
                <Badge variant="destructive" size="default">Default</Badge>
                <Badge variant="destructive" size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Alert -->
    <section id="alert" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Alert</h2>
      <div class="space-y-4">
        <Alert.Root>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-terminal h-4 w-4"
            ><polyline points="4 17 10 11" /><line
              x1="12"
              x2="20"
              y1="19"
              y2="19"
            /></svg
          >
          <Alert.Title>Heads up!</Alert.Title>
          <Alert.Description>
            You can add components to your app using the cli.
          </Alert.Description>
        </Alert.Root>
        <Alert.Root variant="error">
          <Icon icon="circle_alert" />
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>
            Your session has expired. Please log in again.
          </Alert.Description>
        </Alert.Root>
      </div>
    </section>

    <!-- Input & Label -->
    <section id="input-label" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Input & Label</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Sizes</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div class="space-y-1.5">
              <Label for="input-sm">Small</Label>
              <Input id="input-sm" size="sm" placeholder="Small input" />
            </div>
            <div class="space-y-1.5">
              <Label for="input-default">Default</Label>
              <Input
                id="input-default"
                size="default"
                placeholder="Default input"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="input-lg">Large</Label>
              <Input id="input-lg" size="lg" placeholder="Large input" />
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Types & States
          </h3>
          <div class="grid w-full max-w-sm items-center gap-4">
            <div class="grid w-full max-w-sm items-center gap-1.5">
              <Label for="email">Email</Label>
              <Input
                type="email"
                id="email"
                placeholder="Email"
                bind:value={inputValue}
              />
            </div>
            <div class="grid w-full max-w-sm items-center gap-1.5">
              <Label for="password">Password</Label>
              <Input type="password" id="password" placeholder="Password" />
            </div>
            <div class="grid w-full max-w-sm items-center gap-1.5">
              <Label for="disabled">Disabled</Label>
              <Input
                disabled
                type="text"
                id="disabled"
                placeholder="Disabled input"
              />
            </div>
            <form action="#">
              <div class="grid w-full max-w-sm items-center gap-1.5">
                <Label for="invalid">Invalid (1-10)</Label>
                <Input id="invalid" type="number" min="1" max="10" required />
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Textarea -->
    <section id="textarea" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Textarea</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Sizes</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div class="space-y-1.5">
              <Label>Small</Label>
              <Textarea size="sm" placeholder="Small textarea" />
            </div>
            <div class="space-y-1.5">
              <Label>Default</Label>
              <Textarea size="default" placeholder="Default textarea" />
            </div>
            <div class="space-y-1.5">
              <Label>Large</Label>
              <Textarea size="lg" placeholder="Large textarea" />
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">States</h3>
          <div class="grid w-full max-w-sm items-center gap-4">
            <Textarea placeholder="Bound value" bind:value={textareaValue} />
            <Textarea placeholder="Disabled" disabled />
          </div>
        </div>
      </div>
    </section>

    <!-- Checkbox -->
    <section id="checkbox" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Checkbox</h2>
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label for="terms">Accept terms and conditions</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="disabled-checkbox" disabled checked />
          <Label for="disabled-checkbox">Disabled checked</Label>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Two-way Binding
          </h3>
          <div class="flex items-center space-x-2">
            <Checkbox id="bound-checkbox" bind:checked={switchChecked} />
            <Label for="bound-checkbox"
              >Bound to Switch state ({switchChecked})</Label
            >
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Controlled (Indeterminate)
          </h3>
          <div class="flex items-center space-x-2">
            <Checkbox id="indeterminate-checkbox" indeterminate={true} />
            <Label for="indeterminate-checkbox">Indeterminate</Label>
          </div>
        </div>
      </div>
    </section>

    <!-- Select -->
    <section id="select" class="space-y-6">
      <h2 class="text-2xl font-semibold border-b pb-2">Select</h2>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Size Variants</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>Small</Label>
            <Select.Root bind:value={selectValueSm} class="w-full">
              <Select.Trigger size="sm">
                <Select.Value placeholder="Select..." />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="sm1">Small Option 1</Select.Item>
                <Select.Item value="sm2">Small Option 2</Select.Item>
                <Select.Item value="sm3">Small Option 3</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <div class="space-y-2">
            <Label>Default</Label>
            <Select.Root bind:value={selectValueDef} class="w-full">
              <Select.Trigger>
                <Select.Value placeholder="Select..." />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="def1">Default Option 1</Select.Item>
                <Select.Item value="def2">Default Option 2</Select.Item>
                <Select.Item value="def3">Default Option 3</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <div class="space-y-2">
            <Label>Large</Label>
            <Select.Root bind:value={selectValueLg} class="w-full">
              <Select.Trigger size="lg">
                <Select.Value placeholder="Select..." />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="lg1">Large Option 1</Select.Item>
                <Select.Item value="lg2">Large Option 2</Select.Item>
                <Select.Item value="lg3">Large Option 3</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>
      <div class="space-y-2">
        <Label>With Groups & Separators</Label>
        <Select.Root bind:value={selectValue} class="max-w-[280px]">
          <Select.Trigger>
            <Select.Value placeholder="Select a fruit" />
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.GroupLabel>Fruits</Select.GroupLabel>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="banana">Banana</Select.Item>
              <Select.Item value="blueberry">Blueberry</Select.Item>
              <Select.Item value="grapes">Grapes</Select.Item>
              <Select.Item value="pineapple">Pineapple</Select.Item>
            </Select.Group>
            <Select.Separator />
            <Select.Group>
              <Select.GroupLabel>Vegetables</Select.GroupLabel>
              <Select.Item value="aubergine">Aubergine</Select.Item>
              <Select.Item value="broccoli">Broccoli</Select.Item>
              <Select.Item value="carrot" disabled
                >Carrot (Disabled)</Select.Item
              >
              <Select.Item value="courgette">Courgette</Select.Item>
              <Select.Item value="leek">Leek</Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <p class="text-sm text-muted-foreground">
          Selected: {selectValue.length ? selectValue.join(", ") : "None"}
        </p>
      </div>
      <div class="space-y-2">
        <Label>Long List (with Scroll Arrows)</Label>
        <Select.Root class="max-w-[280px]">
          <Select.Trigger>
            <Select.Value placeholder="Select a country" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="us">United States</Select.Item>
            <Select.Item value="ca">Canada</Select.Item>
            <Select.Item value="mx">Mexico</Select.Item>
            <Select.Item value="uk">United Kingdom</Select.Item>
            <Select.Item value="fr">France</Select.Item>
            <Select.Item value="de">Germany</Select.Item>
            <Select.Item value="it">Italy</Select.Item>
            <Select.Item value="es">Spain</Select.Item>
            <Select.Item value="jp">Japan</Select.Item>
            <Select.Item value="cn">China</Select.Item>
            <Select.Item value="in">India</Select.Item>
            <Select.Item value="br">Brazil</Select.Item>
            <Select.Item value="au">Australia</Select.Item>
            <Select.Item value="za">South Africa</Select.Item>
            <Select.Item value="ru">Russia</Select.Item>
            <Select.Item value="kr">South Korea</Select.Item>
            <Select.Item value="sg">Singapore</Select.Item>
            <Select.Item value="nz">New Zealand</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-2">
        <Label>Disabled Select</Label>
        <Select.Root disabled class="max-w-[280px]">
          <Select.Trigger>
            <Select.Value placeholder="Disabled select" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="disabled1">Option 1</Select.Item>
            <Select.Item value="disabled2">Option 2</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </section>

    <!-- Combobox -->
    <section id="combobox" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">Combobox</h2>

      <!-- Basic -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Basic</h3>
        <div class="w-[220px]">
          <Combobox.Root
            bind:value={selectedFramework}
            onOpenChange={(open) => {
              if (!open) comboboxSearchValue = "";
            }}
          >
            <Combobox.Input
              placeholder="Select framework..."
              oninput={(e) => {
                comboboxSearchValue = e.currentTarget.value;
              }}
            />
            <Combobox.Content>
              <Combobox.List>
                {#each filteredFrameworks as framework (framework.value)}
                  <Combobox.Item
                    value={framework.value}
                    label={framework.label}
                  >
                    {framework.label}
                  </Combobox.Item>
                {/each}
                {#if filteredFrameworks.length === 0}
                  <Combobox.Empty>No framework found.</Combobox.Empty>
                {/if}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Selected: {selectedFramework || "None"}
        </p>
      </div>

      <!-- showClear -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          With clear button <code class="text-xs bg-muted px-1 py-0.5 rounded"
            >showClear</code
          >
        </h3>
        <div class="w-[220px]">
          <Combobox.Root
            bind:value={selectedClear}
            onOpenChange={(open) => {
              if (!open) comboboxClearSearch = "";
            }}
          >
            <Combobox.Input
              placeholder="Select framework..."
              showClear={!!selectedClear}
              oninput={(e) => {
                comboboxClearSearch = e.currentTarget.value;
              }}
              onClear={() => {
                selectedClear = "";
                comboboxClearSearch = "";
              }}
            />
            <Combobox.Content>
              <Combobox.List>
                {#each filteredClear as framework (framework.value)}
                  <Combobox.Item
                    value={framework.value}
                    label={framework.label}
                  >
                    {framework.label}
                  </Combobox.Item>
                {/each}
                {#if filteredClear.length === 0}
                  <Combobox.Empty>No framework found.</Combobox.Empty>
                {/if}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Selected: {selectedClear || "None"}
        </p>
      </div>

      <!-- No trigger -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Search-only <code class="text-xs bg-muted px-1 py-0.5 rounded"
            >showTrigger=false</code
          >
        </h3>
        <div class="w-[220px]">
          <Combobox.Root
            bind:value={selectedNoTrigger}
            onOpenChange={(open) => {
              if (!open) comboboxNoTriggerSearch = "";
            }}
          >
            <Combobox.Input
              placeholder="Search frameworks..."
              showTrigger={false}
              oninput={(e) => {
                comboboxNoTriggerSearch = e.currentTarget.value;
              }}
            />
            <Combobox.Content>
              <Combobox.List>
                {#each filteredNoTrigger as framework (framework.value)}
                  <Combobox.Item
                    value={framework.value}
                    label={framework.label}
                  >
                    {framework.label}
                  </Combobox.Item>
                {/each}
                {#if filteredNoTrigger.length === 0}
                  <Combobox.Empty>No framework found.</Combobox.Empty>
                {/if}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Selected: {selectedNoTrigger || "None"}
        </p>
      </div>

      <!-- With Groups & Separator -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Groups &amp; Separator
        </h3>
        <div class="w-[220px]">
          <Combobox.Root
            bind:value={selectedGrouped}
            onOpenChange={(open) => {
              if (!open) comboboxGroupedSearch = "";
            }}
          >
            <Combobox.Input
              placeholder="Select a framework..."
              oninput={(e) => {
                comboboxGroupedSearch = e.currentTarget.value;
              }}
            />
            <Combobox.Content>
              <Combobox.List>
                {#if filteredFrontend.length > 0}
                  <Combobox.Group>
                    <Combobox.GroupLabel>Frontend</Combobox.GroupLabel>
                    {#each filteredFrontend as fw (fw.value)}
                      <Combobox.Item value={fw.value} label={fw.label}
                        >{fw.label}</Combobox.Item
                      >
                    {/each}
                  </Combobox.Group>
                {/if}
                {#if filteredFrontend.length > 0 && filteredBackend.length > 0}
                  <Combobox.Separator />
                {/if}
                {#if filteredBackend.length > 0}
                  <Combobox.Group>
                    <Combobox.GroupLabel>Backend</Combobox.GroupLabel>
                    {#each filteredBackend as fw (fw.value)}
                      <Combobox.Item value={fw.value} label={fw.label}
                        >{fw.label}</Combobox.Item
                      >
                    {/each}
                  </Combobox.Group>
                {/if}
                {#if filteredFrontend.length === 0 && filteredBackend.length === 0}
                  <Combobox.Empty>No results found.</Combobox.Empty>
                {/if}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Selected: {selectedGrouped || "None"}
        </p>
      </div>

      <!-- Long list -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Long list (scrollable)
        </h3>
        <div class="w-[220px]">
          <Combobox.Root
            bind:value={selectedLong}
            onOpenChange={(open) => {
              if (!open) comboboxLongSearch = "";
            }}
          >
            <Combobox.Input
              placeholder="Search countries..."
              oninput={(e) => {
                comboboxLongSearch = e.currentTarget.value;
              }}
            />
            <Combobox.Content>
              <Combobox.List>
                {#each filteredLong as country (country.value)}
                  <Combobox.Item value={country.value} label={country.label}>
                    {country.label}
                  </Combobox.Item>
                {/each}
                {#if filteredLong.length === 0}
                  <Combobox.Empty>No country found.</Combobox.Empty>
                {/if}
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <p class="text-sm text-muted-foreground">
          Selected: {selectedLong || "None"}
        </p>
      </div>

      <!-- Disabled items -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Disabled items
        </h3>
        <div class="w-[220px]">
          <Combobox.Root>
            <Combobox.Input placeholder="Select option..." />
            <Combobox.Content>
              <Combobox.List>
                <Combobox.Item value="opt-a" label="Option A"
                  >Option A</Combobox.Item
                >
                <Combobox.Item
                  value="opt-b"
                  label="Option B (disabled)"
                  disabled>Option B (disabled)</Combobox.Item
                >
                <Combobox.Item value="opt-c" label="Option C"
                  >Option C</Combobox.Item
                >
                <Combobox.Item
                  value="opt-d"
                  label="Option D (disabled)"
                  disabled>Option D (disabled)</Combobox.Item
                >
                <Combobox.Item value="opt-e" label="Option E"
                  >Option E</Combobox.Item
                >
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
      </div>

      <!-- Disabled root -->
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Disabled</h3>
        <div class="w-[220px]">
          <Combobox.Root disabled>
            <Combobox.Input placeholder="Disabled combobox" />
            <Combobox.Content>
              <Combobox.List>
                <Combobox.Item value="a" label="Option A"
                  >Option A</Combobox.Item
                >
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
      </div>
    </section>

    <!-- Dropdown -->
    <section id="dropdown" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Dropdown</h2>
      <div class="space-y-4">
        <div class="w-[200px]">
          <Dropdown bind:value={dropdownValue}>
            <Combobox.Group>
              <Combobox.GroupLabel>Fruits</Combobox.GroupLabel>
              <Combobox.Item value="apple" label="Apple">Apple</Combobox.Item>
              <Combobox.Item value="banana" label="Banana">Banana</Combobox.Item
              >
              <Combobox.Item value="blueberry" label="Blueberry">
                Blueberry
              </Combobox.Item>
              <Combobox.Separator />
              <Combobox.Item value="grapes" label="Grapes">Grapes</Combobox.Item
              >
              <Combobox.Item value="pineapple" label="Pineapple">
                Pineapple
              </Combobox.Item>
            </Combobox.Group>
          </Dropdown>
        </div>
        <div class="text-sm text-muted-foreground">
          Selected: {dropdownValue}
        </div>
      </div>
    </section>

    <!-- Switch -->
    <section id="switch" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">Switch</h2>

      <div class="space-y-3">
        <h3
          class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
        >
          Sizes
        </h3>
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2.5">
            <Switch bind:checked={switchChecked} size="sm" id="switch-sm" />
            <Label for="switch-sm">Small</Label>
          </div>
          <div class="flex items-center gap-2.5">
            <Switch bind:checked={switchChecked} id="switch-default" />
            <Label for="switch-default">Default</Label>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h3
          class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
        >
          States
        </h3>
        <div class="grid grid-cols-2 gap-x-12 gap-y-4 max-w-xs">
          <div class="flex items-center gap-2.5">
            <Switch bind:checked={switchChecked} id="switch-off" />
            <Label for="switch-off">Off ({switchChecked ? "on" : "off"})</Label>
          </div>
          <div class="flex items-center gap-2.5">
            <Switch bind:checked={switchCheckedOn} id="switch-on" />
            <Label for="switch-on">On ({switchCheckedOn ? "on" : "off"})</Label>
          </div>
          <div class="flex items-center gap-2.5">
            <Switch disabled id="switch-disabled-off" />
            <Label for="switch-disabled-off" class="text-muted-foreground"
              >Disabled off</Label
            >
          </div>
          <div class="flex items-center gap-2.5">
            <Switch disabled checked id="switch-disabled-on" />
            <Label for="switch-disabled-on" class="text-muted-foreground"
              >Disabled on</Label
            >
          </div>
        </div>
      </div>
    </section>

    <!-- NumberField -->
    <section id="numberfield" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">NumberField</h2>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Sizes</h3>
        <div class="flex flex-wrap items-end gap-6">
          <div class="space-y-2">
            <Label>Small</Label>
            <NumberField.Root size="sm" value={0} class="w-[180px]">
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </div>
          <div class="space-y-2">
            <Label>Default</Label>
            <NumberField.Root
              bind:value={numberValue}
              min={0}
              max={100}
              class="w-[180px]"
            >
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </div>
          <div class="space-y-2">
            <Label>Large</Label>
            <NumberField.Root size="lg" value={0} class="w-[180px]">
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Disabled</h3>
        <div class="space-y-2">
          <Label>Quantity</Label>
          <NumberField.Root value={42} disabled class="w-[180px]">
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
      </div>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">With External Label</h3>
        <div class="space-y-2">
          <Label for="nf-qty">Quantity</Label>
          <NumberField.Root value={0} class="w-[180px]">
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input id="nf-qty" />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
      </div>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">With Range</h3>
        <div class="space-y-2">
          <Label>Value (min 1, max 10)</Label>
          <NumberField.Root value={5} min={1} max={10} class="w-[180px]">
            <NumberField.Group>
              <NumberField.Decrement />
              <NumberField.Input />
              <NumberField.Increment />
            </NumberField.Group>
          </NumberField.Root>
        </div>
      </div>
      <div class="space-y-4">
        <h3 class="text-lg font-medium">With Step</h3>
        <div class="flex flex-wrap items-end gap-6">
          <div class="space-y-2">
            <Label>Step 10</Label>
            <NumberField.Root value={0} step={10} class="w-[180px]">
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </div>
          <div class="space-y-2">
            <Label>Step 0.1</Label>
            <NumberField.Root value={0} step={0.1} class="w-[180px]">
              <NumberField.Group>
                <NumberField.Decrement />
                <NumberField.Input />
                <NumberField.Increment />
              </NumberField.Group>
            </NumberField.Root>
          </div>
        </div>
      </div>
    </section>

    <!-- Tabs -->
    <section id="tabs" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">Tabs</h2>

      <div class="space-y-4">
        <h3 class="text-lg font-medium">Default Variant (Horizontal)</h3>
        <Tabs.Root bind:value={tabValue}>
          <Tabs.List>
            <Tabs.Trigger value="account">Account</Tabs.Trigger>
            <Tabs.Trigger value="password">Password</Tabs.Trigger>
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="account">
            <Card.Root>
              <Card.Header>
                <Card.Title>Account</Card.Title>
                <Card.Description>
                  Make changes to your account here.
                </Card.Description>
              </Card.Header>
              <Card.Content class="space-y-2">
                <div class="space-y-1">
                  <Label for="name">Name</Label>
                  <Input id="name" value="Pedro Duarte" />
                </div>
                <div class="space-y-1">
                  <Label for="username">Username</Label>
                  <Input id="username" value="@peduarte" />
                </div>
              </Card.Content>
              <Card.Footer>
                <Button>Save changes</Button>
              </Card.Footer>
            </Card.Root>
          </Tabs.Content>
          <Tabs.Content value="password">
            <Card.Root>
              <Card.Header>
                <Card.Title>Password</Card.Title>
                <Card.Description>Change your password here.</Card.Description>
              </Card.Header>
              <Card.Content class="space-y-2">
                <div class="space-y-1">
                  <Label for="current">Current password</Label>
                  <Input id="current" type="password" />
                </div>
                <div class="space-y-1">
                  <Label for="new">New password</Label>
                  <Input id="new" type="password" />
                </div>
              </Card.Content>
              <Card.Footer>
                <Button>Save password</Button>
              </Card.Footer>
            </Card.Root>
          </Tabs.Content>
          <Tabs.Content value="settings">
            <Card.Root>
              <Card.Header>
                <Card.Title>Settings</Card.Title>
                <Card.Description>Manage your settings.</Card.Description>
              </Card.Header>
              <Card.Content>
                <p class="text-sm text-muted-foreground">
                  Settings content goes here.
                </p>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-medium">Underline Variant (Horizontal)</h3>
        <Tabs.Root value="overview">
          <Tabs.List variant="underline">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
            <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
            <Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">
            <p class="text-sm text-muted-foreground pt-2">
              Overview content with the underline style indicator.
            </p>
          </Tabs.Content>
          <Tabs.Content value="analytics">
            <p class="text-sm text-muted-foreground pt-2">
              Analytics content here.
            </p>
          </Tabs.Content>
          <Tabs.Content value="reports">
            <p class="text-sm text-muted-foreground pt-2">
              Reports content here.
            </p>
          </Tabs.Content>
          <Tabs.Content value="notifications">
            <p class="text-sm text-muted-foreground pt-2">
              Notifications content here.
            </p>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-medium">Default Variant (Vertical)</h3>
        <Tabs.Root orientation="vertical" value="account" class="w-[600px]">
          <Tabs.List>
            <Tabs.Trigger value="account">Account</Tabs.Trigger>
            <Tabs.Trigger value="password">Password</Tabs.Trigger>
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="account">
            <Card.Root>
              <Card.Header>
                <Card.Title>Account</Card.Title>
                <Card.Description>
                  Make changes to your account here.
                </Card.Description>
              </Card.Header>
              <Card.Content class="space-y-2">
                <div class="space-y-1">
                  <Label for="vertical-name">Name</Label>
                  <Input id="vertical-name" value="Pedro Duarte" />
                </div>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
          <Tabs.Content value="password">
            <Card.Root>
              <Card.Header>
                <Card.Title>Password</Card.Title>
              </Card.Header>
              <Card.Content>
                <p class="text-sm text-muted-foreground">
                  Change your password here.
                </p>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
          <Tabs.Content value="settings">
            <Card.Root>
              <Card.Header>
                <Card.Title>Settings</Card.Title>
              </Card.Header>
              <Card.Content>
                <p class="text-sm text-muted-foreground">
                  Manage your settings.
                </p>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <div class="space-y-4">
        <h3 class="text-lg font-medium">Underline Variant (Vertical)</h3>
        <Tabs.Root orientation="vertical" value="general" class="w-[600px]">
          <Tabs.List variant="underline">
            <Tabs.Trigger value="general">General</Tabs.Trigger>
            <Tabs.Trigger value="security">Security</Tabs.Trigger>
            <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="general">
            <p class="text-sm text-muted-foreground">
              General settings with vertical underline indicator.
            </p>
          </Tabs.Content>
          <Tabs.Content value="security">
            <p class="text-sm text-muted-foreground">
              Security settings content.
            </p>
          </Tabs.Content>
          <Tabs.Content value="billing">
            <p class="text-sm text-muted-foreground">
              Billing settings content.
            </p>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>

    <!-- Menu -->
    <section id="menu" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Menu</h2>
      <div class="flex flex-wrap gap-4">
        <Menu.Root>
          <Menu.Trigger>
            <Button variant="outline">Playback Menu</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Label>Playback</Menu.Label>
            <Menu.Item>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                ><polygon points="5 3 19 12 5 21 5 3"></polygon></svg
              >
              Play
              <Menu.Shortcut>⌘P</Menu.Shortcut>
            </Menu.Item>
            <Menu.Item>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                ><rect x="6" y="4" width="4" height="16"></rect><rect
                  x="14"
                  y="4"
                  width="4"
                  height="16"
                ></rect></svg
              >
              Pause
              <Menu.Shortcut>⇧⌘P</Menu.Shortcut>
            </Menu.Item>
            <Menu.Item disabled>Enhanced Audio</Menu.Item>
            <Menu.Separator />
            <Menu.Sub>
              <Menu.SubTrigger>Add to Playlist</Menu.SubTrigger>
              <Menu.SubContent>
                <Menu.Item>Favourites</Menu.Item>
                <Menu.Item>Recently Played</Menu.Item>
                <Menu.Item>New Playlist…</Menu.Item>
              </Menu.SubContent>
            </Menu.Sub>
            <Menu.Separator />
            <Menu.Item variant="destructive">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                ><polyline points="3 6 5 6 21 6"></polyline><path
                  d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                ></path><path d="M10 11v6"></path><path d="M14 11v6"
                ></path></svg
              >
              Delete
              <Menu.Shortcut>⌘⌫</Menu.Shortcut>
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>

        <!-- Checkbox items (default + switch) + radio group -->
        <Menu.Root>
          <Menu.Trigger>
            <Button variant="outline">Settings Menu</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Label>Playback</Menu.Label>
            <Menu.CheckboxItem>Shuffle</Menu.CheckboxItem>
            <Menu.CheckboxItem>Repeat</Menu.CheckboxItem>
            <Menu.Separator />
            <Menu.CheckboxItem variant="switch" bind:checked={menuAutoSave}>
              Auto save
            </Menu.CheckboxItem>
            <Menu.Separator />
            <Menu.Label>Sort by</Menu.Label>
            <Menu.RadioGroup bind:value={menuSortBy}>
              <Menu.RadioItem value="artist">Artist</Menu.RadioItem>
              <Menu.RadioItem value="album">Album</Menu.RadioItem>
              <Menu.RadioItem value="title">Title</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Root>

        <!-- Basic account menu -->
        <Menu.Root>
          <Menu.Trigger>
            <Button variant="outline">Account Menu</Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Label>My Account</Menu.Label>
            <Menu.Separator />
            <Menu.Item>Profile</Menu.Item>
            <Menu.Item>Billing</Menu.Item>
            <Menu.Item>Team</Menu.Item>
            <Menu.Item>Subscription</Menu.Item>
            <Menu.Separator />
            <Menu.Item disabled>Disabled Item</Menu.Item>
            <Menu.Separator />
            <Menu.Item variant="destructive">Log out</Menu.Item>
          </Menu.Content>
        </Menu.Root>
      </div>
    </section>

    <!-- Kbd -->
    <section id="kbd" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Kbd</h2>
      <div class="flex gap-4 items-center">
        <p class="text-sm text-muted-foreground">
          Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to search.
        </p>
        <p class="text-sm text-muted-foreground">
          Press <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy.
        </p>
        <p class="text-sm text-muted-foreground">
          Press <Kbd>⌘+A</Kbd> to select all.
        </p>
      </div>
    </section>

    <!-- Card -->
    <section id="card" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">Card</h2>

      <!-- Basic cards -->
      <div class="space-y-2">
        <h3 class="text-lg font-medium">Basic</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <Card.Root>
            <Card.Header>
              <Card.Title>Create project</Card.Title>
              <Card.Description
                >Deploy your new project in one-click.</Card.Description
              >
            </Card.Header>
            <Card.Content>
              <div class="grid w-full items-center gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label for="project-name">Name</Label>
                  <Input id="project-name" placeholder="Name of your project" />
                </div>
              </div>
            </Card.Content>
            <Card.Footer class="flex items-center justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button variant="default">Deploy</Button>
            </Card.Footer>
          </Card.Root>
          <Card.Root>
            <Card.Header>
              <Card.Title>Notifications</Card.Title>
              <Card.Description>You have 3 unread messages.</Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="flex items-center space-x-4 rounded-md border p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="lucide lucide-bell h-6 w-6"
                  ><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path
                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                  /></svg
                >
                <div class="flex-1 space-y-1">
                  <p class="text-sm font-medium leading-none">
                    Push Notifications
                  </p>
                  <p class="text-sm text-muted-foreground">
                    Send notifications to device.
                  </p>
                </div>
                <Switch />
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>

      <!-- Card.Action in header -->
      <div class="space-y-2">
        <h3 class="text-lg font-medium">With Action</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <Card.Root>
            <Card.Header>
              <Card.Title>Team members</Card.Title>
              <Card.Description
                >Invite your team to this project.</Card.Description
              >
              <Card.Action>
                <Button variant="ghost" class="text-xs">Manage</Button>
              </Card.Action>
            </Card.Header>
            <Card.Content>
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium">Alice</p>
                  <Badge variant="secondary">Admin</Badge>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium">Bob</p>
                  <Badge variant="secondary">Editor</Badge>
                </div>
              </div>
            </Card.Content>
            <Card.Footer class="flex justify-end">
              <Button variant="outline" class="text-xs">Invite member</Button>
            </Card.Footer>
          </Card.Root>
          <Card.Root>
            <Card.Header>
              <Card.Title>Storage</Card.Title>
              <Card.Description>7.2 GB of 10 GB used.</Card.Description>
              <Card.Action>
                <Button variant="ghost" class="text-xs">Upgrade</Button>
              </Card.Action>
            </Card.Header>
            <Card.Content>
              <div class="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full w-[72%] rounded-full bg-primary"></div>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </div>

      <!-- Card.Frame grouped cards -->
      <div class="space-y-2">
        <h3 class="text-lg font-medium">Frame (grouped)</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <Card.Frame>
            <Card.Root
              class="rounded-none border-0 border-b shadow-none before:hidden"
            >
              <Card.Header>
                <Card.Title>Billing</Card.Title>
                <Card.Description>Your current plan is Pro.</Card.Description>
              </Card.Header>
              <Card.Content>
                <p class="text-sm text-muted-foreground">
                  Next invoice on Jan 1, 2027.
                </p>
              </Card.Content>
            </Card.Root>
            <Card.Root class="rounded-none border-0 shadow-none before:hidden">
              <Card.Header>
                <Card.Title>Payment method</Card.Title>
                <Card.Description>Visa ending in 4242.</Card.Description>
              </Card.Header>
              <Card.Content>
                <Button variant="outline" class="text-xs">Update</Button>
              </Card.Content>
            </Card.Root>
          </Card.Frame>

          <Card.Frame>
            <Card.FrameHeader>
              <Card.FrameTitle>Settings group</Card.FrameTitle>
              <Card.FrameDescription
                >Configure your preferences.</Card.FrameDescription
              >
            </Card.FrameHeader>
            <Card.Root
              class="rounded-none border-0 border-b shadow-none before:hidden"
            >
              <Card.Header>
                <Card.Title>Appearance</Card.Title>
                <Card.Description>Choose light or dark mode.</Card.Description>
                <Card.Action>
                  <Switch />
                </Card.Action>
              </Card.Header>
            </Card.Root>
            <Card.Root class="rounded-none border-0 shadow-none before:hidden">
              <Card.Header>
                <Card.Title>Notifications</Card.Title>
                <Card.Description>Enable email notifications.</Card.Description>
                <Card.Action>
                  <Switch />
                </Card.Action>
              </Card.Header>
            </Card.Root>
            <Card.FrameFooter>
              <Button variant="outline" class="text-xs ml-auto flex"
                >Save</Button
              >
            </Card.FrameFooter>
          </Card.Frame>
        </div>
      </div>
    </section>

    <!-- Dialog -->
    <section id="dialog" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Dialog</h2>

      <!-- Triggered (uncontrolled) -->
      <div class="flex flex-wrap gap-3">
        <Dialog.Root>
          <Dialog.Trigger>
            <Button>Edit Profile</Button>
          </Dialog.Trigger>
          <Dialog.Content class="sm:max-w-[425px]">
            <Dialog.Header>
              <Dialog.Title>Edit profile</Dialog.Title>
              <Dialog.Description>
                Make changes to your profile here. Click save when you're done.
              </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 px-6 py-2">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="dialog-name" class="text-right">Name</Label>
                <Input
                  id="dialog-name"
                  value="Pedro Duarte"
                  class="col-span-3"
                />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="dialog-username" class="text-right">Username</Label>
                <Input
                  id="dialog-username"
                  value="@peduarte"
                  class="col-span-3"
                />
              </div>
            </div>
            <Dialog.Footer>
              <Dialog.Close>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button>Save changes</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>

        <!-- Controlled (no trigger, bind:open) -->
        <Button variant="outline" onclick={() => (dialogControlledOpen = true)}
          >Open (controlled)</Button
        >
        <Dialog.Root bind:open={dialogControlledOpen}>
          <Dialog.Content showCloseButton={false}>
            <Dialog.Header>
              <Dialog.Title>Controlled dialog</Dialog.Title>
              <Dialog.Description>
                This dialog is opened and closed via external state.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Dialog.Close>
                <Button variant="outline">Close</Button>
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      </div>

      <div class="flex flex-wrap gap-3">
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button variant="destructive">Delete account</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
              <AlertDialog.Description>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action>Delete account</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>

        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button variant="outline">Confirm action</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <AlertDialog.Title>Confirm your transaction</AlertDialog.Title>
              <AlertDialog.Description>
                This will initiate a transfer of $10,000. Do you wish to
                continue?
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer variant="bare">
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action>Continue</AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </div>
    </section>

    <!-- InputGroup -->
    <section id="inputgroup" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">InputGroup</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>With End Icon</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput type="email" placeholder="Email" />
            <InputGroup.Addon align="inline-end">
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Start Text</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <InputGroup.Text>Type your username here</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupInput placeholder="username" />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With End Text</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput placeholder="username" />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Text>@gmail.com</InputGroup.Text>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Start and End Text</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <InputGroup.Text>https://</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupInput placeholder="example" />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Text>.com</InputGroup.Text>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Icon Button</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput value="https://google.com" readonly />
            <InputGroup.Addon align="inline-end">
              <Button variant="ghost" size="icon-sm">
                <Icon icon="copy" />
              </Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Button</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput placeholder="Search..." />
            <InputGroup.Addon align="inline-end">
              <Button variant="ghost" size="xs">Search</Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Badge</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput placeholder="Task" />
            <InputGroup.Addon align="inline-end">
              <Badge>New</Badge>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Keyboard Shortcut</Label>
          <InputGroup.Root>
            <InputGroup.GroupInput placeholder="Command palette" />
            <InputGroup.Addon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Inner Label (block-start)</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="block-start">
              <InputGroup.Text>Email</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupInput type="email" placeholder="you@example.com" />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>Small Size</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupInput size="sm" placeholder="Username" />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>Large Size</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupInput size="lg" placeholder="Username" />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>Disabled</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="inline-start">
              <Icon icon="search" />
            </InputGroup.Addon>
            <InputGroup.GroupInput placeholder="Disabled" disabled />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>With Textarea</Label>
          <InputGroup.Root>
            <InputGroup.Addon align="block-end">
              <InputGroup.Text>78% used</InputGroup.Text>
            </InputGroup.Addon>
            <InputGroup.GroupTextarea placeholder="Write something..." />
          </InputGroup.Root>
        </div>

        <div class="space-y-2">
          <Label>Legacy — With Text Addon (Input)</Label>
          <InputGroup.Root>
            <InputGroup.Addon>
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Addon>
            <Input placeholder="Username" />
          </InputGroup.Root>
        </div>
      </div>
    </section>

    <!-- Separator -->
    <section id="separator" class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Separator</h2>
      <div class="space-y-4">
        <div>
          <div class="space-y-1">
            <h4 class="text-sm font-medium leading-none">Radix Primitives</h4>
            <p class="text-sm text-muted-foreground">
              An open-source UI component library.
            </p>
          </div>
          <Separator class="my-4" />
          <div class="flex h-5 items-center space-x-4 text-sm">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </div>
      </div>
    </section>

    <section id="command" class="space-y-8">
      <h2 class="text-2xl font-semibold border-b pb-2">Command</h2>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Standalone Panel
        </h3>
        <p class="text-xs text-muted-foreground">
          A self-contained command palette inside a <code>Command.Panel</code> container.
          Includes grouped items, separators, and a footer hint bar.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disableInitialScroll={true}>
              <Command.Input placeholder="Type a command or search..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Group>
                    <Command.GroupHeading>Applications</Command.GroupHeading>
                    <Command.GroupItems>
                      {#each commandApplications as item (item.value)}
                        <Command.Item value={item.value}>
                          <Icon icon="app_window" />
                          {item.label}
                        </Command.Item>
                      {/each}
                    </Command.GroupItems>
                  </Command.Group>
                  <Command.Separator />
                  <Command.Group>
                    <Command.GroupHeading>Actions</Command.GroupHeading>
                    <Command.GroupItems>
                      {#each commandActions as item (item.value)}
                        <Command.Item value={item.value}>
                          <Icon icon="command" />
                          {item.label}
                        </Command.Item>
                      {/each}
                    </Command.GroupItems>
                  </Command.Group>
                </Command.Viewport>
              </Command.List>
              <Command.Footer>
                <span>↑↓ navigate</span>
                <span class="flex items-center gap-3">
                  <span>↵ select</span>
                  <span>esc close</span>
                </span>
              </Command.Footer>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          With Keyboard Shortcuts
        </h3>
        <p class="text-xs text-muted-foreground">
          Items with <code>Command.Shortcut</code> showing keyboard hint labels on
          the right.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disableInitialScroll={true}>
              <Command.Input placeholder="Search commands..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Item value="new-file">
                    <Icon icon="plus" />
                    New File
                    <Command.Shortcut>⌘N</Command.Shortcut>
                  </Command.Item>
                  <Command.Item value="open-file">
                    <Icon icon="download" />
                    Open File
                    <Command.Shortcut>⌘O</Command.Shortcut>
                  </Command.Item>
                  <Command.Item value="save">
                    <Icon icon="arrow_down_to_line" />
                    Save
                    <Command.Shortcut>⌘S</Command.Shortcut>
                  </Command.Item>
                  <Command.Separator />
                  <Command.Item value="preferences">
                    <Icon icon="settings" />
                    Preferences
                    <Command.Shortcut>⌘,</Command.Shortcut>
                  </Command.Item>
                  <Command.Item value="quit" disabled>
                    <Icon icon="x" />
                    Quit (disabled)
                    <Command.Shortcut>⌘Q</Command.Shortcut>
                  </Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          With Link Items
        </h3>
        <p class="text-xs text-muted-foreground">
          <code>Command.LinkItem</code> renders an <code>&lt;a&gt;</code> element
          for navigation.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disableInitialScroll={true}>
              <Command.Input placeholder="Search pages..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No pages found.</Command.Empty>
                  <Command.Group>
                    <Command.GroupHeading>Pages</Command.GroupHeading>
                    <Command.GroupItems>
                      <Command.LinkItem value="home" href="/">
                        <Icon icon="inbox" />
                        Home
                      </Command.LinkItem>
                      <Command.LinkItem value="docs" href="/docs">
                        <Icon icon="info" />
                        Documentation
                      </Command.LinkItem>
                      <Command.LinkItem
                        value="github"
                        href="https://github.com"
                      >
                        <Icon icon="code" />
                        GitHub
                        <Command.Shortcut>↗</Command.Shortcut>
                      </Command.LinkItem>
                    </Command.GroupItems>
                  </Command.Group>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Dialog (modal)
        </h3>
        <p class="text-xs text-muted-foreground">
          The command palette displayed in a floating dialog. Press
          <Kbd hotkey="meta+k" /> or click the button to open.
        </p>
        <Button variant="outline" onclick={() => (commandDialogOpen = true)}>
          <Icon icon="search" />
          Open Command Palette
          <Kbd hotkey="meta+k" kbdClass="ml-1" />
        </Button>
        <Dialog.Root bind:open={commandDialogOpen}>
          <Command.Dialog>
            <Command.Root loop disableInitialScroll={true}>
              <Command.Input placeholder="Type a command or search..." />
              <Command.List class="max-h-[320px]">
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Group>
                    <Command.GroupHeading>Applications</Command.GroupHeading>
                    <Command.GroupItems>
                      {#each commandApplications as item (item.value)}
                        <Command.Item
                          value={item.value}
                          onSelect={() => (commandDialogOpen = false)}
                        >
                          <Icon icon="app_window" />
                          {item.label}
                        </Command.Item>
                      {/each}
                    </Command.GroupItems>
                  </Command.Group>
                  <Command.Separator />
                  <Command.Group>
                    <Command.GroupHeading>Actions</Command.GroupHeading>
                    <Command.GroupItems>
                      {#each commandActions as item (item.value)}
                        <Command.Item
                          value={item.value}
                          onSelect={() => (commandDialogOpen = false)}
                        >
                          <Icon icon="command" />
                          {item.label}
                        </Command.Item>
                      {/each}
                    </Command.GroupItems>
                  </Command.Group>
                </Command.Viewport>
              </Command.List>
              <Command.Footer>
                <span class="flex items-center gap-3">
                  <span>↑↓ navigate</span>
                  <span>↵ select</span>
                </span>
                <span>esc close</span>
              </Command.Footer>
            </Command.Root>
          </Command.Dialog>
        </Dialog.Root>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Controlled Value
        </h3>
        <p class="text-xs text-muted-foreground">
          Bind to <code>value</code> to track or control the highlighted item.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root bind:value={commandValue} disableInitialScroll={true}>
              <Command.Input placeholder="Navigate with arrow keys..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  {#each commandItems as item (item.value)}
                    <Command.Item value={item.value}>{item.label}</Command.Item>
                  {/each}
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
          <p class="mt-2 text-xs text-muted-foreground">
            Selected value: <span class="font-mono text-foreground"
              >{commandValue || "(none)"}</span
            >
          </p>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Custom Filter (<code>shouldFilter=false</code>)
        </h3>
        <p class="text-xs text-muted-foreground">
          Disable built-in scoring and handle filtering yourself — useful for
          async search or strict prefix matching.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root shouldFilter={false} disableInitialScroll={true}>
              <Command.Input
                placeholder="Strict prefix match..."
                oninput={(e: Event) =>
                  (commandCustomSearch = (e.currentTarget as HTMLInputElement)
                    .value)}
              />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  {#each commandCustomFiltered as item (item.value)}
                    <Command.Item value={item.value}>{item.label}</Command.Item>
                  {/each}
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>
      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">Loading State</h3>
        <p class="text-xs text-muted-foreground">
          Use <code>Command.Loading</code> while fetching async results.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disableInitialScroll={true}>
              <Command.Input placeholder="Search..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Loading />
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Loop Navigation
        </h3>
        <p class="text-xs text-muted-foreground">
          With <code>loop</code>, pressing arrow-down on the last item wraps to
          the first, and arrow-up on the first wraps to the last.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root loop disableInitialScroll={true}>
              <Command.Input placeholder="Try arrow keys at the edges..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Item value="alpha">Alpha</Command.Item>
                  <Command.Item value="bravo">Bravo</Command.Item>
                  <Command.Item value="charlie">Charlie</Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Vim Bindings Disabled
        </h3>
        <p class="text-xs text-muted-foreground">
          <code>vimBindings=false</code> turns off <kbd>Ctrl+J</kbd>/<kbd
            >Ctrl+K</kbd
          >
          navigation. Only standard arrow keys work.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root vimBindings={false} disableInitialScroll={true}>
              <Command.Input placeholder="Ctrl+J/K won't navigate..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Item value="delta">Delta</Command.Item>
                  <Command.Item value="echo">Echo</Command.Item>
                  <Command.Item value="foxtrot">Foxtrot</Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Pointer Selection Disabled
        </h3>
        <p class="text-xs text-muted-foreground">
          <code>disablePointerSelection</code> prevents hover from changing the active
          item. Only keyboard navigation selects.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disablePointerSelection disableInitialScroll={true}>
              <Command.Input placeholder="Hover won't select..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Item value="golf">Golf</Command.Item>
                  <Command.Item value="hotel">Hotel</Command.Item>
                  <Command.Item value="india">India</Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Disabled Items &amp; Force-Mounted Items
        </h3>
        <p class="text-xs text-muted-foreground">
          <code>disabled</code> items cannot be selected.
          <code>forceMount</code>
          keeps an item visible even when it doesn't match the current search.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root disableInitialScroll={true}>
              <Command.Input placeholder="Type to filter..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No results found.</Command.Empty>
                  <Command.Item value="enabled-one">Enabled One</Command.Item>
                  <Command.Item value="disabled-item" disabled
                    >Disabled Item</Command.Item
                  >
                  <Command.Item value="always-visible" forceMount
                    >Always Visible (forceMount)</Command.Item
                  >
                  <Command.Item value="enabled-two">Enabled Two</Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground">
          Custom ARIA Label
        </h3>
        <p class="text-xs text-muted-foreground">
          Pass <code>label</code> to set the accessible name for screen readers.
          Inspect the element to verify <code>aria-label</code>.
        </p>
        <div class="w-full max-w-md">
          <Command.Panel>
            <Command.Root
              label="Project search palette"
              disableInitialScroll={true}
            >
              <Command.Input placeholder="Search projects..." />
              <Command.List>
                <Command.Viewport>
                  <Command.Empty>No projects found.</Command.Empty>
                  <Command.Item value="proj-alpha">Project Alpha</Command.Item>
                  <Command.Item value="proj-beta">Project Beta</Command.Item>
                </Command.Viewport>
              </Command.List>
            </Command.Root>
          </Command.Panel>
        </div>
      </div>
    </section>

    <!-- Tooltip -->
    <section id="tooltip" class="space-y-4 pb-96">
      <h2 class="text-2xl font-semibold border-b pb-2">Tooltip</h2>
      <div class="space-y-4">
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button variant="outline" size="sm" {...props}>Tiny</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="px-2 py-1 text-xs"
            >This is a simple tooltip</Tooltip.Content
          >
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Default</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="px-2 py-1 text-xs" side="top"
            >This is a simple tooltip from the top</Tooltip.Content
          >
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Bottom</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="px-2 py-1 text-xs" side="bottom"
            >This is a simple tooltip from the bottom</Tooltip.Content
          >
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Left</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="px-2 py-1 text-xs" side="left"
            >This is a simple tooltip from the left</Tooltip.Content
          >
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button variant="outline" {...props}>Right</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content class="px-2 py-1 text-xs" side="right"
            >This is a simple tooltip from the right</Tooltip.Content
          >
        </Tooltip.Root>
      </div>
    </section>
  </div>
</div>

<Button
  variant="default"
  size="sm"
  class="fixed right-6 bottom-6 z-50 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
  onclick={toggleDarkMode}
>
  {#if isDark}
    Light mode
  {:else}
    Dark mode
  {/if}
</Button>

<style>
  .toc-link {
    display: block;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
    border-radius: 0.375rem;
    transition: color 0.2s ease;
    position: relative;
    z-index: 10;
  }
  .toc-link:hover {
    color: var(--foreground);
  }
  .toc-active {
    color: var(--foreground);
    font-weight: 500;
  }
</style>
