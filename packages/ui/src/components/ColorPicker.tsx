import {
  ColorPicker as ColorPickerPrimitive,
  parseColor,
  type ColorPickerOpenChangeDetails,
  type ColorPickerValueChangeDetails,
} from "@ark-ui/solid/color-picker";
import {
  createEffect,
  createMemo,
  createSignal,
  splitProps,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/cn";

export interface ColorPickerProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "type"> {
  readonly class?: string;
}

const BLACK = "#000000";
const DEFAULT_COLOR = BLACK;
const HEX_COLOR_PATTERN = /^#?[0-9a-f]{6}$/i;
const WHITE = "#ffffff";

function normalizeHexColor(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!HEX_COLOR_PATTERN.test(text)) {
    return null;
  }

  return `#${text.replace(/^#/, "").toLowerCase()}`;
}

function parseHexColor(hex: string): readonly [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function relativeLuminancePart(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHexColor(hex);
  return (
    0.2126 * relativeLuminancePart(red) +
    0.7152 * relativeLuminancePart(green) +
    0.0722 * relativeLuminancePart(blue)
  );
}

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastColor(hex: string): typeof BLACK | typeof WHITE {
  const luminance = relativeLuminance(hex);
  return contrastRatio(luminance, 0) >= contrastRatio(luminance, 1)
    ? BLACK
    : WHITE;
}

function createNativeInputEvent(): Event {
  if (typeof InputEvent === "function") {
    return new InputEvent("input", {
      bubbles: true,
      inputType: "insertReplacementText",
    });
  }

  return new Event("input", { bubbles: true });
}

export function ColorPicker(props: ColorPickerProps): JSX.Element {
  let eventInput: HTMLInputElement | undefined;
  let lastChangedHex: string | null = null;
  let pendingHex: string | null = null;
  const [local, rest] = splitProps(props, [
    "aria-label",
    "aria-labelledby",
    "class",
    "disabled",
    "onChange",
    "onInput",
    "readOnly",
    "value",
  ]);

  const [isValueFocused, setIsValueFocused] = createSignal(false);
  const value = createMemo(
    () => normalizeHexColor(local.value) ?? DEFAULT_COLOR,
  );
  const [pickerValue, setPickerValue] = createSignal(parseColor(value()));
  const displayValue = createMemo(() => value().toUpperCase());
  const contrastColor = createMemo(() => getContrastColor(value()));
  const contrastBorderColor = createMemo(() =>
    contrastColor() === WHITE
      ? "rgba(255, 255, 255, 0.42)"
      : "rgba(0, 0, 0, 0.28)",
  );

  createEffect(() => {
    const hex = value();
    if (hex === pendingHex) {
      return;
    }

    setPickerValue(parseColor(hex));
  });

  const emitColorInputEvent = (eventName: "change" | "input", hex: string) => {
    if (!eventInput) {
      return;
    }

    eventInput.value = hex;
    if (eventName === "input") {
      eventInput.dispatchEvent(createNativeInputEvent());
      return;
    }

    eventInput.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const emitChangeOnce = (hex: string) => {
    if (hex === lastChangedHex) {
      return;
    }

    lastChangedHex = hex;
    emitColorInputEvent("change", hex);
  };

  const handleTextEvent =
    (eventName: "change" | "input") =>
    (event: Event & { currentTarget: HTMLInputElement }) => {
      if (readOnly()) {
        event.preventDefault();
        event.currentTarget.value = displayValue();
        return;
      }

      const hex = normalizeHexColor(event.currentTarget.value);
      if (hex) {
        setPickerValue(parseColor(hex));
        if (eventName === "change") {
          emitChangeOnce(hex);
          return;
        }

        pendingHex = hex;
        emitColorInputEvent("input", hex);
      }
    };

  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const colorLabel = () => local["aria-label"] ?? "Color";
  const textLabel = () =>
    local["aria-label"]
      ? `${local["aria-label"]} hex value`
      : "Hex color value";

  const rootStyle = createMemo<JSX.CSSProperties>(() => ({
    "background-color": value(),
    "border-color": contrastBorderColor(),
    color: contrastColor(),
  }));

  const swatchStyle = createMemo<JSX.CSSProperties>(() => ({
    "border-color": contrastBorderColor(),
  }));

  const handleEventInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    if (readOnly()) {
      event.preventDefault();
      event.currentTarget.value = value();
      return;
    }

    if (typeof local.onInput === "function") {
      (local.onInput as JSX.EventHandler<HTMLInputElement, InputEvent>)(event);
    }
  };

  const handleEventChange: JSX.EventHandler<HTMLInputElement, Event> = (
    event,
  ) => {
    if (readOnly()) {
      event.preventDefault();
      event.currentTarget.value = value();
      return;
    }

    if (typeof local.onChange === "function") {
      (local.onChange as JSX.EventHandler<HTMLInputElement, Event>)(event);
    }
  };

  const hexFromPickerDetails = (details: ColorPickerValueChangeDetails) =>
    normalizeHexColor(details.value.toString("hex")) ?? DEFAULT_COLOR;

  const handlePrimitiveValueChange = (
    details: ColorPickerValueChangeDetails,
  ) => {
    const hex = hexFromPickerDetails(details);
    setPickerValue(details.value);
    pendingHex = hex;
    emitColorInputEvent("input", hex);
  };

  const handlePrimitiveValueChangeEnd = (
    details: ColorPickerValueChangeDetails,
  ) => {
    const hex = hexFromPickerDetails(details);
    setPickerValue(details.value);
    pendingHex = hex;
    emitChangeOnce(hex);
  };

  const handlePrimitiveOpenChange = (details: ColorPickerOpenChangeDetails) => {
    if (details.open) {
      pendingHex = null;
      return;
    }

    if (pendingHex) {
      emitChangeOnce(pendingHex);
      pendingHex = null;
    }
  };

  return (
    <ColorPickerPrimitive.Root
      class={cn(
        "color-picker",
        disabled() && "color-picker--disabled",
        readOnly() && "color-picker--readonly",
        isValueFocused() && "color-picker--value-focused",
        local.class,
      )}
      data-slot="color-picker"
      disabled={disabled()}
      format="hsba"
      onOpenChange={handlePrimitiveOpenChange}
      onValueChange={handlePrimitiveValueChange}
      onValueChangeEnd={handlePrimitiveValueChangeEnd}
      positioning={{ placement: "bottom-start", gutter: 6, sameWidth: false }}
      readOnly={readOnly()}
      style={rootStyle()}
      unmountOnExit
      value={pickerValue()}
    >
      <ColorPickerPrimitive.Trigger
        aria-label={local["aria-labelledby"] ? undefined : colorLabel()}
        aria-labelledby={local["aria-labelledby"]}
        class="color-picker__trigger"
      >
        <span
          aria-hidden="true"
          class="color-picker__swatch"
          style={swatchStyle()}
        />
      </ColorPickerPrimitive.Trigger>
      <input
        aria-hidden={disabled() ? "true" : undefined}
        aria-label={local["aria-labelledby"] ? undefined : textLabel()}
        aria-labelledby={local["aria-labelledby"]}
        class="color-picker__value"
        data-slot="color-picker-value"
        disabled={disabled()}
        onChange={handleTextEvent("change")}
        onBlur={() => {
          setIsValueFocused(false);
        }}
        onFocus={() => {
          setIsValueFocused(true);
        }}
        onInput={handleTextEvent("input")}
        readonly={readOnly()}
        spellcheck={false}
        type="text"
        value={displayValue()}
      />
      <input
        {...rest}
        aria-hidden="true"
        class="color-picker__event-input"
        disabled={disabled()}
        onChange={handleEventChange}
        onInput={handleEventInput}
        readonly={readOnly()}
        ref={(element) => {
          eventInput = element;
        }}
        tabindex={-1}
        type="text"
        value={value()}
      />
      <Portal>
        <ColorPickerPrimitive.Positioner class="color-picker__positioner">
          <ColorPickerPrimitive.Content class="color-picker__panel">
            <ColorPickerPrimitive.Area
              class="color-picker__area"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorPickerPrimitive.AreaBackground class="color-picker__area-background" />
              <ColorPickerPrimitive.AreaThumb class="color-picker__thumb color-picker__thumb--area" />
            </ColorPickerPrimitive.Area>
            <ColorPickerPrimitive.ChannelSlider
              channel="hue"
              class="color-picker__hue"
            >
              <ColorPickerPrimitive.ChannelSliderTrack class="color-picker__hue-track" />
              <ColorPickerPrimitive.ChannelSliderThumb class="color-picker__thumb color-picker__thumb--hue" />
            </ColorPickerPrimitive.ChannelSlider>
          </ColorPickerPrimitive.Content>
        </ColorPickerPrimitive.Positioner>
      </Portal>
    </ColorPickerPrimitive.Root>
  );
}
