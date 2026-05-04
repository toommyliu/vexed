/* @refresh reload */
import "./style.css";
import {
  Button,
  Input,
  Slider,
  SliderValue,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@vexed/ui";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
  type JSX,
} from "solid-js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PREFERENCES,
  DEFAULT_THEME_TOKENS,
  THEME_TOKEN_NAMES,
  type AppSettings,
  type AppearancePatch,
  type PreferencesPatch,
  type ThemeMode,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../../../shared/settings";
import { mountWindow } from "../mount";

const defaultSettings: AppSettings = {
  preferences: DEFAULT_PREFERENCES,
  appearance: DEFAULT_APPEARANCE,
};

const themeModes: ReadonlyArray<{
  readonly label: string;
  readonly value: ThemeMode;
}> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const launchModes = [
  { label: "Game", value: "game" },
  { label: "Account Manager", value: "account-manager" },
] as const;

const clampFontSize = (value: number): number =>
  Math.min(24, Math.max(10, Math.round(value)));

const rgbToHex = (rgb: ThemeRgb): string =>
  `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;

const hexToRgb = (hex: string): ThemeRgb | null => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }

  const value = match[1];
  if (!value) {
    return null;
  }

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
};

const tokenLabel = (name: ThemeTokenName): string =>
  name
    .replace(/[A-Z]/g, (match) => ` ${match}`)
    .replace(/^./, (match) => match.toUpperCase());

function SettingsSection(props: {
  readonly children: JSX.Element;
  readonly description?: string;
  readonly id: string;
  readonly title: string;
}): JSX.Element {
  return (
    <section class="settings-section" id={props.id}>
      <header class="settings-section__header">
        <h2>{props.title}</h2>
        <Show when={props.description}>
          {(description) => <p>{description()}</p>}
        </Show>
      </header>
      <div class="settings-section__content">{props.children}</div>
    </section>
  );
}

function SettingsRow(props: {
  readonly action: JSX.Element;
  readonly description?: string;
  readonly title: string;
}): JSX.Element {
  return (
    <div class="settings-row">
      <div class="settings-row__content">
        <div class="settings-row__title">{props.title}</div>
        <Show when={props.description}>
          {(description) => (
            <div class="settings-row__description">{description()}</div>
          )}
        </Show>
      </div>
      <div class="settings-row__action">{props.action}</div>
    </div>
  );
}

function SegmentedControl<T extends string>(props: {
  readonly "aria-label": string;
  readonly options: ReadonlyArray<{
    readonly label: string;
    readonly value: T;
  }>;
  readonly value: T;
  readonly onChange: (value: T) => void;
}): JSX.Element {
  return (
    <Tabs
      aria-label={props["aria-label"]}
      onValueChange={(details) => props.onChange(details.value as T)}
      value={props.value}
    >
      <TabsList>
        <For each={props.options}>
          {(option) => (
            <TabsTrigger value={option.value}>{option.label}</TabsTrigger>
          )}
        </For>
      </TabsList>
    </Tabs>
  );
}

function RoundingSlider(props: {
  readonly "aria-label": string;
  readonly value: number;
  readonly onCommit: (value: number) => void;
}): JSX.Element {
  const [draft, setDraft] = createSignal(props.value);
  const [dragging, setDragging] = createSignal(false);

  createEffect(() => {
    const value = props.value;
    if (!untrack(dragging)) {
      setDraft(value);
    }
  });

  return (
    <Slider
      aria-label={[props["aria-label"]]}
      max={2}
      min={0}
      onValueChange={(details) => {
        setDragging(true);
        setDraft(details.value[0] ?? draft());
      }}
      onValueChangeEnd={(details) => {
        const value = details.value[0] ?? draft();
        setDraft(value);
        setDragging(false);
        props.onCommit(value);
      }}
      step={0.05}
      value={[draft()]}
    >
      <SliderValue>{draft().toFixed(2)}</SliderValue>
    </Slider>
  );
}

function FontSizeInput(props: {
  readonly "aria-label": string;
  readonly value: number;
  readonly onCommit: (value: number) => void;
}): JSX.Element {
  const [draft, setDraft] = createSignal(String(props.value));

  createEffect(() => {
    setDraft(String(props.value));
  });

  const commit = () => {
    const parsed = Number(draft());
    const value = Number.isFinite(parsed) ? clampFontSize(parsed) : props.value;
    setDraft(String(value));
    props.onCommit(value);
  };

  return (
    <Input
      aria-label={props["aria-label"]}
      class="settings-number-input"
      max={24}
      min={10}
      onBlur={commit}
      onInput={(event: InputEvent & { currentTarget: HTMLInputElement }) =>
        setDraft(event.currentTarget.value)
      }
      onKeyDown={(
        event: KeyboardEvent & { currentTarget: HTMLInputElement },
      ) => {
        if (event.key === "Enter") {
          commit();
        }
      }}
      size="sm"
      step={1}
      type="number"
      value={draft()}
    />
  );
}

function ThemeTokenRow(props: {
  readonly defaultValue: ThemeRgb;
  readonly name: ThemeTokenName;
  readonly value: ThemeRgb | undefined;
  readonly onChange: (value: ThemeRgb) => void;
  readonly onReset: () => void;
}): JSX.Element {
  const isOverridden = createMemo(() => props.value !== undefined);
  const hexValue = createMemo(() =>
    rgbToHex(props.value ?? props.defaultValue),
  );
  const [draft, setDraft] = createSignal(hexValue());
  createEffect(() => {
    setDraft(hexValue());
  });

  const commit = (value: string) => {
    setDraft(value);
    const rgb = hexToRgb(value);
    if (rgb) {
      props.onChange(rgb);
    }
  };

  return (
    <div class="theme-token-row">
      <div class="theme-token-row__name">{tokenLabel(props.name)}</div>
      <div class="theme-token-row__controls">
        <input
          aria-label={`${tokenLabel(props.name)} color`}
          class="theme-token-row__swatch"
          onChange={(event) => commit(event.currentTarget.value)}
          onInput={(event) => setDraft(event.currentTarget.value)}
          type="color"
          value={draft()}
        />
        <Input
          aria-label={`${tokenLabel(props.name)} hex value`}
          class="theme-token-row__input"
          onChange={(event) => commit(event.currentTarget.value)}
          onInput={(event) => setDraft(event.currentTarget.value)}
          placeholder="Default"
          size="sm"
          value={draft()}
        />
        <Button
          disabled={!isOverridden()}
          onClick={props.onReset}
          size="sm"
          type="button"
          variant="ghost"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function GeneralSettings(props: {
  readonly settings: AppSettings;
  readonly onPreferencesPatch: (patch: PreferencesPatch) => void;
}): JSX.Element {
  return (
    <SettingsSection id="general" title="General">
      <SettingsRow
        action={
          <Switch
            checked={props.settings.preferences.checkForUpdates}
            onChange={(event) =>
              props.onPreferencesPatch({
                checkForUpdates: event.currentTarget.checked,
              })
            }
          />
        }
        description="Check for updates when the app starts."
        title="Check for updates"
      />
      <SettingsRow
        action={
          <SegmentedControl
            aria-label="Launch mode"
            onChange={(launchMode) => props.onPreferencesPatch({ launchMode })}
            options={launchModes}
            value={props.settings.preferences.launchMode}
          />
        }
        description="Choose which window opens when the app starts."
        title="Launch Mode"
      />
    </SettingsSection>
  );
}

function AppearanceSettings(props: {
  readonly settings: AppSettings;
  readonly onAppearancePatch: (patch: AppearancePatch) => void;
  readonly onResetAppearance: () => void;
}): JSX.Element {
  const updateThemeProfile = (
    variant: ThemeVariant,
    patch: {
      readonly tokens?: Partial<Record<ThemeTokenName, ThemeRgb | null>>;
      readonly sansFont?: string;
      readonly monoFont?: string;
      readonly sansFontSize?: number;
      readonly monoFontSize?: number;
      readonly rounding?: number;
    },
  ) => {
    props.onAppearancePatch({
      themes: {
        [variant]: patch,
      },
    });
  };

  const renderProfileEditor = (variant: ThemeVariant) => {
    const profile = () => props.settings.appearance.themes[variant];

    return (
      <section class="theme-profile">
        <header class="theme-profile__header">
          <div>
            <h3>{variant === "light" ? "Light theme" : "Dark theme"}</h3>
          </div>
        </header>
        <div class="theme-profile__rows">
          <SettingsRow
            action={
              <Input
                class="settings-text-input"
                fullWidth
                onChange={(event) =>
                  updateThemeProfile(variant, {
                    sansFont: event.currentTarget.value,
                  })
                }
                size="sm"
                value={profile().sansFont}
              />
            }
            title="Sans font"
          />
          <SettingsRow
            action={
              <FontSizeInput
                aria-label={`${variant} theme sans font size`}
                onCommit={(sansFontSize) =>
                  updateThemeProfile(variant, {
                    sansFontSize,
                  })
                }
                value={profile().sansFontSize}
              />
            }
            title="Sans size"
          />
          <SettingsRow
            action={
              <Input
                class="settings-text-input"
                fullWidth
                onChange={(event) =>
                  updateThemeProfile(variant, {
                    monoFont: event.currentTarget.value,
                  })
                }
                size="sm"
                value={profile().monoFont}
              />
            }
            title="Mono font"
          />
          <SettingsRow
            action={
              <FontSizeInput
                aria-label={`${variant} theme mono font size`}
                onCommit={(monoFontSize) =>
                  updateThemeProfile(variant, {
                    monoFontSize,
                  })
                }
                value={profile().monoFontSize}
              />
            }
            title="Mono size"
          />
          <SettingsRow
            action={
              <div class="rounding-control">
                <RoundingSlider
                  aria-label={`${variant} theme rounding`}
                  onCommit={(rounding) =>
                    updateThemeProfile(variant, {
                      rounding,
                    })
                  }
                  value={profile().rounding}
                />
              </div>
            }
            title="Rounding"
          />
          <div class="theme-token-list">
            <For each={THEME_TOKEN_NAMES}>
              {(name) => (
                <ThemeTokenRow
                  defaultValue={DEFAULT_THEME_TOKENS[variant][name]}
                  name={name}
                  onChange={(value) =>
                    updateThemeProfile(variant, {
                      tokens: {
                        [name]: value,
                      },
                    })
                  }
                  onReset={() =>
                    updateThemeProfile(variant, {
                      tokens: {
                        [name]: null,
                      },
                    })
                  }
                  value={profile().tokens[name]}
                />
              )}
            </For>
          </div>
        </div>
      </section>
    );
  };

  return (
    <SettingsSection id="appearance" title="Appearance">
      <SettingsRow
        action={
          <SegmentedControl
            aria-label="Theme mode"
            onChange={(themeMode) => props.onAppearancePatch({ themeMode })}
            options={themeModes}
            value={props.settings.appearance.themeMode}
          />
        }
        description="Use light, dark, or match your system appearance."
        title="Theme"
      />
      <div class="settings-section__actions">
        <Button
          onClick={props.onResetAppearance}
          size="sm"
          type="button"
          variant="outline"
        >
          Reset appearance
        </Button>
      </div>
      <div class="theme-profile-grid">
        {renderProfileEditor("light")}
        {renderProfileEditor("dark")}
      </div>
    </SettingsSection>
  );
}

function SettingsApp(): JSX.Element {
  const [settings, setSettings] = createSignal<AppSettings>(defaultSettings);
  const [error, setError] = createSignal<string | null>(null);

  const runSettingsUpdate = async (
    update: Promise<AppSettings>,
  ): Promise<void> => {
    try {
      setError(null);
      setSettings(await update);
    } catch (cause) {
      console.error("Failed to update settings:", cause);
      setError(
        cause instanceof Error ? cause.message : "Settings update failed",
      );
    }
  };

  onMount(() => {
    void window.ipc.settings
      .get()
      .then(setSettings)
      .catch((cause: unknown) => {
        console.error("Failed to load settings:", cause);
        setError(
          cause instanceof Error ? cause.message : "Settings unavailable",
        );
      });

    const unsubscribe = window.ipc.settings.onChanged(setSettings);
    onCleanup(unsubscribe);
  });

  return (
    <div class="settings-app">
      <div class="settings-layout">
        <main class="settings-main">
          <div class="settings-content-wrapper">
            <Show when={error()}>
              {(message) => <div class="settings-error">{message()}</div>}
            </Show>
            <GeneralSettings
              onPreferencesPatch={(patch) =>
                void runSettingsUpdate(
                  window.ipc.settings.updatePreferences(patch),
                )
              }
              settings={settings()}
            />
            <AppearanceSettings
              onAppearancePatch={(patch) =>
                void runSettingsUpdate(
                  window.ipc.settings.updateAppearance(patch),
                )
              }
              onResetAppearance={() =>
                void runSettingsUpdate(window.ipc.settings.resetAppearance())
              }
              settings={settings()}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

mountWindow(() => <SettingsApp />);
