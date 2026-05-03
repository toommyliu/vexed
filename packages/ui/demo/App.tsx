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
  IconButton,
  Input,
  Kbd,
  Label,
  Separator,
  Spinner,
  Switch,
  Textarea,
  VisuallyHidden,
} from "@vexed/ui";
import {
  Check,
  Copy,
  Pause,
  Play,
  Settings,
  X,
} from "lucide-solid";

function DemoApp() {
  const [dark, setDark] = createSignal(false);

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
              <Label for="name">Character name</Label>
              <Input fullWidth id="name" placeholder="Drakath" />
              <Label for="notes">Notes</Label>
              <Textarea
                fullWidth
                id="notes"
                placeholder="Combat script notes"
              />
              <Input
                fullWidth
                invalid
                placeholder="Invalid value"
                value="999999"
              />
              <div class="demo-row">
                <Checkbox checked>
                  Enable drops
                </Checkbox>
                <Checkbox invalid>
                  Invalid option
                </Checkbox>
              </div>
              <Switch checked>Auto relogin</Switch>
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
                <span class="demo-muted">Run script</span>
              </div>
              <div class="demo-row">
                <Spinner />
                <span>Loading inventory</span>
                <VisuallyHidden>Loading inventory</VisuallyHidden>
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
