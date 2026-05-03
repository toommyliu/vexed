import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export type AppShellOrientation = "vertical" | "horizontal";

export interface AppShellProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
  readonly orientation?: AppShellOrientation;
}

export interface AppShellHeaderProps
  extends JSX.HTMLAttributes<HTMLElement> {
  readonly class?: string;
  readonly maxWidth?: string | false;
  readonly orientation?: AppShellOrientation;
  readonly wrapChildren?: boolean;
}

export interface AppShellHeaderLeftProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface AppShellHeaderRightProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface AppShellTitleProps
  extends JSX.HTMLAttributes<HTMLHeadingElement> {
  readonly class?: string;
}

export interface AppShellBodyProps
  extends JSX.HTMLAttributes<HTMLElement> {
  readonly class?: string;
  readonly maxWidth?: string | false;
  readonly orientation?: AppShellOrientation;
  readonly scroll?: boolean;
}

const defaultContainerClass = "app-shell__container--default";

export function AppShell(props: AppShellProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "orientation"]);
  const orientation = () => local.orientation ?? "vertical";

  return (
    <div
      {...rest}
      class={cn("app-shell", `app-shell--${orientation()}`, local.class)}
      data-orientation={orientation()}
      data-slot="app-shell"
    >
      {local.children}
    </div>
  );
}

export function AppShellHeader(props: AppShellHeaderProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "maxWidth",
    "orientation",
    "wrapChildren",
  ]);
  const orientation = () => local.orientation ?? "vertical";
  const maxWidth = () => local.maxWidth ?? defaultContainerClass;

  const content = () => {
    if (local.wrapChildren) {
      return <div class="app-shell__header-custom">{local.children}</div>;
    }

    return <div class="app-shell__header-layout">{local.children}</div>;
  };

  return (
    <header
      {...rest}
      class={cn("app-shell__header", local.class)}
      data-orientation={orientation()}
      data-slot="app-shell-header"
    >
      <Show
        when={maxWidth() !== false}
        fallback={content()}
      >
        <div class={cn("app-shell__container", maxWidth())}>{content()}</div>
      </Show>
    </header>
  );
}

export function AppShellHeaderLeft(
  props: AppShellHeaderLeftProps,
): JSX.Element {
  return (
    <div
      {...props}
      class={cn("app-shell__header-left", props.class)}
      data-slot="app-shell-header-left"
    >
      {props.children}
    </div>
  );
}

export function AppShellHeaderRight(
  props: AppShellHeaderRightProps,
): JSX.Element {
  return (
    <div
      {...props}
      class={cn("app-shell__header-right", props.class)}
      data-slot="app-shell-header-right"
    >
      {props.children}
    </div>
  );
}

export function AppShellTitle(props: AppShellTitleProps): JSX.Element {
  return (
    <h1
      {...props}
      class={cn("app-shell__title", props.class)}
      data-slot="app-shell-title"
    >
      {props.children}
    </h1>
  );
}

export function AppShellBody(props: AppShellBodyProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "maxWidth",
    "orientation",
    "scroll",
  ]);
  const orientation = () => local.orientation ?? "vertical";
  const maxWidth = () => local.maxWidth ?? defaultContainerClass;
  const scroll = () => local.scroll ?? true;

  const content = () => (
    <Show
      when={maxWidth() !== false}
      fallback={local.children}
    >
      <div
        class={cn(
          "app-shell__container",
          !scroll() && "app-shell__container--fill",
          maxWidth(),
        )}
      >
        {local.children}
      </div>
    </Show>
  );

  return (
    <main
      {...rest}
      class={cn(
        "app-shell__body",
        scroll() ? "app-shell__body--scroll" : "app-shell__body--fixed",
        local.class,
      )}
      data-orientation={orientation()}
      data-scroll={scroll() ? "true" : "false"}
      data-slot="app-shell-body"
    >
      {content()}
    </main>
  );
}
