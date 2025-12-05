import { DEFAULT_SETTINGS, DOCUMENTS_PATH } from "@/shared/constants";
import type { Settings } from "@/shared/types";
import Config from "@vexed/config";

let settings: Config<Settings>;

export async function initSettings(): Promise<Config<Settings>> {
    if (settings) return settings;

    settings = await Config.create<Settings>({
        configName: "settings",
        cwd: DOCUMENTS_PATH,
        defaults: DEFAULT_SETTINGS,
    });
    return settings;
}

export function getSettings(): Config<Settings> {
    if (!settings) {
        throw new Error("Settings not initialized");
    }

    return settings;
}
