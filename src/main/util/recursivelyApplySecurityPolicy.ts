import { URL } from "url";
import { BrowserWindow, session } from "electron";
import { ARTIX_USERAGENT, WHITELISTED_DOMAINS } from "../../shared/constants";

export function recursivelyApplySecurityPolicy(window: BrowserWindow): void {
  window.webContents.setUserAgent(ARTIX_USERAGENT);
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
    if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
      console.log(`[will-navigate] blocking url: ${url}`);
      ev.preventDefault();
    }
  });

  window.webContents.on("will-redirect", (ev, url) => {
    const parsedUrl = new URL(url);
    if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
      console.log(`[will-redirect] blocking url: ${url}`);
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

      if (!WHITELISTED_DOMAINS.includes(parsedUrl.hostname)) {
        console.log(`[new-window] blocking url: ${url}`);
        ev.preventDefault();
        return null;
      }

      ev.preventDefault();

      const childWindow = new BrowserWindow({
        title: "",
        parent: window,
        webPreferences: {
          nodeIntegration: false, // some sites might use jquery (e.g wiki), which conflict with nodeIntegration
          plugins: true,
        },
        useContentSize: true,
      });

      recursivelyApplySecurityPolicy(childWindow);

      // unused: the return value for window.open?
      // ev.newGuest = childWindow;
      void childWindow.loadURL(url);
      return childWindow;
    },
  );
}
