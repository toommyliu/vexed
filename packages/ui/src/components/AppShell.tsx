import {
  createContext,
  splitProps,
  useContext,
  type Accessor,
  type Component,
  type JSX,
} from "solid-js";
import { cn } from "../lib/cn";

export type AppShellOrientation = "vertical" | "horizontal";

interface AppShellContextValue {
  readonly orientation: Accessor<AppShellOrientation>;
}

const AppShellContext = createContext<AppShellContextValue>();

export interface AppShellProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
  readonly orientation?: AppShellOrientation;
}

export interface AppShellHeaderProps extends JSX.HTMLAttributes<HTMLElement> {
  readonly class?: string;
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

export interface AppShellBodyProps extends JSX.HTMLAttributes<HTMLElement> {
  readonly class?: string;
  readonly scroll?: boolean;
}

export interface AppShellComponent extends Component<AppShellProps> {
  readonly Body: Component<AppShellBodyProps>;
  readonly Header: Component<AppShellHeaderProps>;
  readonly HeaderLeft: Component<AppShellHeaderLeftProps>;
  readonly HeaderRight: Component<AppShellHeaderRightProps>;
  readonly Title: Component<AppShellTitleProps>;
}

function useAppShellContext(): AppShellContextValue {
  return useContext(AppShellContext) ?? { orientation: () => "vertical" };
}

function AppShellRoot(props: AppShellProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "orientation"]);
  const orientation = () => local.orientation ?? "vertical";
  const context: AppShellContextValue = { orientation };

  return (
    <div
      {...rest}
      class={cn("app-shell", `app-shell--${orientation()}`, local.class)}
      data-orientation={orientation()}
      data-slot="app-shell"
    >
      <AppShellContext.Provider value={context}>
        {local.children}
      </AppShellContext.Provider>
    </div>
  );
}

function AppShellHeader(props: AppShellHeaderProps): JSX.Element {
  const context = useAppShellContext();
  const [local, rest] = splitProps(props, ["children", "class"]);

  return (
    <header
      {...rest}
      class={cn("app-shell__header", local.class)}
      data-orientation={context.orientation()}
      data-slot="app-shell-header"
    >
      <div class="app-shell__header-layout">{local.children}</div>
    </header>
  );
}

function AppShellHeaderLeft(props: AppShellHeaderLeftProps): JSX.Element {
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

function AppShellHeaderRight(props: AppShellHeaderRightProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("app-shell__header-right", props.class)}
      data-slot="app-shell-header-right"
    >
      <div class="app-shell__header-action-region">{props.children}</div>
    </div>
  );
}

function AppShellTitle(props: AppShellTitleProps): JSX.Element {
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

function AppShellBody(props: AppShellBodyProps): JSX.Element {
  const context = useAppShellContext();
  const [local, rest] = splitProps(props, ["children", "class", "scroll"]);
  const scroll = () => local.scroll ?? true;

  return (
    <main
      {...rest}
      class={cn(
        "app-shell__body",
        scroll() ? "app-shell__body--scroll" : "app-shell__body--fixed",
        local.class,
      )}
      data-orientation={context.orientation()}
      data-scroll={scroll() ? "true" : "false"}
      data-slot="app-shell-body"
    >
      {local.children}
    </main>
  );
}

export const AppShell: AppShellComponent = Object.assign(AppShellRoot, {
  Body: AppShellBody,
  Header: AppShellHeader,
  HeaderLeft: AppShellHeaderLeft,
  HeaderRight: AppShellHeaderRight,
  Title: AppShellTitle,
});
