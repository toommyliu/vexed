export interface NumberFieldContext {
    value: number;
    min?: number;
    max?: number;
    step: number;
    increment: () => void;
    decrement: () => void;
}