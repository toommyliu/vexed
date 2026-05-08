import { afterEach, describe, expect, it } from "vitest";
import { render } from "solid-js/web";
import { ColorPicker } from "./ColorPicker";
import { createSignal, type JSX } from "solid-js";

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

const flush = () =>
  new Promise<void>((resolve) => {
    queueMicrotask(() => resolve());
  });

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
});

describe("ColorPicker", () => {
  it("renders with the provided hex value", () => {
    const root = renderUi(() => <ColorPicker value="#ff0000" />);

    const textInput = root.querySelector(
      ".color-picker__value",
    ) as HTMLInputElement;
    expect(textInput.value).toBe("#FF0000");
  });

  it("does not render a native color input", () => {
    const root = renderUi(() => <ColorPicker value="#ff0000" />);

    expect(root.querySelector('input[type="color"]')).toBeNull();
  });

  it("applies background color to the container", () => {
    const root = renderUi(() => <ColorPicker value="#0169CC" />);

    const picker = root.querySelector(".color-picker") as HTMLElement;
    const bg = picker.style.backgroundColor;
    expect(bg === "rgb(1, 105, 204)" || bg.toUpperCase() === "#0169CC").toBe(
      true,
    );
  });

  it("calculates contrast color correctly", () => {
    const rootDark = renderUi(() => <ColorPicker value="#000000" />);
    const darkPicker = rootDark.querySelector(".color-picker") as HTMLElement;
    expect(darkPicker.style.color).toBe("#ffffff");

    const rootLight = renderUi(() => <ColorPicker value="#ffffff" />);
    const lightPicker = rootLight.querySelector(".color-picker") as HTMLElement;
    expect(lightPicker.style.color).toBe("#000000");
  });

  it("normalizes typed hex values through input events", () => {
    let picked = "";
    const root = renderUi(() => (
      <ColorPicker
        aria-label="Accent"
        onInput={(event) => {
          picked = event.currentTarget.value;
        }}
        value="#000000"
      />
    ));
    const textInput = root.querySelector<HTMLInputElement>(
      ".color-picker__value",
    );

    if (textInput) {
      textInput.value = "FF8800";
      textInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }

    expect(picked).toBe("#ff8800");
  });

  it("normalizes typed hex values through change events", () => {
    let picked = "";
    const root = renderUi(() => (
      <ColorPicker
        aria-label="Accent"
        onChange={(event) => {
          picked = event.currentTarget.value;
        }}
        value="#000000"
      />
    ));
    const textInput = root.querySelector<HTMLInputElement>(
      ".color-picker__value",
    );

    if (textInput) {
      textInput.value = "FF8800";
      textInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    expect(picked).toBe("#ff8800");
  });

  it("ignores invalid typed hex values", () => {
    let picked = "";
    const root = renderUi(() => (
      <ColorPicker
        aria-label="Accent"
        onInput={(event) => {
          picked = event.currentTarget.value;
        }}
        value="#000000"
      />
    ));
    const textInput = root.querySelector<HTMLInputElement>(
      ".color-picker__value",
    );

    if (textInput) {
      textInput.value = "bad";
      textInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    }

    expect(picked).toBe("");
  });

  it("disables the visible and event inputs", () => {
    const root = renderUi(() => <ColorPicker disabled value="#000000" />);

    expect(
      root.querySelector<HTMLInputElement>(".color-picker__value")?.disabled,
    ).toBe(true);
    expect(
      root.querySelector<HTMLInputElement>(".color-picker__event-input")
        ?.disabled,
    ).toBe(true);
  });

  it("does not open when read-only", async () => {
    const root = renderUi(() => <ColorPicker readOnly value="#000000" />);

    root.querySelector<HTMLButtonElement>(".color-picker__trigger")?.click();
    await flush();

    const panel = document.querySelector<HTMLElement>(".color-picker__panel");
    expect(panel?.hidden).toBe(true);
    expect(panel?.dataset["state"]).toBe("closed");
  });

  it("opens the custom popover from the trigger", async () => {
    const root = renderUi(() => <ColorPicker value="#ff0000" />);

    root.querySelector<HTMLButtonElement>(".color-picker__trigger")?.click();
    await flush();

    expect(document.querySelector(".color-picker__panel")).not.toBeNull();
    expect(document.querySelector(".color-picker__area")).not.toBeNull();
    expect(document.querySelector(".color-picker__hue")).not.toBeNull();
  });

  it("emits input and change events from the gradient area", async () => {
    const inputs: string[] = [];
    const changes: string[] = [];
    const root = renderUi(() => {
      const [color, setColor] = createSignal("#000000");
      return (
        <ColorPicker
          onChange={(event) => {
            changes.push(event.currentTarget.value);
          }}
          onInput={(event) => {
            inputs.push(event.currentTarget.value);
            setColor(event.currentTarget.value);
          }}
          value={color()}
        />
      );
    });

    root.querySelector<HTMLButtonElement>(".color-picker__trigger")?.click();
    await flush();

    const area = document.querySelector<HTMLElement>(".color-picker__area");
    expect(area).not.toBeNull();
    Object.defineProperty(area, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
      }),
    });

    area?.dispatchEvent(
      new MouseEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: 100,
        clientY: 0,
      }),
    );
    await flush();
    document.dispatchEvent(
      new MouseEvent("pointerup", {
        bubbles: true,
        button: 0,
        clientX: 100,
        clientY: 0,
      }),
    );
    await flush();

    expect(inputs).toContain("#ff0000");
    expect(changes).toContain("#ff0000");
  });

  it("preserves hue while dragging saturation and brightness", async () => {
    const root = renderUi(() => {
      const [color, setColor] = createSignal("#0000ff");
      return (
        <ColorPicker
          onInput={(event) => {
            setColor(event.currentTarget.value);
          }}
          value={color()}
        />
      );
    });

    root.querySelector<HTMLButtonElement>(".color-picker__trigger")?.click();
    await flush();

    const area = document.querySelector<HTMLElement>(".color-picker__area");
    const hueThumb = document.querySelector<HTMLElement>(
      ".color-picker__thumb--hue",
    );
    expect(area).not.toBeNull();
    expect(hueThumb?.getAttribute("aria-valuenow")).toBe("240");

    Object.defineProperty(area, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
      }),
    });

    area?.dispatchEvent(
      new MouseEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: 0,
        clientY: 100,
      }),
    );
    await flush();

    expect(hueThumb?.getAttribute("aria-valuenow")).toBe("240");
  });
});
