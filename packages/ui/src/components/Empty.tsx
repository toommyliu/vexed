import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface EmptyProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function Empty(props: EmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div {...rest} class={cn("empty", local.class)} data-slot="empty" />
  );
}

export function EmptyHeader(props: EmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("empty__header", local.class)}
      data-slot="empty-header"
    />
  );
}

export type EmptyMediaVariant = "default" | "icon";

export interface EmptyMediaProps extends EmptyProps {
  readonly variant?: EmptyMediaVariant;
}

export function EmptyMedia(props: EmptyMediaProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "variant"]);
  const variant = () => local.variant ?? "default";
  return (
    <div
      {...rest}
      class={cn("empty__media", `empty__media--${variant()}`, local.class)}
      data-slot="empty-media"
      data-variant={variant()}
    >
      {variant() === "icon" && (
        <>
          <span aria-hidden="true" class="empty__media-shadow empty__media-shadow--left" />
          <span aria-hidden="true" class="empty__media-shadow empty__media-shadow--right" />
        </>
      )}
      <span class="empty__media-content">{local.children}</span>
    </div>
  );
}

export function EmptyTitle(props: EmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("empty__title", local.class)}
      data-slot="empty-title"
    />
  );
}

export interface EmptyDescriptionProps
  extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, "class"> {
  readonly class?: string;
}

export function EmptyDescription(props: EmptyDescriptionProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      {...rest}
      class={cn("empty__description", local.class)}
      data-slot="empty-description"
    />
  );
}

export function EmptyContent(props: EmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("empty__content", local.class)}
      data-slot="empty-content"
    />
  );
}
