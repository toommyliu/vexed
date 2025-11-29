export interface SelectContext {
  value: any;
  open: boolean;
  disabled: boolean;
  toggle: () => void;
  close: () => void;
  anchorWidth: number;
  setAnchorWidth: (width: number) => void;
}
