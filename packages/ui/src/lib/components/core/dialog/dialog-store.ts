import { get, writable } from "svelte/store";
import type { Component, Snippet } from "svelte";

export type DialogKind = "dialog" | "alert";
export type AlertFooterVariant = "default" | "bare";
export type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

export type DialogContent = {
  title?: string;
  description?: string;
  content?: Snippet;
  actions?: Snippet;
  component?: Component;
  props?: Record<string, unknown>;
  size?: DialogSize;
  contentClass?: string;
};

export type DialogOptions = DialogContent & {
  id?: string;
  type?: "dialog";
  showCloseButton?: boolean;
  closeDelay?: number;
};

export type AlertDialogOptions = DialogContent & {
  id?: string;
  type?: "alert";
  confirmLabel?: string;
  cancelLabel?: string;
  footerVariant?: AlertFooterVariant;
  closeDelay?: number;
};

type AlertDialogInternalOptions = AlertDialogOptions & {
  resolve?: (result: boolean) => void;
};

export type DialogInstance = DialogContent & {
  id: string;
  type: DialogKind;
  open: boolean;
  showCloseButton?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  footerVariant?: AlertFooterVariant;
  closeDelay?: number;
  resolve?: (result: boolean) => void;
};

const DEFAULT_CLOSE_DELAY = 160;

const dialogsStore = writable<DialogInstance[]>([]);
const closeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function createId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `dialog_${Math.random().toString(36).slice(2, 10)}`;
}

function scheduleRemove(id: string, delay: number) {
  const existing = closeTimers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    dialogsStore.update((items) => items.filter((item) => item.id !== id));
    closeTimers.delete(id);
    clearTimeout(timer);
  }, delay);
  closeTimers.set(id, timer);
}

function openDialog(options: DialogOptions = {}) {
  const id = options.id ?? createId();
  dialogsStore.update((items) => [
    ...items,
    {
      id,
      type: "dialog",
      open: true,
      showCloseButton: options.showCloseButton ?? true,
      ...options,
    },
  ]);

  return id;
}

function openAlert(options: AlertDialogInternalOptions = {}) {
  const id = options.id ?? createId();
  dialogsStore.update((items) => [
    ...items,
    {
      id,
      type: "alert",
      open: true,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      footerVariant: options.footerVariant,
      ...options,
    },
  ]);
  return id;
}

function close(id: string, result?: boolean) {
  let resolver: ((value: boolean) => void) | undefined;
  let delay = DEFAULT_CLOSE_DELAY;
  let found = false;
  dialogsStore.update((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return items;

    found = true;
    const current = items[index];
    delay = current.closeDelay ?? DEFAULT_CLOSE_DELAY;
    resolver = current.resolve;

    const updated = [...items];
    updated[index] = { ...current, open: false, resolve: undefined };
    return updated;
  });
  if (!found) return;
  if (resolver) resolver(result ?? false);
  scheduleRemove(id, delay);
}

function closeTop(result?: boolean) {
  const items = get(dialogsStore);
  const top = items[items.length - 1];
  if (top) close(top.id, result);
}

function confirm(options: AlertDialogOptions = {}) {
  return new Promise<boolean>((resolve) => {
    openAlert({ ...options, resolve });
  });
}

export const dialogs = dialogsStore;

export const dialog = {
  open: openDialog,
  alert: openAlert,
  confirm,
  close,
  closeTop,
};
