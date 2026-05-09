import { type JSX } from "solid-js";
import { Button, type ButtonProps } from "./Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipContentProps,
  type TooltipProps,
} from "./Tooltip";

export type TooltipButtonProps = TooltipProps;

export function TooltipButton(props: TooltipButtonProps): JSX.Element {
  return <Tooltip {...props} />;
}

export type TooltipButtonTriggerProps = ButtonProps;

export function TooltipButtonTrigger(
  props: TooltipButtonTriggerProps,
): JSX.Element {
  return (
    <TooltipTrigger
      asChild={(triggerProps) => (
        <Button
          {...(triggerProps(
            props as JSX.ButtonHTMLAttributes<HTMLButtonElement>,
          ) as TooltipButtonTriggerProps)}
        />
      )}
    />
  );
}

export type TooltipButtonContentProps = TooltipContentProps;

export function TooltipButtonContent(
  props: TooltipButtonContentProps,
): JSX.Element {
  return <TooltipContent {...props} />;
}
