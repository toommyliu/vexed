import type { Writable } from "svelte/store";

export interface DialogContext {
    open: Writable<boolean>;
    updateOpen: (newOpen: boolean) => void;
}