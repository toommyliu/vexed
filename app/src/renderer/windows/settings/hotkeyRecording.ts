const punctuationCodeMap: Readonly<Record<string, string>> = {
  Backquote: "`",
  Backslash: "\\",
  BracketLeft: "[",
  BracketRight: "]",
  Comma: ",",
  Equal: "=",
  Minus: "-",
  Period: ".",
  Semicolon: ";",
  Slash: "/",
};

const readPhysicalKeyFromCode = (code: string): string | undefined => {
  if (code.startsWith("Key")) {
    const letter = code.slice(3);
    return /^[A-Z]$/.test(letter) ? letter : undefined;
  }

  if (code.startsWith("Digit")) {
    const digit = code.slice(5);
    return /^[0-9]$/.test(digit) ? digit : undefined;
  }

  return punctuationCodeMap[code];
};

export const readRecordedHotkeyFromEvent = (
  event: Pick<
    KeyboardEvent,
    "altKey" | "code" | "ctrlKey" | "key" | "metaKey" | "shiftKey"
  >,
): string => {
  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Control");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  if (event.metaKey) {
    parts.push("Meta");
  }

  // On macOS, Option changes event.key into the typed symbol instead of the
  // physical key, for example Option+I can report "¬". Store accelerator
  // bindings by physical key so recording Option+I persists as "Alt+I".
  const physicalKey =
    event.altKey && event.code ? readPhysicalKeyFromCode(event.code) : undefined;
  parts.push(physicalKey ?? event.key);
  return parts.join("+");
};
