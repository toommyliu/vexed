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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
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
    expect(root.querySelector("[data-slot='card-frame-action']")).not.toBeNull();
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

    expect(document.body.querySelector("[data-slot='dialog-content']")).not.toBeNull();
    expect(document.body.querySelector("[data-slot='dialog-title']")).not.toBeNull();
    expect(document.body.querySelector("[data-slot='dialog-close']")).not.toBeNull();
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

    expect(document.body.querySelector("[data-slot='select-trigger']")).not.toBeNull();
    expect(document.body.querySelectorAll("[data-slot='select-item']")).toHaveLength(2);
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

    expect(document.body.querySelector("[data-slot='combobox-input']")).not.toBeNull();
    expect(document.body.querySelector("[data-slot='combobox-item']")).not.toBeNull();
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
    const start = root.querySelector<HTMLElement>("[data-command-value='start']");
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
