import { Icon } from "./Icon";
import {
  createEffect,
  createSignal,
  Index,
  onCleanup,
  Show,
  splitProps,
  type Accessor,
  type JSX,
} from "solid-js";
import { cn } from "../lib/cn";

export type ToastVariant = "default" | "error" | "info" | "success" | "warning";
export type ToastPlacement =
  | "bottom-center"
  | "bottom-right"
  | "top-center"
  | "top-right";

export interface ToastHandle {
  readonly close: () => void;
}

export interface ToastOptions {
  readonly action?: JSX.Element;
  readonly class?: string;
  readonly description?: JSX.Element;
  readonly dismissible?: boolean;
  readonly duration?: number | null;
  readonly icon?: JSX.Element | null;
  readonly id?: string;
  readonly onRemove?: () => void;
  readonly testId?: string;
  readonly title?: JSX.Element;
}

export interface ToastItem extends Required<Pick<ToastOptions, "dismissible">> {
  readonly action?: JSX.Element;
  readonly class?: string;
  readonly description?: JSX.Element;
  readonly duration: number | null;
  readonly icon?: JSX.Element | null;
  readonly id: string;
  readonly key?: string;
  readonly onRemove?: () => void;
  readonly open: boolean;
  readonly testId?: string;
  readonly title?: JSX.Element;
  readonly variant: ToastVariant;
  readonly version: number;
}

export interface ToastController {
  readonly close: (id: string) => void;
  readonly closeAll: () => void;
  readonly error: (
    title: JSX.Element,
    options?: Omit<ToastOptions, "title">,
  ) => ToastHandle;
  readonly info: (
    title: JSX.Element,
    options?: Omit<ToastOptions, "title">,
  ) => ToastHandle;
  readonly remove: (id: string) => void;
  readonly show: (
    options: ToastOptions & { variant?: ToastVariant },
  ) => ToastHandle;
  readonly success: (
    title: JSX.Element,
    options?: Omit<ToastOptions, "title">,
  ) => ToastHandle;
  readonly toasts: Accessor<readonly ToastItem[]>;
  readonly warning: (
    title: JSX.Element,
    options?: Omit<ToastOptions, "title">,
  ) => ToastHandle;
}

export interface CreateToastControllerOptions {
  readonly defaultDuration?: number;
  readonly limit?: number;
}

export interface ToasterProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly controller: ToastController;
  readonly placement?: ToastPlacement;
  readonly removeDelay?: number;
}

export interface ToastBannerProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly controller: Pick<ToastController, "close" | "remove">;
  readonly removeDelay?: number;
  readonly toast: ToastItem;
}

const DEFAULT_TOAST_DURATION = 5000;
const DEFAULT_REMOVE_DELAY = 180;

const defaultToastIcon = (variant: ToastVariant): JSX.Element | null => {
  if (variant === "success") {
    return <Icon icon="circle_check" aria-hidden="true" />;
  }

  if (variant === "info") {
    return <Icon icon="info" aria-hidden="true" />;
  }

  if (variant === "warning") {
    return <Icon icon="triangle_alert" aria-hidden="true" />;
  }

  if (variant === "error") {
    return <Icon icon="circle_alert" aria-hidden="true" />;
  }

  return null;
};

export const createToastController = (
  options: CreateToastControllerOptions = {},
): ToastController => {
  const defaultDuration = options.defaultDuration ?? DEFAULT_TOAST_DURATION;
  const limit = options.limit ?? 4;
  const [toasts, setToasts] = createSignal<readonly ToastItem[]>([]);
  let nextToastId = 1;

  const close = (id: string): void => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, open: false } : toast,
      ),
    );
  };

  const closeAll = (): void => {
    setToasts((current) => current.map((toast) => ({ ...toast, open: false })));
  };

  const remove = (id: string): void => {
    let removed: ToastItem | undefined;
    setToasts((current) =>
      current.filter((toast) => {
        if (toast.id === id) {
          removed = toast;
          return false;
        }
        return true;
      }),
    );
    removed?.onRemove?.();
  };

  const show = (
    toastOptions: ToastOptions & { variant?: ToastVariant },
  ): ToastHandle => {
    const id = toastOptions.id ?? `${nextToastId++}`;
    let toastId = id;
    let evictedToasts: ToastItem[] = [];

    setToasts((current) => {
      const existingToast = current.find((toast) => toast.id === id);
      toastId = existingToast?.id ?? id;

      const nextToast: ToastItem = {
        dismissible: toastOptions.dismissible ?? true,
        duration:
          toastOptions.duration === undefined
            ? defaultDuration
            : toastOptions.duration,
        id: toastId,
        open: true,
        variant: toastOptions.variant ?? "default",
        version: (existingToast?.version ?? 0) + 1,
        ...(toastOptions.action === undefined
          ? {}
          : { action: toastOptions.action }),
        ...(toastOptions.class === undefined
          ? {}
          : { class: toastOptions.class }),
        ...(toastOptions.description === undefined
          ? {}
          : { description: toastOptions.description }),
        ...(toastOptions.icon === undefined ? {} : { icon: toastOptions.icon }),
        ...(toastOptions.onRemove === undefined
          ? {}
          : { onRemove: toastOptions.onRemove }),
        ...(toastOptions.testId === undefined
          ? {}
          : { testId: toastOptions.testId }),
        ...(toastOptions.title === undefined
          ? {}
          : { title: toastOptions.title }),
      };

      const nextToasts = [
        nextToast,
        ...current.filter((toast) => toast.id !== nextToast.id),
      ];
      evictedToasts = nextToasts.slice(limit);
      return nextToasts.slice(0, limit);
    });

    for (const toast of evictedToasts) {
      toast.onRemove?.();
    }

    return { close: () => close(toastId) };
  };

  const showWithVariant =
    (variant: ToastVariant) =>
    (title: JSX.Element, toastOptions: Omit<ToastOptions, "title"> = {}) =>
      show({ ...toastOptions, title, variant });

  return {
    close,
    closeAll,
    error: showWithVariant("error"),
    info: showWithVariant("info"),
    remove,
    show,
    success: showWithVariant("success"),
    toasts,
    warning: showWithVariant("warning"),
  };
};

export function Toaster(props: ToasterProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "class",
    "controller",
    "placement",
    "removeDelay",
  ]);

  return (
    <div
      {...rest}
      class={cn(
        "toaster",
        `toaster--${local.placement ?? "top-center"}`,
        local.class,
      )}
      data-slot="toaster"
    >
      <Index each={local.controller.toasts()}>
        {(toast) => (
          <ToastBanner
            controller={local.controller}
            {...(local.removeDelay === undefined
              ? {}
              : { removeDelay: local.removeDelay })}
            toast={toast()}
          />
        )}
      </Index>
    </div>
  );
}

export function ToastBanner(props: ToastBannerProps): JSX.Element {
  const [dismissed, setDismissed] = createSignal(false);
  let autoCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let removeTimer: ReturnType<typeof setTimeout> | undefined;

  const visible = () => props.toast.open && !dismissed();
  const close = (): void => {
    setDismissed(true);
    props.controller.close(props.toast.id);
  };

  createEffect(() => {
    props.toast.version;
    if (!props.toast.open) return;

    setDismissed(false);
    if (removeTimer !== undefined) {
      clearTimeout(removeTimer);
      removeTimer = undefined;
    }
  });

  createEffect(() => {
    if (autoCloseTimer !== undefined) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = undefined;
    }

    const duration = props.toast.duration;
    props.toast.version;
    if (visible() && duration !== null && duration > 0) {
      autoCloseTimer = setTimeout(close, duration);
    }
  });

  createEffect(() => {
    if (visible()) return;
    if (removeTimer !== undefined) return;

    removeTimer = setTimeout(
      () => props.controller.remove(props.toast.id),
      props.removeDelay ?? DEFAULT_REMOVE_DELAY,
    );
  });

  onCleanup(() => {
    if (autoCloseTimer !== undefined) clearTimeout(autoCloseTimer);
    if (removeTimer !== undefined) clearTimeout(removeTimer);
  });

  const icon = () =>
    props.toast.icon === undefined
      ? defaultToastIcon(props.toast.variant)
      : props.toast.icon;

  return (
    <div
      class={cn(
        "toast-banner",
        `toast-banner--${props.toast.variant}`,
        props.toast.class,
        props.class,
      )}
      data-slot="toast"
      data-state={visible() ? "open" : "closed"}
      data-testid={props.toast.testId}
      role={props.toast.variant === "error" ? "alert" : "status"}
      aria-live={props.toast.variant === "error" ? "assertive" : "polite"}
    >
      <Show when={icon()}>
        {(toastIcon) => <div class="toast-banner__icon">{toastIcon()}</div>}
      </Show>
      <div class="toast-banner__body">
        <Show when={props.toast.title}>
          {(title) => <div class="toast-banner__title">{title()}</div>}
        </Show>
        <Show when={props.toast.description}>
          {(description) => (
            <div class="toast-banner__description">{description()}</div>
          )}
        </Show>
      </div>
      <Show when={props.toast.action}>
        {(action) => <div class="toast-banner__action">{action()}</div>}
      </Show>
      <Show when={props.toast.dismissible}>
        <button
          aria-label="Dismiss notification"
          class="toast-banner__close"
          onClick={close}
          type="button"
        >
          <Icon icon="x" aria-hidden="true" />
        </button>
      </Show>
    </div>
  );
}
