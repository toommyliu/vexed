export function composeEventHandlers<EventType extends Event>(
  externalHandler:
    | ((event: EventType) => void)
    | undefined,
  internalHandler: (event: EventType) => void,
  options: { readonly checkDefaultPrevented?: boolean } = {},
): (event: EventType) => void {
  const checkDefaultPrevented = options.checkDefaultPrevented ?? true;

  return (event) => {
    externalHandler?.(event);

    if (!checkDefaultPrevented || !event.defaultPrevented) {
      internalHandler(event);
    }
  };
}
