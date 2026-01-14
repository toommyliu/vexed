<script>
  import "$lib/styles.css";
  import {
    Group,
    Tabs,
    Menu,
    Alert,
    Switch,
    NumberField,
    Button,
    Input,
    Checkbox,
    Select,
    Badge,
    Kbd,
    Label,
    Card,
    Table,
    Dialog,
    Combobox,
    Dropdown,
    Frame,
    Textarea,
    InputGroup,
    Field,
    Separator,
  } from "$lib";
  import { onMount } from "svelte";

  import Check from "$lib/components/icons/Check.svelte";
  import ChevronDown from "$lib/components/icons/ChevronDown.svelte";
  import ChevronUp from "$lib/components/icons/ChevronUp.svelte";
  import ChevronsUpDown from "$lib/components/icons/ChevronsUpDown.svelte";
  import Copy from "$lib/components/icons/Copy.svelte";
  import Download from "$lib/components/icons/Download.svelte";
  import Loader from "$lib/components/icons/Loader.svelte";
  import Pause from "$lib/components/icons/Pause.svelte";
  import Pencil from "$lib/components/icons/Pencil.svelte";
  import Play from "$lib/components/icons/Play.svelte";
  import Plus from "$lib/components/icons/Plus.svelte";
  import Search from "$lib/components/icons/Search.svelte";
  import Share2 from "$lib/components/icons/Share2.svelte";
  import Trash2 from "$lib/components/icons/Trash2.svelte";
  import X from "$lib/components/icons/X.svelte";
  import AlertTriangle from "$lib/components/icons/AlertTriangle.svelte";
  import AppWindow from "$lib/components/icons/AppWindow.svelte";
  import Code from "$lib/components/icons/Code.svelte";
  import Inbox from "$lib/components/icons/Inbox.svelte";
  import Radio from "$lib/components/icons/Radio.svelte";
  import RotateCcw from "$lib/components/icons/RotateCcw.svelte";
  import Settings from "$lib/components/icons/Settings.svelte";
  import Wrench from "$lib/components/icons/Wrench.svelte";
  import AlertCircle from "$lib/components/icons/AlertCircle.svelte";
  import Eye from "$lib/components/icons/Eye.svelte";
  import EyeOff from "$lib/components/icons/EyeOff.svelte";
  import Command from "$lib/components/icons/Command.svelte";
  import ArrowDownToLine from "$lib/components/icons/ArrowDownToLine.svelte";
  import Upload from "$lib/components/icons/Upload.svelte";
  import ChevronRight from "$lib/components/icons/ChevronRight.svelte";

  let switchChecked = $state(false);
  let switchUnchecked = $state(false);
  let numberValue = $state(10);
  let tabValue = $state("account");
  let isDark = $state(false);
  let inputValue = $state("");
  let selectValue = $state("");

  let frameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
  ];

  let selectedFramework = $state("sveltekit");
  let comboboxInputValue = $state("");
  let comboboxOpen = $state(false);

  let filteredFrameworks = $derived(
    frameworks.filter((f) =>
      f.label.toLowerCase().includes(comboboxInputValue.toLowerCase())
    )
  );

  let dropdownValue = $state("apple");

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
</script>

<div
  class="p-8 space-y-12 min-h-screen bg-background text-foreground transition-colors duration-300"
>
  <div class="flex items-center justify-between max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold">UI Components Demo</h1>
    <Button variant="outline" onclick={toggleDarkMode}>
      {isDark ? "Light Mode" : "Dark Mode"}
    </Button>
  </div>

  <div class="space-y-12 max-w-4xl mx-auto">
    <!-- Icons -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Icons</h2>
      <p class="text-sm text-muted-foreground">
        Inlined Lucide icons bundled with the library.
      </p>
      <div class="grid grid-cols-5 md:grid-cols-8 gap-4">
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Check class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Check</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <ChevronDown class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">ChevronDown</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <ChevronUp class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">ChevronUp</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <ChevronsUpDown class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">ChevronsUpDown</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Copy class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Copy</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Download class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Download</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Loader class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Loader</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Pause class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Pause</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Pencil class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Pencil</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Play class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Play</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Plus class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Plus</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Search class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Search</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Share2 class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Share2</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Trash2 class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Trash2</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <X class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">X</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <AlertTriangle class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">AlertTriangle</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <AppWindow class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">AppWindow</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Code class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Code</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Inbox class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Inbox</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Radio class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Radio</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <RotateCcw class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">RotateCcw</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Settings class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Settings</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Wrench class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Wrench</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <AlertCircle class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">AlertCircle</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Eye class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Eye</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <EyeOff class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">EyeOff</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Command class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Command</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <ArrowDownToLine class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">ArrowDownToLine</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <Upload class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">Upload</span>
        </div>
        <div
          class="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card"
        >
          <ChevronRight class="h-5 w-5" />
          <span class="text-xs text-muted-foreground">ChevronRight</span>
        </div>
      </div>
    </section>

    <!-- Button -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Button</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Variants</h3>
          <div class="flex gap-2 flex-wrap">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="destructive-outline">Destructive Outline</Button>
            <Button variant="success">Success</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Sizes</h3>
          <div class="flex gap-2 flex-wrap items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">icon</Button>
          </div>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">States</h3>
          <div class="flex gap-2 flex-wrap">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Badge -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Badge</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Variants</h3>
          <div class="flex gap-2 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
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
    <section class="space-y-4">
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
        <Alert.Root variant="destructive">
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
            class="lucide lucide-alert-circle h-4 w-4"
            ><circle cx="12" cy="12" r="10" /><line
              x1="12"
              x2="12"
              y1="8"
              y2="12"
            /><line x1="12" x2="12.01" y1="16" y2="16" /></svg
          >
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>
            Your session has expired. Please log in again.
          </Alert.Description>
        </Alert.Root>
      </div>
    </section>

    <!-- Input & Label -->
    <section class="space-y-4">
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
          </div>
        </div>
      </div>
    </section>

    <!-- Checkbox -->
    <section class="space-y-4">
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
            <Checkbox id="indeterminate-checkbox" checked="indeterminate" />
            <Label for="indeterminate-checkbox">Indeterminate</Label>
          </div>
        </div>
      </div>
    </section>

    <!-- Select -->
    <section class="space-y-6">
      <h2 class="text-2xl font-semibold border-b pb-2">Select</h2>

      <!-- Size Variants -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Size Variants</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label>Small</Label>
            <Select.Root bind:value={selectValue} class="w-full">
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
            <Select.Root bind:value={selectValue} class="w-full">
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
            <Select.Root bind:value={selectValue} class="w-full">
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

      <!-- Groups and Separators -->
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
          Selected: {selectValue || "None"}
        </p>
      </div>

      <!-- Long List with Scroll -->
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

      <!-- Disabled State -->
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
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Combobox</h2>
      <div class="space-y-4">
        <div class="w-[200px]">
          <Combobox.Root
            bind:value={selectedFramework}
            bind:inputValue={comboboxInputValue}
            bind:open={comboboxOpen}
            onValueChange={(v) => {
              console.log("Selected:", v);
              const fw = frameworks.find((f) => f.value === v);
              if (fw) comboboxInputValue = fw.label;
            }}
          >
            <div class="relative">
              <Combobox.Input placeholder="Select framework..." />
              <Combobox.Trigger />
            </div>
            <Combobox.Content>
              <Combobox.List>
                <Combobox.Group>
                  <Combobox.GroupLabel>Frameworks</Combobox.GroupLabel>
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
                </Combobox.Group>
              </Combobox.List>
            </Combobox.Content>
          </Combobox.Root>
        </div>
        <div class="text-sm text-muted-foreground">
          Selected: {selectedFramework}
        </div>
      </div>
    </section>

    <!-- Dropdown -->
    <section class="space-y-4">
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
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Switch</h2>
      <div class="flex gap-8">
        <div class="flex items-center gap-2">
          <Switch bind:checked={switchChecked} id="airplane-mode" />
          <Label for="airplane-mode">Airplane Mode</Label>
        </div>
        <div class="flex items-center gap-2">
          <Switch disabled checked id="disabled-switch" />
          <Label for="disabled-switch">Disabled</Label>
        </div>
      </div>
    </section>

    <!-- NumberField -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">NumberField</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Default (0-100)</Label>
          <NumberField.Root
            bind:value={numberValue}
            min={0}
            max={100}
            class="w-[150px]"
          >
            <NumberField.Group>
              <NumberField.Input />
              <NumberField.Increment />
              <NumberField.Decrement />
            </NumberField.Group>
          </NumberField.Root>
        </div>
        <div class="space-y-2">
          <Label>Step 0.5</Label>
          <NumberField.Root value={1.5} step={0.5} class="w-[150px]">
            <NumberField.Group>
              <NumberField.Input />
              <NumberField.Increment />
              <NumberField.Decrement />
            </NumberField.Group>
          </NumberField.Root>
        </div>
      </div>
    </section>

    <!-- Tabs -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Tabs</h2>
      <Tabs.Root bind:value={tabValue} class="w-[400px]">
        <Tabs.List class="grid w-full grid-cols-2">
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
          <Tabs.Trigger value="password">Password</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          <Card.Root>
            <Card.Header>
              <Card.Title>Account</Card.Title>
              <Card.Description
                >Make changes to your account here.</Card.Description
              >
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
      </Tabs.Root>
    </section>

    <!-- Menu -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Menu</h2>
      <Menu.Root>
        <Menu.Trigger>
          <Button variant="outline">Open Menu</Button>
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
          <Menu.Item class="text-destructive">Log out</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </section>

    <!-- Group -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Group</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Horizontal</h3>
          <Group.Root>
            <Group.Text>Item 1</Group.Text>
            <Group.Separator />
            <Group.Text>Item 2</Group.Text>
            <Group.Separator />
            <Group.Text>Item 3</Group.Text>
          </Group.Root>
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Vertical</h3>
          <Group.Root orientation="vertical">
            <Group.Text>Item 1</Group.Text>
            <Group.Separator orientation="horizontal" />
            <Group.Text>Item 2</Group.Text>
            <Group.Separator orientation="horizontal" />
            <Group.Text>Item 3</Group.Text>
          </Group.Root>
        </div>
      </div>
    </section>

    <!-- Kbd -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Kbd</h2>
      <div class="flex gap-4 items-center">
        <p class="text-sm text-muted-foreground">
          Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to search.
        </p>
        <p class="text-sm text-muted-foreground">
          Press <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy.
        </p>
      </div>
    </section>

    <!-- Card -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Card</h2>
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
          <Card.Footer class="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
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
    </section>

    <!-- Table -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Table</h2>
      <div class="space-y-6">
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Basic Table</h3>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-[100px]">ID</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head class="text-right">Amount</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell class="font-medium">INV001</Table.Cell>
                <Table.Cell>John Doe</Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant="default">Paid</Badge>
                </Table.Cell>
                <Table.Cell class="text-right">$250.00</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium">INV002</Table.Cell>
                <Table.Cell>Jane Smith</Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant="secondary">Pending</Badge>
                </Table.Cell>
                <Table.Cell class="text-right">$150.00</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium">INV003</Table.Cell>
                <Table.Cell>Bob Johnson</Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant="default">Paid</Badge>
                </Table.Cell>
                <Table.Cell class="text-right">$350.00</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium">INV004</Table.Cell>
                <Table.Cell>Alice Williams</Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant="destructive">Overdue</Badge>
                </Table.Cell>
                <Table.Cell class="text-right">$450.00</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </div>

        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Table with Selection
          </h3>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-[50px]">
                  <Checkbox />
                </Table.Head>
                <Table.Head>Username</Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Role</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <Checkbox />
                </Table.Cell>
                <Table.Cell class="font-medium">admin</Table.Cell>
                <Table.Cell>admin@example.com</Table.Cell>
                <Table.Cell>Administrator</Table.Cell>
              </Table.Row>
              <Table.Row data-state="selected">
                <Table.Cell>
                  <Checkbox checked />
                </Table.Cell>
                <Table.Cell class="font-medium">user123</Table.Cell>
                <Table.Cell>user@example.com</Table.Cell>
                <Table.Cell>User</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <Checkbox />
                </Table.Cell>
                <Table.Cell class="font-medium">guest</Table.Cell>
                <Table.Cell>guest@example.com</Table.Cell>
                <Table.Cell>Guest</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </div>

        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            Table with Footer & Caption
          </h3>
          <Table.Root>
            <Table.Caption>A list of your recent transactions.</Table.Caption>
            <Table.Header>
              <Table.Row>
                <Table.Head>Transaction</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head class="text-right">Amount</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Payment received</Table.Cell>
                <Table.Cell>2024-01-15</Table.Cell>
                <Table.Cell class="text-right">$100.00</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Refund issued</Table.Cell>
                <Table.Cell>2024-01-14</Table.Cell>
                <Table.Cell class="text-right">-$25.00</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Payment received</Table.Cell>
                <Table.Cell>2024-01-13</Table.Cell>
                <Table.Cell class="text-right">$75.00</Table.Cell>
              </Table.Row>
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.Cell colspan="2">Total</Table.Cell>
                <Table.Cell class="text-right">$150.00</Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </div>
      </div>
    </section>

    <!-- Dialog -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Dialog</h2>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button>Edit Profile</Button>
        </Dialog.Trigger>
        <Dialog.Content class="sm:max-w-[425px]">
          <Dialog.Header>
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description>
              Make changes to your profile here. Click save when you're done.
              <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label for="dialog-name" class="text-right">Name</Label>
                  <Input
                    id="dialog-name"
                    value="Pedro Duarte"
                    class="col-span-3"
                  />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <Label for="dialog-username" class="text-right"
                    >Username</Label
                  >
                  <Input
                    id="dialog-username"
                    value="@peduarte"
                    class="col-span-3"
                  />
                </div>
              </div>
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button>Save changes</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </section>

    <!-- Frame -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Frame</h2>
      <div class="space-y-4">
        <Frame.Root>
          <Frame.Header>
            <Frame.Title>Accounts</Frame.Title>
            <Frame.Description>Manage your game accounts.</Frame.Description>
          </Frame.Header>
          <Frame.Panel>
            <Table.Root
              class="border-separate border-spacing-x-0 border-spacing-y-1"
            >
              <Table.Body>
                <Table.Row
                  class="hover:[&>td]:bg-muted/50 cursor-pointer hover:bg-transparent [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md"
                >
                  <Table.Cell>
                    <Checkbox />
                  </Table.Cell>
                  <Table.Cell class="font-medium">user1</Table.Cell>
                  <Table.Cell class="text-right">
                    <Button variant="ghost" size="icon-sm">
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
                        class="lucide lucide-pencil h-4 w-4"
                        ><path
                          d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                        /><path d="m15 5 4 4" /></svg
                      >
                    </Button>
                  </Table.Cell>
                </Table.Row>
                <Table.Row
                  class="hover:[&>td]:bg-muted/50 cursor-pointer hover:bg-transparent [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md"
                >
                  <Table.Cell>
                    <Checkbox checked />
                  </Table.Cell>
                  <Table.Cell class="font-medium">user2</Table.Cell>
                  <Table.Cell class="text-right">
                    <Button variant="ghost" size="icon-sm">
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
                        class="lucide lucide-pencil h-4 w-4"
                        ><path
                          d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                        /><path d="m15 5 4 4" /></svg
                      >
                    </Button>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Frame.Panel>
          <Frame.Footer>
            <Button class="w-full">Add Account</Button>
          </Frame.Footer>
        </Frame.Root>
      </div>
    </section>

    <!-- Textarea -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Textarea</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Default</Label>
          <Textarea placeholder="Type your message here." />
        </div>
        <div class="space-y-2">
          <Label>Small</Label>
          <Textarea size="sm" placeholder="Type your message here." />
        </div>
        <div class="space-y-2">
          <Label>Large</Label>
          <Textarea size="lg" placeholder="Type your message here." />
        </div>
        <div class="space-y-2">
          <Label>Disabled</Label>
          <Textarea disabled placeholder="Type your message here." />
        </div>
      </div>
    </section>

    <!-- InputGroup -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">InputGroup</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>With Text Addon</Label>
          <InputGroup.Root>
            <InputGroup.Addon>
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Addon>
            <Input placeholder="Username" />
          </InputGroup.Root>
        </div>
        <div class="space-y-2">
          <Label>With Button Addon</Label>
          <InputGroup.Root>
            <Input placeholder="Search..." />
            <InputGroup.Addon>
              <Button variant="ghost" size="icon">
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
                  class="lucide lucide-search"
                  ><circle cx="11" cy="11" r="8" /><path
                    d="m21 21-4.3-4.3"
                  /></svg
                >
              </Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>
        <div class="space-y-2">
          <Label>With Icon Button</Label>
          <InputGroup.Root>
            <Input value="https://coss.com" readonly />
            <InputGroup.Addon align="inline-end">
              <Button variant="ghost" size="icon">
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
                  class="lucide lucide-copy"
                  ><rect
                    width="14"
                    height="14"
                    x="8"
                    y="8"
                    rx="2"
                    ry="2"
                  /><path
                    d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                  /></svg
                >
              </Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>
        <div class="space-y-2">
          <Label>With Textarea</Label>
          <InputGroup.Root>
            <Textarea placeholder="Type your message here." />
            <InputGroup.Addon align="block-end">
              <div class="flex w-full justify-between">
                <span class="text-xs text-muted-foreground">0/500</span>
                <Button size="sm">Send</Button>
              </div>
            </InputGroup.Addon>
          </InputGroup.Root>
        </div>
      </div>
    </section>

    <!-- Field -->
    <section class="space-y-4">
      <h2 class="text-2xl font-semibold border-b pb-2">Field</h2>
      <div class="space-y-4">
        <Field.Root>
          <Field.Label>Username</Field.Label>
          <Input placeholder="Enter username" />
          <Field.Description>
            This is your public display name.
          </Field.Description>
        </Field.Root>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input placeholder="Enter email" />
          <Field.Error>Invalid email address.</Field.Error>
        </Field.Root>
      </div>
    </section>

    <!-- Separator -->
    <section class="space-y-4">
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
  </div>
</div>
