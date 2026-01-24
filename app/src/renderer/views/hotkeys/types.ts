export type HotkeyItem = {
  configKey: string;
  id: string;
  label: string;
  value: string;
};

export type HotkeySection = {
  icon: string;
  id: string;
  items: HotkeyItem[];
  name: string;
};

export type RecordingState = {
  actionId: string | null;
  isClearing: boolean;
  isRecording: boolean;
  lastPressedKey: string;
};
