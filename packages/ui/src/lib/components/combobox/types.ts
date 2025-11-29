export interface ComboboxContext {
    value: any;
    inputValue: string;
    open: boolean;
    disabled: boolean;
    highlightedIndex: number;
    toggle: () => void;
    close: () => void;
    setOpen: (open: boolean) => void;
    setValue: (value: any) => void;
    setInputValue: (value: string) => void;
    setHighlightedIndex: (index: number) => void;
    registerItem: (id: string, value: any) => void;
    unregisterItem: (id: string) => void;
    getItemIndex: (id: string) => number;
    items: { id: string; value: any }[];
}
