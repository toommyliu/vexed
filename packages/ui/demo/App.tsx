import "@vexed/ui/styles.css";
import "./demo.css";
import { createEffect, createSignal, For } from "solid-js";
import { render } from "solid-js/web";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
  Checkbox,
  Alert,
  AlertAction,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dropdown,
  Command,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupHeading,
  CommandGroupItems,
  CommandInput,
  CommandItem,
  CommandLinkItem,
  CommandList,
  CommandLoading,
  CommandPanel,
  CommandShortcut,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IconButton,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  type InputGroupAddonAlign,
  Kbd,
  Label,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsVariant,
  Textarea,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
  VisuallyHidden,
  type AlertVariant,
  type BadgeSize,
  type BadgeVariant,
  type ButtonSize,
  type ButtonVariant,
  type EmptyMediaVariant,
  type IconButtonSize,
} from "@vexed/ui";
import {
  Check,
  Copy,
  Inbox,
  Pause,
  Play,
  Search,
  Settings,
  ShieldAlert,
  X,
} from "lucide-solid";

const badgeSizes = [
  "sm",
  "default",
  "lg",
] as const satisfies readonly BadgeSize[];
const badgeVariants = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "error",
  "info",
  "success",
  "warning",
] as const satisfies readonly BadgeVariant[];
const badgeVariantLabels: Record<BadgeVariant, string> = {
  default: "Default",
  destructive: "Destructive",
  error: "Error",
  info: "Info",
  outline: "Outline",
  secondary: "Secondary",
  success: "Success",
  warning: "Warning",
};
const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "destructive-outline",
  "link",
] as const satisfies readonly ButtonVariant[];
const buttonSizes = [
  "xs",
  "sm",
  "default",
  "lg",
  "xl",
] as const satisfies readonly ButtonSize[];
const iconButtonSizes = [
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
  "icon-xl",
] as const satisfies readonly IconButtonSize[];
const alertVariants = [
  "default",
  "error",
  "info",
  "success",
  "warning",
] as const satisfies readonly AlertVariant[];
const fieldSizes = ["sm", "default", "lg"] as const;
const inputGroupAligns = [
  "inline-start",
  "inline-end",
  "block-start",
  "block-end",
] as const satisfies readonly InputGroupAddonAlign[];
const spinnerSizes = ["sm", "md", "lg"] as const;
const tabsVariants = [
  "default",
  "underline",
] as const satisfies readonly TabsVariant[];
const tooltipPlacements = ["top", "right", "bottom", "left"] as const;
const emptyMediaVariants = [
  "default",
  "icon",
] as const satisfies readonly EmptyMediaVariant[];

function DemoApp() {
  const [dark, setDark] = createSignal(false);
  const [dropdownTarget, setDropdownTarget] = createSignal("");
  const [framework, setFramework] = createSignal("solid");
  const [menuMode, setMenuMode] = createSignal("safe");
  const [target, setTarget] = createSignal("");

  createEffect(() => {
    const theme = dark() ? "dark" : "light";
    const root = document.documentElement;
    root.classList.add("demo-theme-changing");
    root.classList.toggle("dark", dark());
    root.setAttribute("data-theme", theme);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        root.classList.remove("demo-theme-changing");
      });
    });
  });

  return (
    <main
      class="demo-shell"
      classList={{ dark: dark() }}
      data-theme={dark() ? "dark" : "light"}
    >
      <section class="demo-page">
        <header class="demo-header">
          <div class="demo-toolbar">
            <Switch
              checked={dark()}
              onChange={(event) => setDark(event.currentTarget.checked)}
            >
              Dark
            </Switch>
          </div>
        </header>

        <div class="demo-grid">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Variants, icon buttons, and loading state.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">hello</Badge>
              </CardAction>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-matrix">
                <For each={buttonVariants}>
                  {(variant) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">{variant}</span>
                      <div class="demo-row">
                        <For each={buttonSizes}>
                          {(size) => (
                            <Button size={size} variant={variant}>
                              {size}
                            </Button>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Separator />
              <div class="demo-matrix">
                <For
                  each={buttonVariants.filter((variant) => variant !== "link")}
                >
                  {(variant) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">{variant}</span>
                      <div class="demo-row">
                        <For each={iconButtonSizes}>
                          {(size) => (
                            <IconButton
                              aria-label={`${variant} ${size}`}
                              size={size}
                              variant={variant}
                            >
                              <Settings class="button__icon" />
                            </IconButton>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="demo-row">
                <Button loading variant="outline">
                  Syncing
                </Button>
                <Button disabled variant="outline">
                  Disabled
                </Button>
                <Button size="sm">
                  <Play class="button__icon" />
                  With icon
                </Button>
                <Button size="xl" variant="destructive-outline">
                  <Copy class="button__icon" />
                  Review
                </Button>
                <Button as="a" href="#" variant="link">
                  Link action
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Native form controls remain composable.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-form">
              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">input {size}</span>
                      <div class="demo-row demo-row--stretch">
                        <Input size={size} placeholder="Default value" />
                        <Input invalid size={size} value="Invalid value" />
                        <Input disabled size={size} value="Disabled" />
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">textarea {size}</span>
                      <div class="demo-row demo-row--stretch">
                        <Textarea size={size} value="Default textarea" />
                        <Textarea
                          invalid
                          size={size}
                          value="Invalid textarea"
                        />
                        <Textarea disabled size={size} value="Disabled" />
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Textarea
                fullWidth
                unstyled
                value="Unstyled textarea for embedded layouts"
              />
              <Separator />
              <div class="demo-row">
                <Checkbox>Unchecked</Checkbox>
                <Checkbox checked>Checked</Checkbox>
                <Checkbox invalid>Invalid</Checkbox>
                <Checkbox disabled>Disabled</Checkbox>
              </div>
              <div class="demo-row">
                <Switch>Off</Switch>
                <Switch checked>On</Switch>
                <Switch invalid>Invalid</Switch>
                <Switch disabled>Disabled</Switch>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overlays</CardTitle>
              <CardDescription>
                Dialog and alert dialog composition.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-row">
                <Dialog>
                  <DialogTrigger class="button button--outline button--size-default">
                    Open dialog
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Runtime settings</DialogTitle>
                      <DialogDescription>
                        Configure compact runtime preferences.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogPanel class="demo-form">
                      <Label for="dialog-name">Preset name</Label>
                      <Input fullWidth id="dialog-name" value="Daily review" />
                    </DialogPanel>
                    <DialogFooter>
                      <DialogClose>Done</DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger class="button button--destructive button--size-default">
                    Stop process
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Stop this process?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Current background work will be cancelled.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Stop</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <For each={alertVariants}>
                {(variant) => (
                  <Alert variant={variant}>
                    <AlertTitle>{variant} alert</AlertTitle>
                    <AlertDescription>
                      Responses are taking longer than expected.
                    </AlertDescription>
                    <AlertAction>
                      <Button size="sm" variant="outline">
                        Retry
                      </Button>
                    </AlertAction>
                  </Alert>
                )}
              </For>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select and Combobox</CardTitle>
              <CardDescription>
                Collection primitives with shared component styling.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-form">
              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">select {size}</span>
                      <Select
                        value={[framework()]}
                        onValueChange={(details) =>
                          setFramework(details.value[0] ?? "")
                        }
                      >
                        <SelectTrigger size={size}>
                          <SelectValue placeholder="Select framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="svelte">Svelte</SelectItem>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem disabled value="disabled">
                            Disabled
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </For>
              </div>

              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">combobox {size}</span>
                      <Combobox
                        inputBehavior="autohighlight"
                        value={target() ? [target()] : []}
                        onValueChange={(details) =>
                          setTarget(details.value[0] ?? "")
                        }
                      >
                        <ComboboxInput
                          placeholder="Search target..."
                          showClear
                          size={size}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No target found.</ComboboxEmpty>
                          <ComboboxList>
                            <ComboboxItem value="overview">
                              Overview
                            </ComboboxItem>
                            <ComboboxItem value="reports">Reports</ComboboxItem>
                            <ComboboxItem value="settings">
                              Settings
                            </ComboboxItem>
                            <ComboboxItem disabled value="disabled">
                              Disabled
                            </ComboboxItem>
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dropdown</CardTitle>
              <CardDescription>
                Readonly combobox wrapper for simple selections.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">dropdown {size}</span>
                      <Dropdown
                        size={size}
                        value={dropdownTarget()}
                        onValueChange={setDropdownTarget}
                        placeholder="Choose target"
                      >
                        <ComboboxItem value="overview">Overview</ComboboxItem>
                        <ComboboxItem value="reports">Reports</ComboboxItem>
                        <ComboboxItem value="settings">Settings</ComboboxItem>
                      </Dropdown>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Input Group</CardTitle>
              <CardDescription>
                Inputs and textareas with inline or block addons.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-matrix">
                <For each={fieldSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">input group {size}</span>
                      <InputGroup size={size}>
                        <InputGroupAddon>
                          <Search />
                          <InputGroupText>/join</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput placeholder="battleon" />
                        <InputGroupAddon align="inline-end">
                          <Badge size="sm" variant="outline">
                            map
                          </Badge>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                  )}
                </For>
              </div>

              <div class="demo-matrix">
                <For each={inputGroupAligns}>
                  {(align) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">addon {align}</span>
                      <InputGroup
                        invalid={align === "block-end"}
                        disabled={align === "inline-end"}
                      >
                        <InputGroupAddon align={align}>
                          <InputGroupText>{align}</InputGroupText>
                        </InputGroupAddon>
                        {align === "block-start" || align === "block-end" ? (
                          <InputGroupTextarea value="Grouped textarea" />
                        ) : (
                          <InputGroupInput value="Grouped input" />
                        )}
                      </InputGroup>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu</CardTitle>
              <CardDescription>
                Dense action menus with checkbox, radio, and submenu items.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-row demo-row--stretch">
                <Menu>
                  <MenuTrigger class="button button--outline button--size-default">
                    Default menu
                  </MenuTrigger>
                  <MenuContent>
                    <MenuGroup>
                      <MenuLabel>Actions</MenuLabel>
                      <MenuItem value="sync">
                        Sync
                        <MenuShortcut>Cmd+S</MenuShortcut>
                      </MenuItem>
                      <MenuCheckboxItem checked value="drops">
                        Watch drops
                      </MenuCheckboxItem>
                      <MenuRadioGroup
                        value={menuMode()}
                        onValueChange={(details) => setMenuMode(details.value)}
                      >
                        <MenuRadioItem value="safe">Safe mode</MenuRadioItem>
                        <MenuRadioItem value="fast">Fast mode</MenuRadioItem>
                      </MenuRadioGroup>
                      <MenuSeparator />
                      <MenuSub>
                        <MenuSubTrigger value="more">More</MenuSubTrigger>
                        <MenuSubContent>
                          <MenuItem value="copy">Copy ID</MenuItem>
                        </MenuSubContent>
                      </MenuSub>
                    </MenuGroup>
                  </MenuContent>
                </Menu>

                <Menu>
                  <MenuTrigger class="button button--destructive-outline button--size-default">
                    Variant menu
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem inset value="inset">
                      Inset item
                    </MenuItem>
                    <MenuItem variant="destructive" value="delete">
                      Delete
                    </MenuItem>
                    <MenuItem disabled value="disabled">
                      Disabled
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>
                Horizontal and vertical tab sets with variant styles.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-matrix">
                <For each={tabsVariants}>
                  {(variant) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">tabs {variant}</span>
                      <Tabs defaultValue="overview">
                        <TabsList variant={variant}>
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="logs">Logs</TabsTrigger>
                          <TabsTrigger disabled value="disabled">
                            Disabled
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                          <Alert>
                            <AlertTitle>Overview</AlertTitle>
                            <AlertDescription>
                              Tabs share compact focus and active states.
                            </AlertDescription>
                          </Alert>
                        </TabsContent>
                        <TabsContent value="logs">
                          <CommandLoading>
                            <Spinner size="sm" />
                            Waiting for records
                          </CommandLoading>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </For>
              </div>

              <Tabs defaultValue="overview" orientation="vertical">
                <TabsList variant="underline">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <span class="demo-muted">Vertical underline tabs</span>
                </TabsContent>
                <TabsContent value="logs">
                  <span class="demo-muted">Log panel</span>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tooltip</CardTitle>
              <CardDescription>
                Compact positioned hints with optional arrows.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-row">
                <For each={tooltipPlacements}>
                  {(placement) => (
                    <Tooltip positioning={{ placement }}>
                      <TooltipTrigger class="button button--ghost button--size-default">
                        {placement}
                      </TooltipTrigger>
                      <TooltipContent>
                        Tooltip {placement}
                        <TooltipArrow />
                      </TooltipContent>
                    </Tooltip>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Command</CardTitle>
              <CardDescription>
                Filtered command palette primitives.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommandPanel>
                <Command loop>
                  <CommandInput placeholder="Search commands..." />
                  <CommandList>
                    <CommandEmpty>No command found.</CommandEmpty>
                    <CommandGroup>
                      <CommandGroupHeading>Actions</CommandGroupHeading>
                      <CommandGroupItems>
                        <CommandItem value="start">
                          <span>Start process</span>
                          <CommandShortcut>Enter</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                          value="search"
                          keywords={["find", "lookup"]}
                        >
                          <span>Search records</span>
                          <Search class="button__icon" />
                        </CommandItem>
                        <CommandItem value="guard">
                          <span>Enable guard rails</span>
                          <ShieldAlert class="button__icon" />
                        </CommandItem>
                        <CommandLinkItem href="#" value="docs">
                          <span>Open docs</span>
                          <CommandShortcut>⌘K</CommandShortcut>
                        </CommandLinkItem>
                      </CommandGroupItems>
                    </CommandGroup>
                  </CommandList>
                  <CommandFooter>
                    <span>Use arrows to move</span>
                    <span>Enter to select</span>
                  </CommandFooter>
                </Command>
              </CommandPanel>
              <Separator />
              <div class="demo-row">
                <CommandEmpty>No command found.</CommandEmpty>
                <CommandLoading>
                  Loading commands
                </CommandLoading>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div class="demo-empty-grid">
                <For each={emptyMediaVariants}>
                  {(variant) => (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant={variant}>
                          <Inbox class="button__icon" />
                        </EmptyMedia>
                        <EmptyTitle>{variant} media</EmptyTitle>
                        <EmptyDescription>
                          New activity will appear here as the session runs.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button variant="outline">Refresh</Button>
                      </EmptyContent>
                    </Empty>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Badge sizes, variants, and interactive states.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-matrix">
                <For each={badgeSizes}>
                  {(size) => (
                    <div class="demo-matrix__row">
                      <span class="demo-matrix__label">{size}</span>
                      <div class="demo-row">
                        <For each={badgeVariants}>
                          {(variant) => (
                            <Badge size={size} variant={variant}>
                              {badgeVariantLabels[variant]}
                            </Badge>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="demo-row">
                <Badge as="button" variant="outline">
                  <Check />
                  Button
                </Badge>
                <Badge as="a" href="#" variant="secondary">
                  Link
                </Badge>
                <Badge as="button" disabled variant="destructive">
                  Disabled
                </Badge>
                <Badge variant="info">
                  <Settings />
                  Icon
                </Badge>
              </div>
              <Separator />
              <div class="demo-row">
                <Kbd>Cmd</Kbd>
                <Kbd>Enter</Kbd>
                <span class="demo-muted">Run command</span>
              </div>
              <div class="demo-row">
                <For each={spinnerSizes}>
                  {(size) => <Spinner size={size} />}
                </For>
                <Separator
                  class="demo-separator-vertical"
                  orientation="vertical"
                />
                <span>Loading records</span>
                <VisuallyHidden>Loading records</VisuallyHidden>
              </div>
            </CardContent>
          </Card>

          <Card class="demo-theme-card">
            <CardHeader>
              <CardTitle>Theme Variables</CardTitle>
              <CardDescription>
                Override CSS variables without changing components.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack demo-custom-theme">
              <div class="demo-row">
                <Button>
                  <Check class="button__icon" />
                  Custom primary
                </Button>
                <Button variant="outline">
                  <Pause class="button__icon" />
                  Pause
                </Button>
                <IconButton aria-label="Close" variant="ghost">
                  <X class="button__icon" />
                </IconButton>
              </div>
              <Input fullWidth placeholder="Custom themed input" />
            </CardContent>
          </Card>

          <CardFrame>
            <CardFrameHeader>
              <CardFrameTitle>Frame</CardFrameTitle>
              <CardFrameDescription>
                Grouped surfaces for dense app panels.
              </CardFrameDescription>
              <CardFrameAction>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </CardFrameAction>
            </CardFrameHeader>
            <Card>
              <CardPanel class="demo-stack">
                <div class="demo-row">
                  <Badge variant="success">Ready</Badge>
                  <span class="demo-muted">Runtime checks passed</span>
                </div>
                <Input
                  fullWidth
                  aria-invalid="true"
                  value="Missing account token"
                />
              </CardPanel>
              <CardFooter>
                <Button disabled variant="outline">
                  Disabled
                </Button>
                <Button size="sm">Resolve</Button>
              </CardFooter>
            </Card>
          </CardFrame>
        </div>
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  render(() => <DemoApp />, root);
}
