export interface SelectContext<T> {
  registerItem: (item: { value: T; label: string; disabled: boolean }) => void;
  unregisterItem: (value: T) => void;
  items?: { value: T; label: string; disabled: boolean }[];
  value?: string[];
}
