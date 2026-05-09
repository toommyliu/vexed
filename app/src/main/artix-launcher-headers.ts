const MAC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";
const LINUX_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";
const WINDOWS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";

export const getArtixLauncherUserAgent = (
  platform: NodeJS.Platform = process.platform,
): string =>
  platform === "darwin"
    ? MAC_USER_AGENT
    : platform === "linux"
      ? LINUX_USER_AGENT
      : WINDOWS_USER_AGENT;

export const getArtixLauncherRequestHeaders = (
  platform: NodeJS.Platform = process.platform,
): Record<string, string> => ({
  "User-Agent": getArtixLauncherUserAgent(platform),
  artixmode: "launcher",
  "X-Requested-With": "ShockwaveFlash/32.0.0.371",
});
