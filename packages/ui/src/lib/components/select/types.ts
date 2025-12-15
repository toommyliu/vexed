export interface SelectContext {
  value: any;
  open: boolean;
  disabled: boolean;
  toggle: () => void;
  close: () => void;
  anchorWidth: number;
  setAnchorWidth: (width: number) => void;
  items: { id: string; value: any; disabled: boolean }[];
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  registerItem: (id: string, value: any, disabled: boolean) => void;
  unregisterItem: (id: string) => void;
  getItemIndex: (id: string) => number;
  selectHighlighted: () => void;
}
