import { Tabs as TabsPrimitive } from "@ark-ui/solid/tabs";
import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export type TabsProps = Parameters<typeof TabsPrimitive.Root>[0];

export function Tabs(props: TabsProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Root
      {...rest}
      class={cn("tabs", local.class)}
      data-slot="tabs"
    />
  );
}

export type TabsVariant = "default" | "underline";

export interface TabsListProps
  extends Omit<Parameters<typeof TabsPrimitive.List>[0], "class"> {
  readonly class?: string;
  readonly variant?: TabsVariant;
}

export function TabsList(props: TabsListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "variant"]);
  const variant = () => local.variant ?? "default";
  return (
    <TabsPrimitive.List
      {...rest}
      class={cn("tabs__list", `tabs__list--${variant()}`, local.class)}
      data-slot="tabs-list"
      data-variant={variant()}
    >
      {local.children}
      <TabsPrimitive.Indicator
        class="tabs__indicator"
        data-slot="tabs-indicator"
      />
    </TabsPrimitive.List>
  );
}

export type TabsTriggerProps = Parameters<typeof TabsPrimitive.Trigger>[0];

export function TabsTrigger(props: TabsTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Trigger
      {...rest}
      class={cn("tabs__trigger", local.class)}
      data-slot="tabs-trigger"
    />
  );
}

export type TabsContentProps = Parameters<typeof TabsPrimitive.Content>[0];

export function TabsContent(props: TabsContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Content
      {...rest}
      class={cn("tabs__content", local.class)}
      data-slot="tabs-content"
    />
  );
}

export { TabsPrimitive };
