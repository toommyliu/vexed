import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly decorative?: boolean;
  readonly orientation?: "horizontal" | "vertical";
}

export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-orientation",
    "class",
    "decorative",
    "orientation",
  ]);
  const orientation = () => local.orientation ?? "horizontal";
  const decorative = () => local.decorative ?? true;

  return (
    <div
      {...rest}
      aria-orientation={
        decorative() ? undefined : (local["aria-orientation"] ?? orientation())
      }
      class={cn("separator", `separator--${orientation()}`, local.class)}
      data-slot="separator"
      role={decorative() ? "none" : "separator"}
    />
  );
}
