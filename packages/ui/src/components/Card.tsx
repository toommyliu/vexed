import type { JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  readonly class?: string;
}

export interface CardDescriptionProps
  extends JSX.HTMLAttributes<HTMLParagraphElement> {
  readonly class?: string;
}

export interface CardActionProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardPanelProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameHeaderProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameTitleProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameDescriptionProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameActionProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export interface CardFrameFooterProps
  extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly class?: string;
}

export function Card(props: CardProps): JSX.Element {
  return (
    <div {...props} class={cn("card", props.class)} data-slot="card">
      {props.children}
    </div>
  );
}

export function CardFrame(props: CardFrameProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame", props.class)}
      data-slot="card-frame"
    >
      {props.children}
    </div>
  );
}

export function CardFrameHeader(props: CardFrameHeaderProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame__header", props.class)}
      data-slot="card-frame-header"
    >
      {props.children}
    </div>
  );
}

export function CardFrameTitle(props: CardFrameTitleProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame__title", props.class)}
      data-slot="card-frame-title"
    >
      {props.children}
    </div>
  );
}

export function CardFrameDescription(
  props: CardFrameDescriptionProps,
): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame__description", props.class)}
      data-slot="card-frame-description"
    >
      {props.children}
    </div>
  );
}

export function CardFrameAction(props: CardFrameActionProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame__action", props.class)}
      data-slot="card-frame-action"
    >
      {props.children}
    </div>
  );
}

export function CardFrameFooter(props: CardFrameFooterProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card-frame__footer", props.class)}
      data-slot="card-frame-footer"
    >
      {props.children}
    </div>
  );
}

export function CardHeader(props: CardHeaderProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card__header", props.class)}
      data-slot="card-header"
    >
      {props.children}
    </div>
  );
}

export function CardTitle(props: CardTitleProps): JSX.Element {
  return (
    <h3
      {...props}
      class={cn("card__title", props.class)}
      data-slot="card-title"
    >
      {props.children}
    </h3>
  );
}

export function CardDescription(props: CardDescriptionProps): JSX.Element {
  return (
    <p
      {...props}
      class={cn("card__description", props.class)}
      data-slot="card-description"
    >
      {props.children}
    </p>
  );
}

export function CardAction(props: CardActionProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card__action", props.class)}
      data-slot="card-action"
    >
      {props.children}
    </div>
  );
}

export function CardContent(props: CardContentProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card__content", props.class)}
      data-slot="card-content"
    >
      {props.children}
    </div>
  );
}

export function CardPanel(props: CardPanelProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card__panel", props.class)}
      data-slot="card-panel"
    >
      {props.children}
    </div>
  );
}

export function CardFooter(props: CardFooterProps): JSX.Element {
  return (
    <div
      {...props}
      class={cn("card__footer", props.class)}
      data-slot="card-footer"
    >
      {props.children}
    </div>
  );
}
