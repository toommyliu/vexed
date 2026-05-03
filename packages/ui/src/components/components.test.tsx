import { afterEach, describe, expect, it } from "vitest";
import type { JSX } from "solid-js";
import { render } from "solid-js/web";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardFrame,
  CardFrameAction,
  CardFrameHeader,
  CardFrameTitle,
  CardHeader,
  CardPanel,
  CardTitle,
  Checkbox,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dropdown,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "../index";

const disposers: Array<() => void> = [];

function renderUi(element: () => JSX.Element) {
  const root = document.createElement("div");
  document.body.append(root);
  const dispose = render(element, root);
  disposers.push(() => {
    dispose();
    root.remove();
  });
  return root;
}

function pressItem(element: HTMLElement | null) {
  element?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  element?.dispatchEvent(new Event("pointerup", { bubbles: true }));
  element?.click();
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
});

describe("Button", () => {
  it("renders type button by default", () => {
    const root = renderUi(() => <Button>Run</Button>);
    const button = root.querySelector("button");

    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.className).toContain("button--default");
    expect(button?.className).toContain("button--size-default");
  });

  it("disables the button and renders a spinner while loading", () => {
    const root = renderUi(() => <Button loading>Run</Button>);
    const button = root.querySelector("button");

    expect(button?.disabled).toBe(true);
    expect(root.querySelector("[data-slot='spinner']")).not.toBeNull();
  });
});

describe("IconButton", () => {
  it("renders an accessible label", () => {
    const root = renderUi(() => (
      <IconButton aria-label="Settings" size="icon-sm">
        <span>icon</span>
      </IconButton>
    ));
    const button = root.querySelector("button");

    expect(button?.getAttribute("aria-label")).toBe("Settings");
    expect(button?.className).toContain("button--icon-sm");
  });
});

describe("Input", () => {
  it("passes native props and marks invalid inputs", () => {
    const root = renderUi(() => (
      <Input invalid placeholder="Name" value="Ada" />
    ));
    const input = root.querySelector("input");

    expect(input?.value).toBe("Ada");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.className).toContain("input--invalid");
  });
});

describe("InputGroup", () => {
  it("renders addons and focuses the inner input from addon press", () => {
    const root = renderUi(() => (
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>Map</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="battleon" />
      </InputGroup>
    ));
    const addon = root.querySelector<HTMLElement>(
      "[data-slot='input-group-addon']",
    );
    const input = root.querySelector<HTMLInputElement>("[data-slot='input']");

    addon?.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
    );

    expect(root.querySelector("[data-slot='input-group']")).not.toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("reflects invalid, disabled, and textarea states on the group", () => {
    const root = renderUi(() => (
      <InputGroup>
        <InputGroupAddon align="block-start">Script</InputGroupAddon>
        <InputGroupTextarea disabled invalid />
      </InputGroup>
    ));
    const group = root.querySelector("[data-slot='input-group']");

    expect(group?.className).toContain("input-group--invalid");
    expect(group?.className).toContain("input-group--disabled");
    expect(group?.className).toContain("input-group--textarea");
    expect(group?.className).toContain("input-group--block");
  });
});

describe("Textarea", () => {
  it("uses shared size names", () => {
    const root = renderUi(() => <Textarea size="lg" />);
    const textarea = root.querySelector("textarea");

    expect(textarea?.className).toContain("textarea--lg");
  });

  it("renders the control wrapper", () => {
    const root = renderUi(() => <Textarea fullWidth invalid />);
    const control = root.querySelector("[data-slot='textarea-control']");

    expect(control?.className).toContain("textarea-control--full-width");
    expect(control?.className).toContain("textarea-control--invalid");
  });
});

describe("Badge", () => {
  it("renders expanded variant and size modifiers", () => {
    const root = renderUi(() => (
      <Badge size="lg" variant="info">
        Info
      </Badge>
    ));
    const badge = root.querySelector("[data-slot='badge']");

    expect(badge?.className).toContain("badge--info");
    expect(badge?.className).toContain("badge--lg");
  });
});

describe("Card", () => {
  it("renders actions, panels, and frame slots", () => {
    const root = renderUi(() => (
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Group</CardFrameTitle>
          <CardFrameAction>Action</CardFrameAction>
        </CardFrameHeader>
        <Card>
          <CardHeader>
            <CardTitle>Panel</CardTitle>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardPanel>Content</CardPanel>
        </Card>
      </CardFrame>
    ));

    expect(root.querySelector("[data-slot='card-frame']")).not.toBeNull();
    expect(
      root.querySelector("[data-slot='card-frame-action']"),
    ).not.toBeNull();
    expect(root.querySelector("[data-slot='card-action']")).not.toBeNull();
    expect(root.querySelector("[data-slot='card-panel']")).not.toBeNull();
  });
});

describe("Checkbox", () => {
  it("preserves native checked state and change behavior", () => {
    let checked = false;
    const root = renderUi(() => (
      <Checkbox onChange={(event) => (checked = event.currentTarget.checked)}>
        Drops
      </Checkbox>
    ));
    const input = root.querySelector("input");

    input?.click();

    expect(input?.checked).toBe(true);
    expect(checked).toBe(true);
  });
});

describe("Invalid and disabled states", () => {
  it("matches aria-invalid to the invalid class", () => {
    const root = renderUi(() => <Input aria-invalid="true" />);
    const input = root.querySelector("input");

    expect(input?.className).toContain("input--invalid");
  });

  it("marks disabled choice controls on the wrapper", () => {
    const root = renderUi(() => (
      <>
        <Checkbox disabled>Disabled</Checkbox>
        <Switch disabled>Disabled</Switch>
      </>
    ));

    expect(root.querySelector("[data-slot='checkbox']")?.className).toContain(
      "checkbox--disabled",
    );
    expect(root.querySelector("[data-slot='switch']")?.className).toContain(
      "switch--disabled",
    );
  });
});

describe("Switch", () => {
  it("uses a native checkbox with switch role", () => {
    const root = renderUi(() => <Switch checked>Auto refresh</Switch>);
    const input = root.querySelector("input");

    expect(input?.type).toBe("checkbox");
    expect(input?.getAttribute("role")).toBe("switch");
    expect(input?.checked).toBe(true);
  });
});

describe("Alert", () => {
  it("renders semantic alert slots and actions", () => {
    const root = renderUi(() => (
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Retrying connection.</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>
    ));

    expect(root.querySelector("[data-slot='alert']")?.className).toContain(
      "alert--warning",
    );
    expect(root.querySelector("[data-slot='alert-title']")).not.toBeNull();
    expect(root.querySelector("[data-slot='alert-action']")).not.toBeNull();
  });
});

describe("Dialog", () => {
  it("renders open dialog content and close action", () => {
    renderUi(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Runtime settings</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ));

    expect(
      document.body.querySelector("[data-slot='dialog-content']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='dialog-title']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='dialog-close']"),
    ).not.toBeNull();
  });
});

describe("AlertDialog", () => {
  it("renders alert dialog action and cancel buttons", () => {
    renderUi(() => (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop?</AlertDialogTitle>
            <AlertDialogDescription>Stop the process.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Stop</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ));

    expect(
      document.body.querySelector("[data-slot='alert-dialog-action']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='alert-dialog-cancel']"),
    ).not.toBeNull();
  });
});

describe("Select", () => {
  it("renders trigger, value, content, and registered items", () => {
    renderUi(() => (
      <Select open value={["solid"]}>
        <SelectTrigger>
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="solid">Solid</SelectItem>
          <SelectItem value="svelte">Svelte</SelectItem>
        </SelectContent>
      </Select>
    ));

    expect(
      document.body.querySelector("[data-slot='select-trigger']"),
    ).not.toBeNull();
    expect(
      document.body.querySelectorAll("[data-slot='select-item']"),
    ).toHaveLength(2);
  });
});

describe("Combobox", () => {
  it("renders input, empty state, and registered items", () => {
    renderUi(() => (
      <Combobox open inputBehavior="autohighlight">
        <ComboboxInput placeholder="Search" />
        <ComboboxContent>
          <ComboboxEmpty>No result</ComboboxEmpty>
          <ComboboxList>
            <ComboboxItem value="reports">Reports</ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));

    expect(
      document.body.querySelector("[data-slot='combobox-input']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='combobox-item']"),
    ).not.toBeNull();
  });

  it("shows the trigger instead of clear control before selection", () => {
    const root = renderUi(() => (
      <Combobox value={[]}>
        <ComboboxInput placeholder="Search" showClear />
      </Combobox>
    ));

    expect(root.querySelector("[data-slot='combobox-trigger']")).not.toBeNull();
    expect(root.querySelector("[data-slot='combobox-clear']")).toBeNull();
  });
});

describe("Dropdown", () => {
  it("renders readonly dropdown input and updates value from selected item", () => {
    let selected = "";
    renderUi(() => (
      <Dropdown open onValueChange={(value) => (selected = value)}>
        <ComboboxItem value="solid">Solid</ComboboxItem>
      </Dropdown>
    ));
    const input = document.body.querySelector<HTMLInputElement>(
      "[data-slot='combobox-input']",
    );
    const item = document.body.querySelector<HTMLElement>(
      "[data-slot='combobox-item']",
    );

    pressItem(item);

    expect(input?.readOnly).toBe(true);
    expect(selected).toBe("solid");
  });
});

describe("Menu", () => {
  it("renders menu content and calls item selection handlers", () => {
    let selected = false;
    renderUi(() => (
      <Menu open>
        <MenuTrigger>Open</MenuTrigger>
        <MenuContent>
          <MenuGroup>
            <MenuLabel>Actions</MenuLabel>
            <MenuItem value="start" onSelect={() => (selected = true)}>
              Start
              <MenuShortcut>Cmd+S</MenuShortcut>
            </MenuItem>
            <MenuSeparator />
            <MenuCheckboxItem checked value="bank">
              Bank
            </MenuCheckboxItem>
            <MenuRadioGroup value="safe">
              <MenuRadioItem value="safe">Safe</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
    ));

    pressItem(
      document.body.querySelector<HTMLElement>("[data-slot='menu-item']"),
    );

    expect(
      document.body.querySelector("[data-slot='menu-content']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='menu-checkbox-item']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='menu-radio-item']"),
    ).not.toBeNull();
    expect(selected).toBe(true);
  });

  it("renders submenu trigger and content slots", () => {
    renderUi(() => (
      <Menu open>
        <MenuTrigger>Open</MenuTrigger>
        <MenuContent>
          <MenuSub open>
            <MenuSubTrigger value="more">More</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem value="nested">Nested</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </MenuContent>
      </Menu>
    ));

    expect(
      document.body.querySelector("[data-slot='menu-sub-trigger']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='menu-content']"),
    ).not.toBeNull();
  });
});

describe("Tabs", () => {
  it("renders active content and switches tabs", () => {
    const root = renderUi(() => (
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent value="two">Second</TabsContent>
      </Tabs>
    ));

    root
      .querySelectorAll<HTMLElement>("[data-slot='tabs-trigger']")[1]
      ?.click();

    expect(root.querySelector("[data-slot='tabs-list']")).not.toBeNull();
    expect(root.textContent).toContain("Second");
  });
});

describe("Tooltip", () => {
  it("renders open tooltip content, arrow, and trigger attributes", () => {
    renderUi(() => (
      <Tooltip open>
        <TooltipTrigger aria-label="Info">Info</TooltipTrigger>
        <TooltipContent>
          Runtime status
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    ));

    expect(
      document.body.querySelector("[data-slot='tooltip-trigger']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='tooltip-content']"),
    ).not.toBeNull();
    expect(
      document.body.querySelector("[data-slot='tooltip-arrow']"),
    ).not.toBeNull();
  });
});

describe("Command", () => {
  it("filters items and calls select handlers", () => {
    let selected = "";
    const root = renderUi(() => (
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty>No command</CommandEmpty>
          <CommandItem value="start" onSelect={(value) => (selected = value)}>
            Start process
          </CommandItem>
          <CommandItem value="bank">Bank cleanup</CommandItem>
        </CommandList>
      </Command>
    ));
    const input = root.querySelector("input");
    const start = root.querySelector<HTMLElement>(
      "[data-command-value='start']",
    );
    const bank = root.querySelector<HTMLElement>("[data-command-value='bank']");

    input!.value = "sta";
    input!.dispatchEvent(new InputEvent("input", { bubbles: true }));
    start!.click();

    expect(selected).toBe("start");
    expect(start?.style.display).toBe("");
    expect(bank?.style.display).toBe("none");
  });
});

describe("Empty", () => {
  it("renders empty state slots", () => {
    const root = renderUi(() => (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">I</EmptyMedia>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>Nothing queued.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>Refresh</EmptyContent>
      </Empty>
    ));

    expect(root.querySelector("[data-slot='empty-media']")).not.toBeNull();
    expect(root.querySelector("[data-slot='empty-content']")).not.toBeNull();
  });
});
