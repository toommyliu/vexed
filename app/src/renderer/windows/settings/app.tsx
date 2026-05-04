/* @refresh reload */
import "./style.css";
import {
  AppShell,
  AppShellBody,
  Button,
  Card,
  Input,
  Switch,
  Tabs,
  TabsContent,
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
  type JSX,
} from "solid-js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PREFERENCES,
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

type SettingsPage = "general" | "appearance";

type ThemeTokenValues = Record<ThemeTokenName, ThemeRgb>;

const defaultSettings: AppSettings = {
  preferences: DEFAULT_PREFERENCES,
  appearance: DEFAULT_APPEARANCE,
};

const defaultThemeTokens: Record<ThemeVariant, ThemeTokenValues> = {
  light: {
    background: [255, 255, 255],
    foreground: [38, 38, 38],
    card: [255, 255, 255],
    cardForeground: [38, 38, 38],
    popover: [255, 255, 255],
    popoverForeground: [38, 38, 38],
    primary: [38, 38, 38],
    primaryForeground: [250, 250, 250],
    secondary: [245, 245, 245],
    secondaryForeground: [38, 38, 38],
    muted: [245, 245, 245],
    mutedForeground: [92, 92, 92],
    accent: [245, 245, 245],
    accentForeground: [38, 38, 38],
    destructive: [239, 68, 68],
    destructiveForeground: [185, 28, 28],
    success: [16, 185, 129],
    successForeground: [4, 120, 87],
    warning: [245, 158, 11],
    warningForeground: [180, 83, 9],
    info: [59, 130, 246],
    infoForeground: [29, 78, 216],
    border: [235, 235, 235],
    input: [229, 229, 229],
    ring: [163, 163, 163],
  },
  dark: {
    background: [14, 14, 15],
    foreground: [245, 245, 245],
    card: [18, 18, 20],
    cardForeground: [245, 245, 245],
    popover: [22, 22, 24],
    popoverForeground: [245, 245, 245],
    primary: [245, 245, 245],
    primaryForeground: [38, 38, 38],
    secondary: [32, 32, 34],
    secondaryForeground: [245, 245, 245],
    muted: [32, 32, 34],
    mutedForeground: [166, 166, 166],
    accent: [32, 32, 34],
    accentForeground: [245, 245, 245],
    destructive: [248, 113, 113],
    destructiveForeground: [248, 113, 113],
    success: [52, 211, 153],
    successForeground: [52, 211, 153],
    warning: [251, 191, 36],
    warningForeground: [251, 191, 36],
    info: [96, 165, 250],
    infoForeground: [96, 165, 250],
    border: [38, 38, 40],
    input: [46, 46, 49],
    ring: [115, 115, 115],
  },
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

const isSettingsPage = (value: string | null): value is SettingsPage =>
  value === "general" || value === "appearance";

function SettingsSidebar(): JSX.Element {
  return (
    <aside class="settings-sidebar">
      <div class="settings-sidebar__title">Settings</div>
      <TabsList class="settings-sidebar__nav" variant="underline">
        <TabsTrigger class="settings-sidebar__item" value="general">
          General
        </TabsTrigger>
        <TabsTrigger class="settings-sidebar__item" value="appearance">
          Appearance
        </TabsTrigger>
      </TabsList>
    </aside>
  );
}

function SettingsSection(props: {
  readonly children: JSX.Element;
  readonly description?: string;
  readonly title: string;
}): JSX.Element {
  return (
    <section class="settings-section">
      <header class="settings-section__header">
        <h2>{props.title}</h2>
        <Show when={props.description}>
          {(description) => <p>{description()}</p>}
        </Show>
      </header>
      <Card class="settings-section__panel">{props.children}</Card>
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
    <div
      aria-label={props["aria-label"]}
      class="segmented-control"
      role="radiogroup"
    >
      <For each={props.options}>
        {(option) => (
          <button
            aria-checked={props.value === option.value}
            class="segmented-control__item"
            classList={{
              "segmented-control__item--active": props.value === option.value,
            }}
            onClick={() => props.onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
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
          onInput={(event) => commit(event.currentTarget.value)}
          type="color"
          value={hexValue()}
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
    <SettingsSection title="General">
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
        description="Check for app updates when Vexed starts."
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
              <Input
                class="settings-text-input"
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
              <div class="rounding-control">
                <input
                  max="2"
                  min="0"
                  onChange={(event) =>
                    updateThemeProfile(variant, {
                      rounding: event.currentTarget.valueAsNumber,
                    })
                  }
                  step="0.05"
                  type="range"
                  value={profile().rounding}
                />
                <span>{profile().rounding.toFixed(2)}</span>
              </div>
            }
            title="Rounding"
          />
          <div class="theme-token-list">
            <For each={THEME_TOKEN_NAMES}>
              {(name) => (
                <ThemeTokenRow
                  defaultValue={defaultThemeTokens[variant][name]}
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
    <SettingsSection title="Appearance">
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
  const [page, setPage] = createSignal<SettingsPage>("general");
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
    <AppShell class="settings-app" orientation="horizontal">
      <Tabs
        class="settings-tabs"
        onValueChange={(details) => {
          if (isSettingsPage(details.value)) {
            setPage(details.value);
          }
        }}
        orientation="vertical"
        value={page()}
      >
        <SettingsSidebar />
        <AppShellBody
          class="settings-main"
          maxWidth={false}
          orientation="horizontal"
        >
          <Show when={error()}>
            {(message) => <div class="settings-error">{message()}</div>}
          </Show>
          <TabsContent class="settings-tab-content" value="general">
            <GeneralSettings
              onPreferencesPatch={(patch) =>
                void runSettingsUpdate(
                  window.ipc.settings.updatePreferences(patch),
                )
              }
              settings={settings()}
            />
          </TabsContent>
          <TabsContent class="settings-tab-content" value="appearance">
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
        </TabsContent>
        </AppShellBody>
      </Tabs>
    </AppShell>
  );
}

mountWindow(() => <SettingsApp />);
