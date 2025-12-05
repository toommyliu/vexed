import type { Writable } from "svelte/store";

export type AlertDialogContext = {
    open: Writable<boolean>;
    updateOpen: (open: boolean) => void;
};
