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
  IconButton,
  Input,
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
      <Input invalid placeholder="Name" value="Drakath" />
    ));
    const input = root.querySelector("input");

    expect(input?.value).toBe("Drakath");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.className).toContain("input--invalid");
  });
});

describe("Textarea", () => {
  it("uses Coss-style size names", () => {
    const root = renderUi(() => <Textarea size="lg" />);
    const textarea = root.querySelector("textarea");

    expect(textarea?.className).toContain("textarea--lg");
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
    const root = renderUi(() => <Switch checked>Auto relogin</Switch>);
    const input = root.querySelector("input");

    expect(input?.type).toBe("checkbox");
    expect(input?.getAttribute("role")).toBe("switch");
    expect(input?.checked).toBe(true);
  });
});
