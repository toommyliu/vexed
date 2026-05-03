import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
  useContext,
  type JSX,
} from "solid-js";
import { Input, type InputProps } from "./Input";
import { Textarea, type TextareaProps } from "./Textarea";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end";
export type InputGroupSize = "sm" | "default" | "lg";

interface InputGroupContextValue {
  readonly size: () => InputGroupSize;
  readonly setDisabled: (disabled: boolean) => void;
  readonly setInvalid: (invalid: boolean) => void;
  readonly setTextarea: (textarea: boolean) => void;
  readonly setBlockAddon: (blockAddon: boolean) => void;
}

const InputGroupContext = createContext<InputGroupContextValue>();

export interface InputGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly size?: InputGroupSize;
}

export function InputGroup(props: InputGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "disabled",
    "invalid",
    "size",
  ]);
  const [controlDisabled, setControlDisabled] = createSignal(false);
  const [controlInvalid, setControlInvalid] = createSignal(false);
  const [hasTextarea, setHasTextarea] = createSignal(false);
  const [hasBlockAddon, setHasBlockAddon] = createSignal(false);
  const disabled = () => Boolean(local.disabled || controlDisabled());
  const invalid = () => Boolean(local.invalid || controlInvalid());
  const size = () => local.size ?? "default";
  const context: InputGroupContextValue = {
    size,
    setBlockAddon: setHasBlockAddon,
    setDisabled: setControlDisabled,
    setInvalid: setControlInvalid,
    setTextarea: setHasTextarea,
  };

  return (
    <InputGroupContext.Provider value={context}>
      <div
        {...rest}
        class={cn(
          "input-group",
          `input-group--${size()}`,
          disabled() && "input-group--disabled",
          invalid() && "input-group--invalid",
          hasTextarea() && "input-group--textarea",
          hasBlockAddon() && "input-group--block",
          local.class,
        )}
        data-disabled={disabled() ? "" : undefined}
        data-invalid={invalid() ? "" : undefined}
        data-size={size()}
        data-slot="input-group"
        role="group"
      >
        {local.children}
      </div>
    </InputGroupContext.Provider>
  );
}

export interface InputGroupAddonProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly align?: InputGroupAddonAlign;
  readonly class?: string;
}

export function InputGroupAddon(props: InputGroupAddonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["align", "class", "onMouseDown"]);
  const align = () => local.align ?? "inline-start";
  const context = useContext(InputGroupContext);

  createEffect(() => {
    const block = align() === "block-start" || align() === "block-end";
    context?.setBlockAddon(block);
    onCleanup(() => {
      if (block) context?.setBlockAddon(false);
    });
  });

  return (
    <div
      {...rest}
      class={cn(
        "input-group__addon",
        `input-group__addon--${align()}`,
        local.class,
      )}
      data-align={align()}
      data-slot="input-group-addon"
      onMouseDown={(event) => {
        if (typeof local.onMouseDown === "function") {
          (local.onMouseDown as JSX.EventHandler<HTMLDivElement, MouseEvent>)(
            event,
          );
        }
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement;
        if (
          target.closest(
            "button,a,input,select,textarea,[role='button'],[role='combobox'],[role='listbox']",
          )
        ) {
          return;
        }
        event.preventDefault();
        const input = event.currentTarget.parentElement?.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >("input, textarea");
        input?.focus();
      }}
    />
  );
}

export type InputGroupTextProps = Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  "class"
> & {
  readonly class?: string;
};

export function InputGroupText(props: InputGroupTextProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      {...rest}
      class={cn("input-group__text", local.class)}
      data-slot="input-group-text"
    />
  );
}

export type InputGroupInputProps = InputProps;

export function InputGroupInput(props: InputGroupInputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "disabled",
    "invalid",
    "size",
  ]);
  const context = useContext(InputGroupContext);
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  createEffect(() => {
    context?.setDisabled(Boolean(local.disabled));
    context?.setInvalid(invalid());
    context?.setTextarea(false);
    onCleanup(() => {
      context?.setDisabled(false);
      context?.setInvalid(false);
    });
  });

  return (
    <Input
      {...rest}
      aria-invalid={invalid() ? "true" : local["aria-invalid"]}
      disabled={local.disabled}
      invalid={invalid()}
      size={local.size ?? context?.size() ?? "default"}
      unstyled
    />
  );
}

export type InputGroupTextareaProps = TextareaProps;

export function InputGroupTextarea(
  props: InputGroupTextareaProps,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "disabled",
    "invalid",
    "size",
  ]);
  const context = useContext(InputGroupContext);
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  createEffect(() => {
    context?.setDisabled(Boolean(local.disabled));
    context?.setInvalid(invalid());
    context?.setTextarea(true);
    onCleanup(() => {
      context?.setDisabled(false);
      context?.setInvalid(false);
      context?.setTextarea(false);
    });
  });

  return (
    <Textarea
      {...rest}
      aria-invalid={invalid() ? "true" : local["aria-invalid"]}
      disabled={local.disabled}
      invalid={invalid()}
      size={local.size ?? context?.size() ?? "default"}
      unstyled
    />
  );
}
