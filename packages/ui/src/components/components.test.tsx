import { afterEach, describe, expect, it, vi } from "vitest";
import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import {
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dropdown,
  Icon,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Kbd,
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
  MenuTrigger,
  PillButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  SliderValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  TooltipButton,
  TooltipButtonContent,
  TooltipButtonTrigger,
  createToastController,
  type ToastController,
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

function setElementRect(
  element: Element | null,
  rect: Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">,
) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
      ...rect,
    }),
  });
}

function renderOpenComboboxWithItem() {
  const root = renderUi(() => (
    <Combobox open inputBehavior="none">
      <ComboboxInput placeholder="Search" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem value="reports">Reports</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ));
  const input = root.querySelector<HTMLInputElement>(
    "[data-slot='combobox-input']",
  );
  const list = document.body.querySelector<HTMLElement>(
    "[data-slot='combobox-list']",
  );
  const item = document.body.querySelector<HTMLElement>(
    "[data-slot='combobox-item']",
  );

  setElementRect(list, {
    bottom: 100,
    height: 100,
    left: 0,
    right: 200,
    top: 0,
    width: 200,
  });

  return { input, item, list };
}

async function highlightFirstComboboxItem(input: HTMLInputElement | null) {
  input!.focus();
  input!.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowDown",
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.useRealTimers();
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
});

describe("Button", () => {
  it("disables the button and renders a spinner while loading", () => {
    const root = renderUi(() => <Button loading>Run</Button>);
    const button = root.querySelector("button");

    expect(button?.disabled).toBe(true);
    expect(root.querySelector("[data-slot='spinner']")).not.toBeNull();
  });

  it("prevents disabled anchor buttons from activating", () => {
    let clicked = false;
    const root = renderUi(() => (
      <Button as="a" disabled href="/run" onClick={() => (clicked = true)}>
        Run
      </Button>
    ));
    const link = root.querySelector("a");
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    const dispatched = link!.dispatchEvent(event);

    expect(link?.getAttribute("aria-disabled")).toBe("true");
    expect(link?.getAttribute("href")).toBeNull();
    expect(link?.tabIndex).toBe(-1);
    expect(dispatched).toBe(false);
    expect(clicked).toBe(false);
  });
});

describe("Icon", () => {
  it("renders the loader circle as a 12-to-9 arc", () => {
    const root = renderUi(() => <Icon icon="loader_circle" />);
    const path = root.querySelector("svg path");

    expect(path?.getAttribute("d")).toBe("M12 3a9 9 0 1 1-9 9");
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

describe("PillButton", () => {
  it("renders pressed state without leaking the pressed prop", () => {
    const root = renderUi(() => <PillButton pressed>Client</PillButton>);
    const button = root.querySelector("button");

    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.className).toContain("pill-button--pressed");
    expect(button?.hasAttribute("pressed")).toBe(false);
  });
});

describe("Kbd", () => {
  it("normalizes modifier glyphs and aliases", () => {
    const root = renderUi(() => (
      <>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌃</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>Ctrl</Kbd>
        <Kbd>Win</Kbd>
        <Kbd>Mod</Kbd>
        <Kbd>K</Kbd>
      </>
    ));
    const keys = [...root.querySelectorAll("[data-slot='kbd']")];

    expect(keys[0]?.getAttribute("data-key")).toBe("command");
    expect(keys[0]?.getAttribute("aria-label")).toBe("Command");
    expect(keys[1]?.getAttribute("data-key")).toBe("shift");
    expect(keys[1]?.getAttribute("aria-label")).toBe("Shift");
    expect(keys[2]?.getAttribute("data-key")).toBe("control");
    expect(keys[2]?.getAttribute("aria-label")).toBe("Control");
    expect(keys[3]?.getAttribute("data-key")).toBe("option");
    expect(keys[3]?.getAttribute("aria-label")).toBe("Option");
    expect(keys[4]?.getAttribute("data-key")).toBe("control");
    expect(keys[4]?.getAttribute("aria-label")).toBe("Control");
    expect(keys[5]?.getAttribute("data-key")).toBe("windows");
    expect(keys[5]?.getAttribute("aria-label")).toBe("Windows");
    expect(keys[6]?.textContent).toBe("Mod");
    expect(keys[6]?.hasAttribute("data-key")).toBe(false);
    expect(keys[6]?.hasAttribute("aria-label")).toBe(false);
    expect(keys[7]?.hasAttribute("data-key")).toBe(false);
    expect(keys[7]?.hasAttribute("aria-label")).toBe(false);
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

describe("Slider", () => {
  it("renders one thumb and hidden input per range value", () => {
    const root = renderUi(() => (
      <Slider
        aria-label={["Minimum", "Maximum"]}
        defaultValue={[20, 80]}
        name="threshold"
      />
    ));

    expect(root.querySelectorAll("[data-slot='slider-thumb']")).toHaveLength(2);
    expect(root.querySelectorAll("input[hidden]")).toHaveLength(2);
  });

  it("renders value text inside the slider root", () => {
    const root = renderUi(() => (
      <Slider aria-label={["Volume"]} defaultValue={[40]}>
        <SliderValue />
      </Slider>
    ));
    const value = root.querySelector("[data-slot='slider-value']");

    expect(value).not.toBeNull();
    expect(value?.textContent).toBe("40");
  });

  it("forwards disabled and invalid state to Ark attributes", () => {
    const root = renderUi(() => (
      <Slider aria-label={["Volume"]} defaultValue={[40]} disabled invalid />
    ));
    const slider = root.querySelector("[data-slot='slider']");

    expect(slider?.hasAttribute("data-disabled")).toBe(true);
    expect(slider?.hasAttribute("data-invalid")).toBe(true);
  });

  it("keeps the same thumb node when controlled values change", () => {
    let setValue: ((value: number[]) => void) | undefined;
    const root = renderUi(() => {
      const [value, setControlledValue] = createSignal([40]);
      setValue = setControlledValue;
      return <Slider aria-label={["Volume"]} value={value()} />;
    });
    const thumb = root.querySelector("[data-slot='slider-thumb']");

    setValue?.([41]);

    expect(root.querySelector("[data-slot='slider-thumb']")).toBe(thumb);
  });
});

describe("Toaster", () => {
  it("renders dismissible toast banners", () => {
    let controller: ToastController | undefined;
    const root = renderUi(() => {
      controller = createToastController();
      return <Toaster controller={controller} removeDelay={0} />;
    });

    controller!.success("Saved", {
      description: "Hotkey applied.",
      duration: null,
      testId: "saved-toast",
    });

    const toast = root.querySelector("[data-testid='saved-toast']");
    expect(toast?.textContent).toContain("Saved");
    expect(toast?.textContent).toContain("Hotkey applied.");
    expect(toast?.getAttribute("role")).toBe("status");
    expect(root.querySelector(".toast-banner__close")).not.toBeNull();
  });

  it("replaces older toasts with the same id", async () => {
    vi.useFakeTimers();
    let controller: ToastController | undefined;
    const root = renderUi(() => {
      controller = createToastController();
      return <Toaster controller={controller} removeDelay={0} />;
    });

    controller!.info("First", { duration: null, id: "hotkey-feedback" });
    const firstToast = root.querySelector("[data-slot='toast']");
    controller!.info("Second", { duration: null, id: "hotkey-feedback" });
    vi.runOnlyPendingTimers();
    await Promise.resolve();

    expect(firstToast).not.toBeNull();
    expect(root.querySelectorAll("[data-slot='toast']")).toHaveLength(1);
    expect(root.textContent).not.toContain("First");
    expect(root.textContent).toContain("Second");
    vi.useRealTimers();
  });

  it("preserves caller-provided ids for close and remove", () => {
    let controller: ToastController | undefined;
    const root = renderUi(() => {
      controller = createToastController();
      return <Toaster controller={controller} removeDelay={0} />;
    });

    controller!.info("Settings updated", {
      duration: null,
      id: "settings-toast",
    });
    expect(root.textContent).toContain("Settings updated");

    controller!.close("settings-toast");

    expect(
      root.querySelector("[data-slot='toast']")?.getAttribute("data-state"),
    ).toBe("closed");

    controller!.remove("settings-toast");

    expect(root.textContent).not.toContain("Settings updated");
  });

  it("runs onRemove for toasts evicted by the limit", () => {
    const onRemove = vi.fn();
    let controller: ToastController | undefined;
    renderUi(() => {
      controller = createToastController({ limit: 1 });
      return <Toaster controller={controller} removeDelay={0} />;
    });

    controller!.info("First", {
      duration: null,
      onRemove,
    });
    controller!.info("Second", { duration: null });

    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("Dialog", () => {
  it("layers nested dialogs above their parent dialog", () => {
    renderUi(() => (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account</DialogTitle>
          </DialogHeader>
          <Dialog open>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete account</DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    ));

    const overlays = document.body.querySelectorAll<HTMLElement>(
      "[data-slot='dialog-overlay']",
    );
    const positioners = document.body.querySelectorAll<HTMLElement>(
      "[data-slot='dialog-positioner']",
    );

    expect(overlays).toHaveLength(2);
    expect(positioners).toHaveLength(2);
    expect(overlays[0]?.style.zIndex).toBe("50");
    expect(positioners[0]?.style.zIndex).toBe("51");
    expect(overlays[1]?.style.zIndex).toBe("52");
    expect(positioners[1]?.style.zIndex).toBe("53");
    expect(overlays[1]?.hasAttribute("data-nested")).toBe(true);

    const contents = document.body.querySelectorAll<HTMLElement>(
      "[data-slot='dialog-content']",
    );
    expect(contents[0]?.hasAttribute("data-nested-dialog-open")).toBe(true);
    expect(contents[0]?.style.getPropertyValue("--nested-dialogs")).toBe("1");
    expect(contents[1]?.hasAttribute("data-nested")).toBe(true);
    expect(contents[1]?.hasAttribute("data-nested-dialog-open")).toBe(false);
  });
});

describe("Select", () => {
  it("renders selected item labels instead of raw selected values", () => {
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

    const trigger = document.body.querySelector("[data-slot='select-trigger']");
    expect(trigger?.textContent).toContain("Solid");
    expect(trigger?.textContent).not.toContain("solid");
  });

  it("uses numeric item children as trigger labels", () => {
    renderUi(() => (
      <Select value={["42"]}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="42">{42}</SelectItem>
        </SelectContent>
      </Select>
    ));

    const trigger = document.body.querySelector("[data-slot='select-trigger']");
    expect(trigger?.textContent).toContain("42");
  });

  it("uses string and numeric item child arrays as trigger labels", () => {
    renderUi(() => (
      <Select value={["hello"]}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hello">{["Hello", " ", "World"]}</SelectItem>
        </SelectContent>
      </Select>
    ));

    const trigger = document.body.querySelector("[data-slot='select-trigger']");
    expect(trigger?.textContent).toContain("Hello World");
  });

  it("prefers explicit item labels over child labels", () => {
    renderUi(() => (
      <Select value={["custom"]}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem label="Custom Label" value="custom">
            Child Label
          </SelectItem>
        </SelectContent>
      </Select>
    ));

    const trigger = document.body.querySelector("[data-slot='select-trigger']");
    expect(trigger?.textContent).toContain("Custom Label");
    expect(trigger?.textContent).not.toContain("Child Label");
  });

  it("falls back to item value for empty child arrays", () => {
    renderUi(() => (
      <Select value={["fallback"]}>
        <SelectTrigger>
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fallback">{[]}</SelectItem>
        </SelectContent>
      </Select>
    ));

    const trigger = document.body.querySelector("[data-slot='select-trigger']");
    expect(trigger?.textContent).toContain("fallback");
  });
});

describe("Combobox", () => {
  it("shows the trigger instead of clear control before selection", () => {
    const root = renderUi(() => (
      <Combobox value={[]}>
        <ComboboxInput placeholder="Search" showClear />
      </Combobox>
    ));

    expect(root.querySelector("[data-slot='combobox-trigger']")).not.toBeNull();
    expect(root.querySelector("[data-slot='combobox-clear']")).toBeNull();
  });

  it("scrolls a keyboard-highlighted item below the combobox list viewport into view", async () => {
    const { input, item, list } = renderOpenComboboxWithItem();
    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 124 - list!.scrollTop,
        height: 24,
        left: 0,
        right: 200,
        top: 100 - list!.scrollTop,
        width: 200,
        x: 0,
        y: 100 - list!.scrollTop,
        toJSON: () => ({}),
      }),
    });

    await highlightFirstComboboxItem(input);

    expect(list?.scrollTop).toBe(24);
  });

  it("scrolls a keyboard-highlighted item above the combobox list viewport into view", async () => {
    const { input, item, list } = renderOpenComboboxWithItem();
    list!.scrollTop = 50;
    Object.defineProperty(item, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 50 - list!.scrollTop,
        height: 24,
        left: 0,
        right: 200,
        top: 26 - list!.scrollTop,
        width: 200,
        x: 0,
        y: 26 - list!.scrollTop,
        toJSON: () => ({}),
      }),
    });

    await highlightFirstComboboxItem(input);

    expect(list?.scrollTop).toBe(26);
  });

  it("keeps the combobox list scroll position when the keyboard-highlighted item is visible", async () => {
    const { input, item, list } = renderOpenComboboxWithItem();
    list!.scrollTop = 32;
    setElementRect(item, {
      bottom: 64,
      height: 24,
      left: 0,
      right: 200,
      top: 40,
      width: 200,
    });

    await highlightFirstComboboxItem(input);

    expect(list?.scrollTop).toBe(32);
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

    expect(selected).toBe(true);
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

    expect(root.textContent).toContain("Second");
  });

  it("marks inactive custom-display content as hidden", () => {
    const root = renderUi(() => (
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent class="demo-tabs-status" value="two">
          Waiting for records
        </TabsContent>
      </Tabs>
    ));
    const inactive = root.querySelectorAll<HTMLElement>(
      "[data-slot='tabs-content']",
    )[1];

    expect(inactive?.hasAttribute("hidden")).toBe(true);
  });
});

describe("TooltipButton", () => {
  it("renders a button trigger with button defaults and tooltip content", () => {
    const root = renderUi(() => (
      <TooltipButton open>
        <TooltipButtonTrigger variant="ghost" size="icon-sm" aria-label="Info">
          Info
        </TooltipButtonTrigger>
        <TooltipButtonContent>Runtime status</TooltipButtonContent>
      </TooltipButton>
    ));
    const button = root.querySelector("button");

    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.getAttribute("aria-label")).toBe("Info");
    expect(button?.className).toContain("button--ghost");
    expect(button?.className).toContain("button--icon-sm");
    expect(root.querySelectorAll("button")).toHaveLength(1);
    expect(
      document.body.querySelector("[data-slot='tooltip-content']"),
    ).not.toBeNull();
  });

  it("disables the trigger and renders a spinner while loading", () => {
    const root = renderUi(() => (
      <TooltipButton>
        <TooltipButtonTrigger loading>Run</TooltipButtonTrigger>
        <TooltipButtonContent>Running</TooltipButtonContent>
      </TooltipButton>
    ));
    const button = root.querySelector("button");

    expect(button?.disabled).toBe(true);
    expect(root.querySelector("[data-slot='spinner']")).not.toBeNull();
  });
});

describe("Separator", () => {
  it("omits orientation ARIA when decorative", () => {
    const root = renderUi(() => <Separator />);
    const separator = root.querySelector("[data-slot='separator']");

    expect(separator?.getAttribute("role")).toBe("none");
    expect(separator?.getAttribute("aria-orientation")).toBeNull();
  });

  it("sets orientation ARIA for semantic separators", () => {
    const root = renderUi(() => (
      <Separator decorative={false} orientation="vertical" />
    ));
    const separator = root.querySelector("[data-slot='separator']");

    expect(separator?.getAttribute("role")).toBe("separator");
    expect(separator?.getAttribute("aria-orientation")).toBe("vertical");
  });
});
