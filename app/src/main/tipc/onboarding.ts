import type { TipcInstance } from "@vexed/tipc";
import { nativeTheme } from "electron";
import { getSettings } from "../settings";
import type { Settings } from "../../shared/types";

export type OnboardingSettings = Pick<
    Settings,
    "checkForUpdates" | "debug" | "launchMode" | "theme"
>;

export function createOnboardingTipcRouter(tipcInstance: TipcInstance) {
    return {
        getSettings: tipcInstance.procedure.action(async () => {
            const settings = getSettings();
            return {
                checkForUpdates: settings.getBoolean("checkForUpdates", false),
                debug: settings.getBoolean("debug", false),
                launchMode: settings.getString("launchMode", "game") as
                    | "game"
                    | "manager",
                theme: settings.getString("theme", "dark") as
                    | "dark"
                    | "light"
                    | "system",
            } satisfies OnboardingSettings;
        }),
        updateSettings: tipcInstance.procedure
            .input<OnboardingSettings>()
            .action(async ({ input }) => {
                const settings = getSettings();
                settings.set("checkForUpdates", input.checkForUpdates);
                settings.set("debug", input.debug);
                settings.set("launchMode", input.launchMode);
                settings.set("theme", input.theme);

                nativeTheme.themeSource = input.theme;

                await settings.save();
            }),
        saveSettings: tipcInstance.procedure
            .input<OnboardingSettings>()
            .action(async ({ input, context }) => {
                const settings = getSettings();
                settings.set("checkForUpdates", input.checkForUpdates);
                settings.set("debug", input.debug);
                settings.set("launchMode", input.launchMode);
                settings.set("theme", input.theme);

                nativeTheme.themeSource = input.theme;

                await settings.save();
                context.senderWindow?.close();
            }),
    };
}
