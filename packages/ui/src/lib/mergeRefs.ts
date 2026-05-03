export type AssignableRef<ElementType> =
  | ((element: ElementType) => void)
  | { current?: ElementType | null }
  | undefined
  | null;

export function mergeRefs<ElementType>(
  ...refs: ReadonlyArray<AssignableRef<ElementType>>
): (element: ElementType) => void {
  return (element) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === "function") {
        ref(element);
        continue;
      }

      ref.current = element;
    }
  };
}
