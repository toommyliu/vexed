import { Slider as SliderPrimitive } from "@ark-ui/solid/slider";
import { Index, createMemo, splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface SliderProps
  extends Omit<Parameters<typeof SliderPrimitive.Root>[0], "class"> {
  readonly class?: string;
}

export function Slider(props: SliderProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "defaultValue",
    "min",
    "thumbAlignment",
    "value",
  ]);
  const thumbValues = createMemo(
    () => local.value ?? local.defaultValue ?? [local.min ?? 0],
  );

  return (
    <SliderPrimitive.Root
      {...rest}
      class={cn("slider", local.class)}
      data-slot="slider"
      defaultValue={local.defaultValue}
      min={local.min ?? 0}
      thumbAlignment={local.thumbAlignment ?? "contain"}
      value={local.value}
    >
      {local.children}
      <SliderPrimitive.Control
        class="slider__control"
        data-slot="slider-control"
      >
        <SliderPrimitive.Track class="slider__track" data-slot="slider-track">
          <SliderPrimitive.Range
            class="slider__range"
            data-slot="slider-range"
          />
        </SliderPrimitive.Track>
        <Index each={thumbValues()}>
          {(_value, index) => (
            <SliderPrimitive.Thumb
              class="slider__thumb"
              data-slot="slider-thumb"
              index={index}
            >
              <span aria-hidden="true" class="slider__thumb-surface" />
              <SliderPrimitive.HiddenInput />
            </SliderPrimitive.Thumb>
          )}
        </Index>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export interface SliderValueProps
  extends Omit<Parameters<typeof SliderPrimitive.ValueText>[0], "class"> {
  readonly class?: string;
}

export function SliderValue(props: SliderValueProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <SliderPrimitive.ValueText
      {...rest}
      class={cn("slider__value", local.class)}
      data-slot="slider-value"
    />
  );
}

export { SliderPrimitive };
