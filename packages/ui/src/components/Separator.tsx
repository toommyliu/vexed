import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface SeparatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly decorative?: boolean;
  readonly orientation?: "horizontal" | "vertical";
}

export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "class",
    "decorative",
    "orientation",
  ]);
  const orientation = () => local.orientation ?? "horizontal";

  return (
    <div
      {...rest}
      aria-orientation={orientation()}
      class={cn("separator", `separator--${orientation()}`, local.class)}
      data-slot="separator"
      role={(local.decorative ?? true) ? "none" : "separator"}
    />
  );
}
