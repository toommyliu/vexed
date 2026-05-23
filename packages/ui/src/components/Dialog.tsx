import { Icon } from "./Icon";
import { Dialog as DialogPrimitive } from "@ark-ui/solid/dialog";
import {
  Show,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
  useContext,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/cn";

interface DialogLayerState {
  readonly layer: number;
  readonly setNestedOpen: (id: number, open: boolean) => void;
}

const noopSetNestedOpen = (): void => undefined;

const DialogLayerContext = createContext<DialogLayerState>({
  layer: 0,
  setNestedOpen: noopSetNestedOpen,
});

let nextDialogId = 0;

function dataSlot(props: unknown, fallback: string): string {
  const value = (props as { readonly "data-slot"?: string })["data-slot"];
  return value ?? fallback;
}

const overlayZIndex = (layer: number): number =>
  50 + Math.max(0, layer - 1) * 2;
const positionerZIndex = (layer: number): number => overlayZIndex(layer) + 1;

function dialogContentStyle(
  style: DialogContentProps["style"],
  nestedDialogs: number,
): JSX.CSSProperties | string {
  if (typeof style === "string") {
    const trimmedStyle = style.trimEnd();
    if (trimmedStyle.length === 0) {
      return `--nested-dialogs: ${nestedDialogs};`;
    }

    const separator = trimmedStyle.endsWith(";") ? " " : "; ";
    return `${trimmedStyle}${separator}--nested-dialogs: ${nestedDialogs};`;
  }

  if (style != null && typeof style === "object") {
    return {
      ...style,
      "--nested-dialogs": nestedDialogs,
    } as JSX.CSSProperties;
  }

  return { "--nested-dialogs": nestedDialogs } as JSX.CSSProperties;
}

export type DialogProps = Parameters<typeof DialogPrimitive.Root>[0];

export function Dialog(props: DialogProps): JSX.Element {
  const parent = useContext(DialogLayerContext);
  const layer = parent.layer + 1;
  const [local, rest] = splitProps(props, ["children"]);
  const [nestedOpenIds, setNestedOpenIds] = createSignal<ReadonlySet<number>>(
    new Set(),
    { equals: false },
  );

  const setNestedOpen = (id: number, open: boolean): void => {
    setNestedOpenIds((current) => {
      const next = new Set(current);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  return (
    <DialogLayerContext.Provider value={{ layer, setNestedOpen }}>
      <DialogPrimitive.Root {...rest}>
        <DialogOpenReporter parent={parent} />
        <DialogNestedOpenProvider count={() => nestedOpenIds().size}>
          {local.children}
        </DialogNestedOpenProvider>
      </DialogPrimitive.Root>
    </DialogLayerContext.Provider>
  );
}

function DialogOpenReporter(props: {
  readonly parent: DialogLayerState;
}): JSX.Element {
  const id = ++nextDialogId;
  let reportedOpen = false;

  onCleanup(() => {
    if (reportedOpen) {
      props.parent.setNestedOpen(id, false);
    }
  });

  return (
    <DialogPrimitive.Context>
      {(context) => {
        createEffect(() => {
          const open = context().open;
          if (open !== reportedOpen) {
            reportedOpen = open;
            props.parent.setNestedOpen(id, open);
          }
        });
        return null;
      }}
    </DialogPrimitive.Context>
  );
}

const DialogNestedOpenContext = createContext<() => number>(() => 0);

function DialogNestedOpenProvider(props: {
  readonly count: () => number;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <DialogNestedOpenContext.Provider value={props.count}>
      {props.children}
    </DialogNestedOpenContext.Provider>
  );
}

export type DialogTriggerProps = Parameters<typeof DialogPrimitive.Trigger>[0];

export function DialogTrigger(props: DialogTriggerProps): JSX.Element {
  const slot = dataSlot(props, "dialog-trigger");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Trigger
      {...rest}
      class={cn(local.class)}
      data-slot={slot}
    />
  );
}

export interface DialogContentProps
  extends Omit<Parameters<typeof DialogPrimitive.Content>[0], "class"> {
  readonly bottomStickOnMobile?: boolean;
  readonly class?: string;
  readonly closeProps?: DialogCloseProps;
  readonly showCloseButton?: boolean;
}

export function DialogOverlay(
  props: Omit<Parameters<typeof DialogPrimitive.Backdrop>[0], "class"> & {
    readonly class?: string;
  },
): JSX.Element {
  const slot = dataSlot(props, "dialog-overlay");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Backdrop
      {...rest}
      class={cn("dialog__overlay", local.class)}
      data-slot={slot}
    />
  );
}

export function DialogContent(props: DialogContentProps): JSX.Element {
  const dialogState = useContext(DialogLayerContext);
  const nestedOpenCount = useContext(DialogNestedOpenContext);
  const layer = dialogState.layer || 1;
  const slot = dataSlot(props, "dialog-content");
  const [local, rest] = splitProps(props, [
    "bottomStickOnMobile",
    "children",
    "class",
    "closeProps",
    "showCloseButton",
    "style",
  ]);

  return (
    <DialogPrimitive.Context>
      {(context) => (
        <Show when={context().open}>
          <Portal>
            <DialogOverlay
              data-nested={layer > 1 ? "" : undefined}
              style={{ "z-index": overlayZIndex(layer) }}
            />
            <DialogPrimitive.Positioner
              class="dialog__positioner"
              data-slot="dialog-positioner"
              style={{ "z-index": positionerZIndex(layer) }}
            >
              <DialogPrimitive.Content
                {...rest}
                class={cn(
                  "dialog__content",
                  local.bottomStickOnMobile !== false &&
                    "dialog__content--mobile-stick",
                  local.class,
                )}
                data-nested={layer > 1 ? "" : undefined}
                data-nested-dialog-open={nestedOpenCount() > 0 ? "" : undefined}
                style={dialogContentStyle(local.style, nestedOpenCount())}
                data-slot={slot}
              >
                {local.children}
                {local.showCloseButton !== false && (
                  <DialogClose
                    aria-label="Close"
                    class="dialog__close"
                    variant="ghost"
                    size="icon-sm"
                    {...local.closeProps}
                  >
                    <Icon icon="x" class="button__icon" />
                  </DialogClose>
                )}
              </DialogPrimitive.Content>
            </DialogPrimitive.Positioner>
          </Portal>
        </Show>
      )}
    </DialogPrimitive.Context>
  );
}

export interface DialogHeaderProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function DialogHeader(props: DialogHeaderProps): JSX.Element {
  const slot = dataSlot(props, "dialog-header");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div {...rest} class={cn("dialog__header", local.class)} data-slot={slot} />
  );
}

export interface DialogFooterProps extends DialogHeaderProps {
  readonly variant?: "default" | "bare";
}

export function DialogFooter(props: DialogFooterProps): JSX.Element {
  const slot = dataSlot(props, "dialog-footer");
  const [local, rest] = splitProps(props, ["class", "variant"]);
  return (
    <div
      {...rest}
      class={cn(
        "dialog__footer",
        `dialog__footer--${local.variant ?? "default"}`,
        local.class,
      )}
      data-slot={slot}
    />
  );
}

export type DialogTitleProps = Parameters<typeof DialogPrimitive.Title>[0];

export function DialogTitle(props: DialogTitleProps): JSX.Element {
  const slot = dataSlot(props, "dialog-title");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Title
      {...rest}
      class={cn("dialog__title", local.class)}
      data-slot={slot}
    />
  );
}

export type DialogDescriptionProps = Parameters<
  typeof DialogPrimitive.Description
>[0];

export function DialogDescription(props: DialogDescriptionProps): JSX.Element {
  const slot = dataSlot(props, "dialog-description");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <DialogPrimitive.Description
      {...rest}
      class={cn("dialog__description", local.class)}
      data-slot={slot}
    />
  );
}

export type DialogCloseProps = Parameters<
  typeof DialogPrimitive.CloseTrigger
>[0] & {
  readonly size?: "icon-sm" | "sm" | "default";
  readonly variant?: "default" | "outline" | "ghost" | "destructive";
};

export function DialogClose(props: DialogCloseProps): JSX.Element {
  const slot = dataSlot(props, "dialog-close");
  const [local, rest] = splitProps(props, ["class", "size", "variant"]);
  return (
    <DialogPrimitive.CloseTrigger
      {...rest}
      class={cn(
        "button",
        `button--${local.variant ?? "outline"}`,
        local.size === "icon-sm"
          ? "button--icon-sm"
          : local.size === "sm"
            ? "button--sm"
            : "button--size-default",
        local.class,
      )}
      data-slot={slot}
    />
  );
}

export interface DialogPanelProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function DialogPanel(props: DialogPanelProps): JSX.Element {
  const slot = dataSlot(props, "dialog-panel");
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div {...rest} class={cn("dialog__panel", local.class)} data-slot={slot} />
  );
}
