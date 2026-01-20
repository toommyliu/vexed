import { URL } from "url";
import { BrowserWindow, session } from "electron";
import { IS_MAC } from "../constants";
import { logger } from "../services/logger";

const WHITELISTED_DOMAINS = [
  "aq.com",
  "artix.com",
  "account.aq.com",
  "aqwwiki.wikidot.com",
  "heromart.com",
];

const ARTIX_USERAGENT = IS_MAC
  ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
  : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";

function isDomainWhitelisted(hostname: string): boolean {
  let normalized = hostname;
  if (hostname.startsWith("www.")) normalized = hostname.slice(4);
  return WHITELISTED_DOMAINS.includes(normalized);
}

export function applySecurityPolicy(window: BrowserWindow): void {
  window.webContents.userAgent = ARTIX_USERAGENT;
  session.defaultSession?.webRequest.onBeforeSendHeaders((details, fn) => {
    const requestHeaders = details.requestHeaders;

    Object.defineProperty(requestHeaders, "User-Agent", {
      value: ARTIX_USERAGENT,
    });
    Object.defineProperty(requestHeaders, "artixmode", {
      value: "launcher",
    });
    Object.defineProperty(requestHeaders, "X-Requested-With", {
      value: "ShockwaveFlash/32.0.0.371",
    });

    fn({ requestHeaders, cancel: false });
  });

  window.webContents.on("will-navigate", (ev, url) => {
    const parsedUrl = new URL(url);
    if (!isDomainWhitelisted(parsedUrl.hostname)) {
      logger.debug(`Blocked navigation to: ${url}`);
      ev.preventDefault();
    }
  });

  window.webContents.on("will-redirect", (ev, url) => {
    const parsedUrl = new URL(url);
    if (!isDomainWhitelisted(parsedUrl.hostname)) {
      logger.debug(`Blocked redirect to: ${url}`);
      ev.preventDefault();
    }
  });

  window.webContents.on(
    "new-window",
    async (
      ev,
      url,
      _frameName,
      _disposition,
      _options,
      _additionalFeatures,
      _referrer,
    ) => {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.hostname === "www.facebook.com" &&
        parsedUrl.searchParams.get("redirect_uri") ===
          "https://game.aq.com/game/AQWFB.html"
      ) {
        return;
      }

      if (!isDomainWhitelisted(parsedUrl.hostname)) {
        logger.debug("main", `Blocked new-window to: ${url}`);
        ev.preventDefault();
        return null;
      }

      ev.preventDefault();

      const childWindow = new BrowserWindow({
        title: "",
        parent: window,
        webPreferences: {
          nodeIntegration: false,
          plugins: true,
        },
        useContentSize: true,
      });

      applySecurityPolicy(childWindow);

      void childWindow.loadURL(url);
      return childWindow;
    },
  );
}
