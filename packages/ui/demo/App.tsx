import "@vexed/ui/styles.css";
import "./demo.css";
import { createEffect, createSignal } from "solid-js";
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
  Command,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupHeading,
  CommandGroupItems,
  CommandInput,
  CommandItem,
  CommandList,
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
  Kbd,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
  Textarea,
  VisuallyHidden,
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

function DemoApp() {
  const [dark, setDark] = createSignal(false);
  const [framework, setFramework] = createSignal("solid");
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
              <div class="demo-row">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Delete</Button>
                <Button variant="destructive-outline">Review</Button>
              </div>
              <div class="demo-row">
                <Button size="xs">XS</Button>
                <Button size="sm">
                  <Play class="button__icon" />
                  Start
                </Button>
                <Button size="xl">XL action</Button>
                <Button loading variant="outline">
                  Syncing
                </Button>
                <IconButton
                  aria-label="Settings"
                  size="icon-sm"
                  variant="ghost"
                >
                  <Settings class="button__icon" />
                </IconButton>
                <IconButton aria-label="Copy" variant="outline">
                  <Copy class="button__icon" />
                </IconButton>
              </div>
            </CardContent>
            <CardFooter>
              <Button as="a" href="#" variant="link">
                Link action
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Native form controls remain composable.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-form">
              <Label for="name">Profile name</Label>
              <Input fullWidth id="name" placeholder="Ada Lovelace" />
              <Label for="notes">Notes</Label>
              <Textarea fullWidth id="notes" placeholder="Review notes" />
              <Textarea
                fullWidth
                invalid
                placeholder="Invalid textarea"
                value="Missing required summary"
              />
              <Input
                fullWidth
                invalid
                placeholder="Invalid value"
                value="999999"
              />
              <div class="demo-row">
                <Checkbox checked>Enable notifications</Checkbox>
                <Checkbox invalid>
                  Invalid option
                </Checkbox>
              </div>
              <Switch checked>Auto refresh</Switch>
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
              <Alert variant="warning">
                <AlertTitle>Connection unstable</AlertTitle>
                <AlertDescription>
                  Responses are taking longer than expected.
                </AlertDescription>
                <AlertAction>
                  <Button size="sm" variant="outline">Retry</Button>
                </AlertAction>
              </Alert>
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
              <Label>Framework</Label>
              <Select
                value={[framework()]}
                onValueChange={(details) => setFramework(details.value[0] ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                </SelectContent>
              </Select>

              <Label>Target</Label>
              <Combobox
                inputBehavior="autohighlight"
                value={target() ? [target()] : []}
                onValueChange={(details) => setTarget(details.value[0] ?? "")}
              >
                <ComboboxInput placeholder="Search target..." showClear />
                <ComboboxContent>
                  <ComboboxEmpty>No target found.</ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxItem value="overview">Overview</ComboboxItem>
                    <ComboboxItem value="reports">Reports</ComboboxItem>
                    <ComboboxItem value="settings">Settings</ComboboxItem>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
                        <CommandItem value="search" keywords={["find", "lookup"]}>
                          <span>Search records</span>
                          <Search class="button__icon" />
                        </CommandItem>
                        <CommandItem value="guard">
                          <span>Enable guard rails</span>
                          <ShieldAlert class="button__icon" />
                        </CommandItem>
                      </CommandGroupItems>
                    </CommandGroup>
                  </CommandList>
                  <CommandFooter>
                    <span>Use arrows to move</span>
                    <span>Enter to select</span>
                  </CommandFooter>
                </Command>
              </CommandPanel>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox class="button__icon" />
                  </EmptyMedia>
                  <EmptyTitle>No queued items</EmptyTitle>
                  <EmptyDescription>
                    New activity will appear here as the session runs.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline">Refresh</Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Small display primitives for dense app surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent class="demo-stack">
              <div class="demo-row">
                <Badge>Running</Badge>
                <Badge size="sm" variant="secondary">Queued</Badge>
                <Badge variant="success">Connected</Badge>
                <Badge variant="warning">Retrying</Badge>
                <Badge variant="destructive">Failed</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge size="lg" variant="outline">Idle</Badge>
              </div>
              <Separator />
              <div class="demo-row">
                <Kbd>Cmd</Kbd>
                <Kbd>Enter</Kbd>
                <span class="demo-muted">Run command</span>
              </div>
              <div class="demo-row">
                <Spinner />
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
                <Button size="sm" variant="outline">Configure</Button>
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
                <Button disabled variant="outline">Disabled</Button>
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
