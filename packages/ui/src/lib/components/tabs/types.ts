export interface TabsContext {
    value: string | undefined;
    tabs: { id: string; value: string; disabled: boolean }[];
    registerTab: (id: string, value: string, disabled: boolean) => void;
    unregisterTab: (id: string) => void;
    focusTab: (value: string) => void;
}