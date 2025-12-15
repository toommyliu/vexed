export interface MenuContext {
    open: boolean;
    close: () => void;
    items: { id: string; disabled: boolean }[];
    highlightedIndex: number;
    setHighlightedIndex: (index: number) => void;
    registerItem: (id: string, disabled: boolean) => void;
    unregisterItem: (id: string) => void;
    getItemIndex: (id: string) => number;
    selectHighlighted: () => void;
}