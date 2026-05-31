const { app, BrowserWindow } = require("electron");

const demoUrl = process.argv[2];

if (!demoUrl) {
  throw new Error("Missing UI demo URL argument");
}

const createWindow = async () => {
  const window = new BrowserWindow({
    backgroundColor: "#0f1115",
    height: 900,
    show: false,
    title: "Vexed UI Demo",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    width: 1280,
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  await window.loadURL(demoUrl);
};

app.once("window-all-closed", () => {
  app.quit();
});

app.whenReady().then(createWindow);
