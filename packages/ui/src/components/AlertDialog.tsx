import { splitProps, type JSX } from "solid-js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
  type DialogCloseProps,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogFooterProps,
  type DialogHeaderProps,
  type DialogProps,
  type DialogTitleProps,
  type DialogTriggerProps,
} from "./Dialog";
import { cn } from "../lib/cn";

export type AlertDialogProps = DialogProps;

export function AlertDialog(props: AlertDialogProps): JSX.Element {
  return <Dialog role="alertdialog" {...props} />;
}

export type AlertDialogTriggerProps = DialogTriggerProps;

export function AlertDialogTrigger(props: AlertDialogTriggerProps): JSX.Element {
  return <DialogTrigger {...props} data-slot="alert-dialog-trigger" />;
}

export function AlertDialogOverlay(
  props: Parameters<typeof DialogOverlay>[0],
): JSX.Element {
  return <DialogOverlay {...props} data-slot="alert-dialog-overlay" />;
}

export type AlertDialogContentProps = DialogContentProps;

export function AlertDialogContent(props: AlertDialogContentProps): JSX.Element {
  return <DialogContent {...props} data-slot="alert-dialog-content" />;
}

export type AlertDialogHeaderProps = DialogHeaderProps;

export function AlertDialogHeader(props: AlertDialogHeaderProps): JSX.Element {
  return <DialogHeader {...props} data-slot="alert-dialog-header" />;
}

export type AlertDialogFooterProps = DialogFooterProps;

export function AlertDialogFooter(props: AlertDialogFooterProps): JSX.Element {
  return <DialogFooter {...props} data-slot="alert-dialog-footer" />;
}

export type AlertDialogTitleProps = DialogTitleProps;

export function AlertDialogTitle(props: AlertDialogTitleProps): JSX.Element {
  return <DialogTitle {...props} data-slot="alert-dialog-title" />;
}

export type AlertDialogDescriptionProps = DialogDescriptionProps;

export function AlertDialogDescription(
  props: AlertDialogDescriptionProps,
): JSX.Element {
  return <DialogDescription {...props} data-slot="alert-dialog-description" />;
}

export type AlertDialogCloseProps = DialogCloseProps;

export function AlertDialogClose(props: AlertDialogCloseProps): JSX.Element {
  return <DialogClose {...props} data-slot="alert-dialog-close" />;
}

export function AlertDialogAction(props: DialogCloseProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "variant"]);
  return (
    <DialogClose
      {...rest}
      class={cn(local.class)}
      data-slot="alert-dialog-action"
      variant={local.variant ?? "default"}
    />
  );
}

export function AlertDialogCancel(props: DialogCloseProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "variant"]);
  return (
    <DialogClose
      {...rest}
      class={cn(local.class)}
      data-slot="alert-dialog-cancel"
      variant={local.variant ?? "outline"}
    />
  );
}
